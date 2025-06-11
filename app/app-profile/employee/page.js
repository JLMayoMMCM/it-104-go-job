'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
import './employee-profile.css';

function EmployeeProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile data
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [postedJobs, setPostedJobs] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);

  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/app-login');
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
          if (response.ok) {
          const userData = await response.json();
          if (userData.user.user_type !== 'employee') {
            router.push('/unauthorized');
            return;
          }
          setCurrentUser(userData.user);
        } else {
          router.push('/app-login');
          return;
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/app-login');
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const loadInitialData = async () => {
    setProfileLoading(true);
    await loadProfile();
    setProfileLoading(false);
  };

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/employee/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setCompany(data.company);
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    }
  };

  const loadPostedJobs = async () => {
    if (postedJobs.length > 0) return; // Already loaded
    
    setJobsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/employee/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPostedJobs(data.jobs || []);
      } else {
        setError('Failed to load posted jobs');
      }
    } catch (error) {
      console.error('Error loading posted jobs:', error);
      setError('Failed to load posted jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  const loadJobApplications = async () => {
    if (jobApplications.length > 0) return; // Already loaded
    
    setApplicationsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/employee/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobApplications(data.applications || []);
      } else {
        setError('Failed to load job applications');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      setError('Failed to load job applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/app-profile/employee?tab=${tab}`, { scroll: false });
    
    // Load data for specific tabs
    if (tab === 'jobs' && postedJobs.length === 0) {
      loadPostedJobs();
    } else if (tab === 'applications' && jobApplications.length === 0) {
      loadJobApplications();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    return `₱${parseFloat(salary).toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      case 'reviewed':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const handleJobAction = (jobId, action) => {
    if (action === 'edit') {
      router.push(`/app-dashboard/employee/job-edit/${jobId}`);
    } else if (action === 'view') {
      router.push(`/app-jobs/job-view/${jobId}`);
    } else if (action === 'applications') {
      router.push(`/app-dashboard/employee/job-requests/${jobId}`);
    }
  };

  if (loading) {
    return (
      <div className="employee-profile-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-profile-container">
      <DashboardHeader user={currentUser} />
      
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-info">
            <div className="profile-avatar">
              <span className="avatar-text">
                {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="profile-details">
              <h1 className="profile-name">
                {currentUser?.firstName} {currentUser?.lastName}
              </h1>
              <p className="profile-email">{currentUser?.email}</p>
              <p className="profile-role">Employee at {company?.company_name || 'Company'}</p>
              {profile?.location && (
                <p className="profile-location">📍 {profile.location}</p>
              )}
            </div>
          </div>
          
          <div className="profile-actions">
            <button 
              onClick={() => router.push('/app-profile/employee/edit')}
              className="edit-profile-btn"
            >
              Edit Profile
            </button>
            <button 
              onClick={() => router.push('/app-profile/company')}
              className="company-profile-btn"
            >
              Company Profile
            </button>
          </div>
        </div>

        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => handleTabChange('jobs')}
          >
            Posted Jobs ({postedJobs.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => handleTabChange('applications')}
          >
            Job Applications ({jobApplications.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'profile' && (
            <div className="profile-tab">
              {profileLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading profile...</p>
                </div>
              ) : (
                <div className="profile-sections">
                  <div className="profile-section">
                    <h3>Personal Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>First Name</label>
                        <span>{currentUser?.firstName || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Last Name</label>
                        <span>{currentUser?.lastName || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Email</label>
                        <span>{currentUser?.email}</span>
                      </div>
                      <div className="info-item">
                        <label>Phone</label>
                        <span>{profile?.phone || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Date of Birth</label>
                        <span>{profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Nationality</label>
                        <span>{profile?.nationality || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h3>Employment Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Company</label>
                        <span>{company?.company_name || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Position</label>
                        <span>{profile?.position || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Department</label>
                        <span>{profile?.department || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Employee ID</label>
                        <span>{profile?.employeeId || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Hire Date</label>
                        <span>{profile?.hireDate ? formatDate(profile.hireDate) : 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  {company && (
                    <div className="profile-section">
                      <h3>Company Information</h3>
                      <div className="company-info-card">
                        <h4>{company.company_name}</h4>
                        {company.company_description && (
                          <p className="company-description">{company.company_description}</p>
                        )}
                        <div className="company-details">
                          {company.company_website && (
                            <div className="company-detail">
                              <span className="detail-icon">🌐</span>
                              <a href={company.company_website} target="_blank" rel="noopener noreferrer">
                                {company.company_website}
                              </a>
                            </div>
                          )}
                          {company.company_email && (
                            <div className="company-detail">
                              <span className="detail-icon">✉️</span>
                              <a href={`mailto:${company.company_email}`}>
                                {company.company_email}
                              </a>
                            </div>
                          )}
                          {company.company_phone && (
                            <div className="company-detail">
                              <span className="detail-icon">📞</span>
                              <span>{company.company_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="jobs-tab">
              <div className="tab-header">
                <h3>Posted Jobs</h3>
                <p>Manage the jobs you've posted for your company</p>
                <button 
                  onClick={() => router.push('/app-dashboard/employee/job-add')}
                  className="add-job-btn"
                >
                  + Post New Job
                </button>
              </div>
              
              {jobsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading posted jobs...</p>
                </div>
              ) : postedJobs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💼</div>
                  <h4>No jobs posted yet</h4>
                  <p>Start posting jobs to attract qualified candidates.</p>
                  <button 
                    onClick={() => router.push('/app-dashboard/employee/job-add')}
                    className="add-job-btn"
                  >
                    Post Your First Job
                  </button>
                </div>
              ) : (
                <div className="jobs-list">
                  {postedJobs.map(job => (
                    <div key={job.job_id} className="job-card">
                      <div className="job-header">
                        <div className="job-info">
                          <h4 className="job-title">{job.job_name}</h4>
                          <p className="job-location">📍 {job.job_location}</p>
                          <p className="job-type">💼 {job.job_type_name}</p>
                        </div>
                        <div className={`job-status ${job.job_is_active ? 'active' : 'inactive'}`}>
                          {job.job_is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      
                      <div className="job-details">
                        <div className="job-meta">
                          <span>Posted: {formatDate(job.job_posted_date)}</span>
                          <span>Salary: {formatSalary(job.job_salary)}</span>
                          {job.job_closing_date && (
                            <span>Deadline: {formatDate(job.job_closing_date)}</span>
                          )}
                        </div>
                        
                        <p className="job-description">
                          {job.job_description?.substring(0, 150)}...
                        </p>
                      </div>
                      
                      <div className="job-actions">
                        <button 
                          onClick={() => handleJobAction(job.job_id, 'view')}
                          className="action-btn view-btn"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleJobAction(job.job_id, 'edit')}
                          className="action-btn edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleJobAction(job.job_id, 'applications')}
                          className="action-btn applications-btn"
                        >
                          Applications ({job.application_count || 0})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="applications-tab">
              <div className="tab-header">
                <h3>Job Applications</h3>
                <p>Review and manage applications for your posted jobs</p>
              </div>
              
              {applicationsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading applications...</p>
                </div>
              ) : jobApplications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h4>No applications yet</h4>
                  <p>Applications for your posted jobs will appear here.</p>
                </div>
              ) : (
                <div className="applications-list">
                  {jobApplications.map(application => (
                    <div key={application.request_id} className="application-card">
                      <div className="application-header">
                        <div className="applicant-info">
                          <h4 className="applicant-name">
                            {application.applicant_name}
                          </h4>
                          <p className="job-applied">Applied for: {application.job_name}</p>
                        </div>
                        <div 
                          className="application-status"
                          style={{ backgroundColor: getStatusColor(application.request_status) }}
                        >
                          {application.request_status}
                        </div>
                      </div>
                      
                      <div className="application-details">
                        <div className="detail-item">
                          <span className="detail-label">Applied on:</span>
                          <span>{formatDate(application.request_date)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Email:</span>
                          <span>{application.applicant_email}</span>
                        </div>
                      </div>
                      
                      {application.cover_letter && (
                        <div className="cover-letter">
                          <h5>Cover Letter:</h5>
                          <p>{application.cover_letter}</p>
                        </div>
                      )}
                      
                      <div className="application-actions">
                        <button 
                          onClick={() => router.push(`/app-dashboard/employee/application-view/${application.request_id}`)}
                          className="view-application-btn"
                        >
                          View Full Application
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeProfile() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployeeProfileContent />
    </Suspense>
  );
}
