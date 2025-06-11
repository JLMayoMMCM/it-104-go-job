'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
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
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
    } else if (activeTab === 'jobs') {
      fetchJobs();
    } else if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Check if user is a company owner/admin
        if (data.user.user_type !== 'employee') {
          router.push('/app-login');
          return;
        }

        // Fetch company data
        const companyResponse = await fetch('/api/company/profile');
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          setCompany(companyData.company);
          setFormData(companyData.company);
        }
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

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/company/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/company/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/company/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/company/profile', {
        method: 'PUT',
        headers: {
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
        alert('Failed to update company profile');
      }
    } catch (error) {
      console.error('Error updating company profile:', error);
      alert('Error updating company profile');
    }
  };

  const handleCancel = () => {
    setFormData(company);
    setIsEditing(false);
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
          <h1>{company?.name || 'Company Profile'}</h1>
          <p>Manage your company information and settings</p>
        </div>

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
          )}
        </div>
      </div>
    </div>
  );
}
