'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
import { requireAuth, getAuthHeaders } from '../../lib/auth';
import './company-profile.css';

export default function CompanyProfile() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  
  // New state for enhanced features
  const [analytics, setAnalytics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const router = useRouter();

  useEffect(() => {
    const auth = requireAuth(router);
    if (!auth) return;
    
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
    } else if (activeTab === 'jobs') {
      fetchJobs();
    } else if (activeTab === 'applications') {
      fetchApplications();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        router.push('/app-login');
        return;
      }

      const response = await fetch('/api/auth/me', { headers });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Check if user is a company owner/admin
        if (data.user.user_type !== 'employee') {
          router.push('/app-login');
          return;
        }

        // Fetch company data
        await fetchCompanyData();
        await fetchRecentActivity();
      } else {
        router.push('/app-login');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.push('/app-login');
    } finally {
      setLoading(false);
    }
  };
  const fetchCompanyData = async () => {
    try {
      const headers = getAuthHeaders();
      const companyResponse = await fetch('/api/company/profile', { headers });
      
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData.company);
        setFormData(companyData.company || {});
      } else if (companyResponse.status === 404) {
        // Employee is not associated with any company
        setCompany(null);
        setFormData({});
        console.log('Employee is not associated with any company');
      } else {
        console.error('Error fetching company data:', companyResponse.statusText);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/employee/analytics', { headers });
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/company/employees', { headers });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/employee/jobs', { headers });
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/employee/applications', { headers });
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };
  const fetchAnalytics = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/company/analytics', { headers });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const headers = getAuthHeaders();
      delete headers['Content-Type']; // Let browser set content type for FormData

      const response = await fetch('/api/company/logo', {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(prev => ({ ...prev, logo_url: data.logoUrl }));
        setFormData(prev => ({ ...prev, logo_url: data.logoUrl }));
        setLogoPreview(null);
        alert('Logo uploaded successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to upload logo: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error uploading logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/company/profile', {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
        setIsEditing(false);
        alert('Company profile updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update company profile: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating company profile:', error);
      alert('Error updating company profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(company || {});
    setIsEditing(false);
    setLogoPreview(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#ffc107';
      case 'accepted': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'reviewed': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading company profile...</p>
      </div>
    );
  }
  return (
    <div className="company-profile-page">
      <DashboardHeader user={user} />
      
      <div className="company-profile-container">
        <div className="company-profile-header">
          <h1>{company?.company_name || 'Company Profile'}</h1>
          <p>Manage your company information and settings</p>
        </div>

        {/* Check if employee is associated with a company */}
        {!company ? (
          <div className="no-company-association">
            <div className="info-card">
              <h2>🏢 No Company Association</h2>
              <p>You are not currently associated with any company. To access company features, you need to be associated with a company.</p>
              
              <div className="association-options">
                <h3>How to get associated with a company:</h3>
                <ul>
                  <li>Contact your company's HR department to add you to their employee list</li>
                  <li>Ask your manager to associate your account with the company</li>
                  <li>If you're a company owner, register your company first</li>
                </ul>
              </div>
              
              <div className="help-actions">
                <button 
                  className="help-btn"
                  onClick={() => router.push('/app-profile/employee')}
                >
                  View Your Employee Profile
                </button>
                <button 
                  className="help-btn secondary"
                  onClick={() => router.push('/app-dashboard')}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="company-profile-tabs">
              <button 
                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Company Info
              </button>
              <button 
                className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
                onClick={() => setActiveTab('employees')}
              >
                Employees
              </button>
              <button 
                className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
                onClick={() => setActiveTab('jobs')}
              >
                Posted Jobs
              </button>
              <button 
                className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
              >
                Applications
              </button>
              <button 
                className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
            Analytics
          </button>
        </div>

        <div className="company-profile-content">
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <div className="profile-header">
                <h2>Company Information</h2>
                {!isEditing ? (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-btn" onClick={handleSave}>Save</button>
                    <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                  </div>
                )}
              </div>

              <div className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Company Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p>{company?.name || 'Not specified'}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Industry</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p>{company?.industry || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  {isEditing ? (
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      rows="4"
                    />
                  ) : (
                    <p>{company?.description || 'No description provided'}</p>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Website</label>
                    {isEditing ? (
                      <input
                        type="url"
                        name="website"
                        value={formData.website || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p>{company?.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer">
                          {company.website}
                        </a>
                      ) : 'Not specified'}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Company Size</label>
                    {isEditing ? (
                      <select
                        name="company_size"
                        value={formData.company_size || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                        <option value="1000+">1000+ employees</option>
                      </select>
                    ) : (
                      <p>{company?.company_size || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  ) : (
                    <p>{company?.address || 'No address provided'}</p>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p>{company?.phone || 'Not specified'}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p>{company?.email || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                <div className="form-group logo-upload">
                  <label>Company Logo</label>
                  {isEditing ? (
                    <div className="logo-upload-container">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                      {uploadingLogo && <span className="uploading-spinner"></span>}
                      {logoPreview && (
                        <div className="logo-preview">
                          <img src={logoPreview} alt="Logo Preview" />
                        </div>
                      )}
                    </div>
                  ) : (
                    company?.logo_url ? (
                      <div className="logo-preview">
                        <img src={company.logo_url} alt="Company Logo" />
                      </div>
                    ) : (
                      <p>No logo uploaded</p>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="employees-tab">
              <div className="section-header">
                <h2>Company Employees</h2>
                <button className="add-btn">Add Employee</button>
              </div>
              
              <div className="employees-list">
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <div key={employee.id} className="employee-card">
                      <div className="employee-info">
                        <h3>{employee.first_name} {employee.last_name}</h3>
                        <p className="employee-email">{employee.email}</p>
                        <p className="employee-role">{employee.job_title || 'Employee'}</p>
                      </div>
                      <div className="employee-actions">
                        <button className="btn-secondary">Edit</button>
                        <button className="btn-danger">Remove</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No employees found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="jobs-tab">
              <div className="section-header">
                <h2>Posted Jobs</h2>
                <button className="add-btn">Post New Job</button>
              </div>
              
              <div className="jobs-list">
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <div key={job.id} className="job-card">
                      <div className="job-info">
                        <h3>{job.title}</h3>
                        <p className="job-location">{job.location}</p>
                        <p className="job-type">{job.job_type}</p>
                        <p className="job-salary">
                          ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                        </p>
                      </div>
                      <div className="job-stats">
                        <span className="applications-count">
                          {job.applications_count || 0} applications
                        </span>
                        <span className={`job-status ${job.status}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="job-actions">
                        <button className="btn-secondary">Edit</button>
                        <button className="btn-secondary">View Applications</button>
                        <button className="btn-danger">Delete</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No jobs posted yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="applications-tab">
              <h2>Recent Applications</h2>
              
              <div className="applications-list">
                {applications.length > 0 ? (
                  applications.map((application) => (
                    <div key={application.id} className="application-card">
                      <div className="application-info">
                        <h3>{application.jobseeker?.first_name} {application.jobseeker?.last_name}</h3>
                        <p className="application-job">{application.job?.title}</p>
                        <p className="application-date">
                          Applied: {new Date(application.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="application-status">
                        <span className={`status-badge ${application.status}`}>
                          {application.status}
                        </span>
                      </div>
                      <div className="application-actions">
                        <button className="btn-secondary">View Details</button>
                        <button className="btn-primary">Review</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No applications found</p>
                  </div>
                )}
              </div>
            </div>
          )}          {activeTab === 'analytics' && (
            <div className="analytics-tab">
              <div className="analytics-header">
                <h2>Company Analytics Dashboard</h2>
                <div className="analytics-controls">
                  <select className="time-range-select">
                    <option value="30">Last 30 days</option>
                    <option value="60">Last 60 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
              </div>
              
              {analytics ? (
                <div className="analytics-content">
                  {/* Overview Cards */}
                  <div className="analytics-overview">
                    <div className="overview-card">
                      <div className="card-icon">🏢</div>
                      <div className="card-content">
                        <h3>Total Jobs</h3>
                        <p className="card-value">{analytics.overview?.totalJobs || 0}</p>
                        <span className="card-label">Active: {analytics.overview?.activeJobs || 0}</span>
                      </div>
                    </div>
                    
                    <div className="overview-card">
                      <div className="card-icon">📋</div>
                      <div className="card-content">
                        <h3>Applications</h3>
                        <p className="card-value">{analytics.overview?.totalApplications || 0}</p>
                        <span className={`card-label ${analytics.trends?.applicationsChange >= 0 ? 'positive' : 'negative'}`}>
                          {analytics.trends?.applicationsChange >= 0 ? '↗' : '↘'} {Math.abs(analytics.trends?.applicationsChange || 0)} from last period
                        </span>
                      </div>
                    </div>
                    
                    <div className="overview-card">
                      <div className="card-icon">👥</div>
                      <div className="card-content">
                        <h3>Employees</h3>
                        <p className="card-value">{analytics.overview?.totalEmployees || 0}</p>
                        <span className="card-label">Active team members</span>
                      </div>
                    </div>
                    
                    <div className="overview-card">
                      <div className="card-icon">📊</div>
                      <div className="card-content">
                        <h3>Hiring Rate</h3>
                        <p className="card-value">{analytics.overview?.hiringRate || 0}%</p>
                        <span className="card-label">Average response: {analytics.overview?.averageResponseTime || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Application Status Breakdown */}
                  <div className="analytics-section">
                    <h3>Application Status Breakdown</h3>
                    <div className="status-breakdown">
                      {analytics.breakdowns?.applicationStatusBreakdown?.map((status, index) => (
                        <div key={index} className="status-item">
                          <div className="status-bar">
                            <div 
                              className={`status-fill status-${status.status}`}
                              style={{ width: `${status.percentage}%` }}
                            ></div>
                          </div>
                          <div className="status-details">
                            <span className="status-name">{status.status}</span>
                            <span className="status-count">{status.count} ({status.percentage}%)</span>
                          </div>
                        </div>
                      )) || <p>No application data available</p>}
                    </div>
                  </div>

                  {/* Top Performing Jobs */}
                  <div className="analytics-section">
                    <h3>Top Performing Jobs</h3>
                    <div className="top-jobs">
                      {analytics.breakdowns?.topPerformingJobs?.map((job, index) => (
                        <div key={job.job_id} className="job-performance-card">
                          <div className="job-rank">{index + 1}</div>
                          <div className="job-details">
                            <h4>{job.job_name}</h4>
                            <p className="job-category">{job.job_category}</p>
                          </div>
                          <div className="job-metrics">
                            <span className="metric">
                              <strong>{job.applications}</strong> applications
                            </span>
                            <span className="metric">
                              <strong>{job.acceptanceRate}%</strong> acceptance rate
                            </span>
                          </div>
                        </div>
                      )) || <p>No job performance data available</p>}
                    </div>
                  </div>

                  {/* Monthly Trends */}
                  <div className="analytics-section">
                    <h3>Application Trends (Last 6 Months)</h3>
                    <div className="trends-chart">
                      {analytics.trends?.monthlyTrends?.map((month, index) => (
                        <div key={index} className="trend-bar">
                          <div 
                            className="trend-fill"
                            style={{ 
                              height: `${Math.max(10, (month.applications / Math.max(...analytics.trends.monthlyTrends.map(m => m.applications))) * 100)}%` 
                            }}
                          ></div>
                          <span className="trend-label">{month.month}</span>
                          <span className="trend-value">{month.applications}</span>
                        </div>
                      )) || <p>No trend data available</p>}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="analytics-section">
                    <h3>Recent Activity</h3>
                    <div className="recent-activity-list">
                      {analytics.recentActivity?.slice(0, 10).map((activity, index) => (
                        <div key={activity.id || index} className="activity-item">
                          <div className="activity-icon">{activity.icon}</div>
                          <div className="activity-content">
                            <h4>{activity.title}</h4>
                            <p>{activity.description}</p>
                            <span className="activity-time">{activity.time}</span>
                          </div>
                        </div>
                      )) || <p>No recent activity</p>}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="analytics-section">
                    <h3>Quick Actions</h3>
                    <div className="quick-actions">
                      <button 
                        className="action-btn"
                        onClick={() => router.push('/app-dashboard/employee/bulk-applications')}
                      >
                        <span>📋</span>
                        Manage Applications
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => router.push('/app-post-job')}
                      >
                        <span>➕</span>
                        Post New Job
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => router.push('/app-jobs/advanced-search')}
                      >
                        <span>🔍</span>
                        Advanced Search
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => setActiveTab('employees')}
                      >
                        <span>👥</span>
                        Manage Team
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="analytics-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading analytics...</p>
                </div>              )}
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
