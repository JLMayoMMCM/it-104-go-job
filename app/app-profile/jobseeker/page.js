'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
import JobCard from '../../components/JobCard';
import './jobseeker-profile.css';

function JobseekerProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile data
  const [profile, setProfile] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);
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
          if (userData.user.user_type !== 'job-seeker') {
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
      const response = await fetch('/api/jobseeker/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setPreferences(data.preferences || []);
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    }
  };

  const loadSavedJobs = async () => {
    if (savedJobs.length > 0) return; // Already loaded
    
    setSavedJobsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/saved-jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSavedJobs(data.savedJobs || []);
      } else {
        setError('Failed to load saved jobs');
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      setError('Failed to load saved jobs');
    } finally {
      setSavedJobsLoading(false);
    }
  };

  const loadApplications = async () => {
    if (applications.length > 0) return; // Already loaded
    
    setApplicationsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/job-applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      } else {
        setError('Failed to load applications');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      setError('Failed to load applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const loadRecommendedJobs = async () => {
    if (recommendedJobs.length > 0) return; // Already loaded
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/jobs/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendedJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/app-profile/jobseeker?tab=${tab}`, { scroll: false });
    
    // Load data for specific tabs
    if (tab === 'saved' && savedJobs.length === 0) {
      loadSavedJobs();
    } else if (tab === 'applications' && applications.length === 0) {
      loadApplications();
    } else if (tab === 'recommendations' && recommendedJobs.length === 0) {
      loadRecommendedJobs();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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

  if (loading) {
    return (
      <div className="jobseeker-profile-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jobseeker-profile-container">
      <DashboardHeader user={currentUser} />
      
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-info">            <div className="profile-avatar">
              {currentUser?.account_id ? (
                <img 
                  src={`/api/profile-picture/${currentUser.account_id}`}
                  alt="Profile"
                  className="avatar-image"
                  onLoad={(e) => {
                    e.target.style.display = 'block';
                    e.target.nextSibling.style.display = 'none';
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  style={{ display: 'block' }}
                />
              ) : null}
              <span 
                className="avatar-text" 
                style={{ 
                  display: 'none' 
                }}
              >
                {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="profile-details">
              <h1 className="profile-name">
                {currentUser?.firstName} {currentUser?.lastName}
              </h1>
              <p className="profile-email">{currentUser?.email}</p>
              {profile?.location && (
                <p className="profile-location">📍 {profile.location}</p>
              )}
            </div>
          </div>
          
          <div className="profile-actions">
            <button 
              onClick={() => router.push('/app-profile/jobseeker/edit')}
              className="edit-profile-btn"
            >
              Edit Profile
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
            className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => handleTabChange('recommendations')}
          >
            Job Recommendations
          </button>
          <button 
            className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => handleTabChange('saved')}
          >
            Saved Jobs ({savedJobs.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => handleTabChange('applications')}
          >
            My Applications ({applications.length})
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
                    <h3>Professional Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Skills</label>
                        <span>{profile?.skills || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Experience Level</label>
                        <span>{profile?.experienceLevel || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <label>Preferred Location</label>
                        <span>{profile?.preferredLocation || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>                  {preferences.length > 0 && (
                    <div className="profile-section">
                      <h3>Job Preferences</h3>
                      <div className="preferences-list">
                        {preferences.map((pref, index) => (
                          <span key={index} className="preference-tag">
                            {pref.job_category_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resume Section */}
                  <div className="profile-section">
                    <h3>Resume</h3>
                    {profile?.resume_file ? (
                      <div className="resume-container">
                        <div className="resume-info">
                          <div className="resume-file">
                            <span className="resume-icon">📄</span>
                            <span className="resume-name">{profile.resume_file}</span>
                            <button 
                              onClick={() => window.open(`/api/resume/download/${profile.resume_file}`, '_blank')}
                              className="download-resume-btn"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                        
                        {/* Resume Preview for PDF files */}
                        {profile.resume_file.toLowerCase().endsWith('.pdf') && (
                          <div className="resume-preview">
                            <h4>Resume Preview</h4>
                            <iframe
                              src={`/uploads/resumes/${profile.resume_file}`}
                              width="100%"
                              height="500px"
                              title="Resume Preview"
                              style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="no-resume">
                        <p>No resume uploaded yet.</p>
                        <button 
                          onClick={() => router.push('/app-profile/jobseeker/edit')}
                          className="upload-resume-btn"
                        >
                          Upload Resume
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="recommendations-tab">
              <div className="tab-header">
                <h3>Job Recommendations</h3>
                <p>Jobs that match your preferences and profile</p>
              </div>
              
              {recommendedJobs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⭐</div>
                  <h4>No recommendations yet</h4>
                  <p>Complete your profile and set job preferences to get personalized job recommendations.</p>
                  <button 
                    onClick={() => handleTabChange('profile')}
                    className="edit-profile-btn"
                  >
                    Complete Profile
                  </button>
                </div>
              ) : (
                <div className="jobs-grid">
                  {recommendedJobs.map(job => (
                    <JobCard 
                      key={job.job_id} 
                      job={job} 
                      showPreferenceMatch={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="saved-jobs-tab">
              <div className="tab-header">
                <h3>Saved Jobs</h3>
                <p>Jobs you've saved for later review</p>
              </div>
              
              {savedJobsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading saved jobs...</p>
                </div>
              ) : savedJobs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">❤️</div>
                  <h4>No saved jobs</h4>
                  <p>Start exploring jobs and save the ones you're interested in.</p>
                  <button 
                    onClick={() => router.push('/app-jobs/jobs-all')}
                    className="browse-jobs-btn"
                  >
                    Browse Jobs
                  </button>
                </div>
              ) : (
                <div className="jobs-grid">
                  {savedJobs.map(job => (
                    <JobCard 
                      key={job.job_id} 
                      job={job}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="applications-tab">
              <div className="tab-header">
                <h3>My Applications</h3>
                <p>Track the status of your job applications</p>
              </div>
              
              {applicationsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📄</div>
                  <h4>No applications yet</h4>
                  <p>Start applying for jobs to track your applications here.</p>
                  <button 
                    onClick={() => router.push('/app-jobs/jobs-all')}
                    className="browse-jobs-btn"
                  >
                    Browse Jobs
                  </button>
                </div>
              ) : (
                <div className="applications-list">
                  {applications.map(application => (
                    <div key={application.request_id} className="application-card">
                      <div className="application-header">
                        <div className="application-job">
                          <h4 className="job-title">{application.job.job_name}</h4>
                          <p className="company-name">{application.job.company_name}</p>
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
                          <span className="detail-label">Location:</span>
                          <span>{application.job.job_location}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Job Type:</span>
                          <span>{application.job.job_type_name}</span>
                        </div>
                      </div>
                      
                      {application.employee_response && (
                        <div className="application-response">
                          <h5>Employer Response:</h5>
                          <p>{application.employee_response}</p>
                          <small>Responded on: {formatDate(application.response_date)}</small>
                        </div>
                      )}
                      
                      <div className="application-actions">
                        <button 
                          onClick={() => router.push(`/app-jobs/job-view/${application.job.job_id}`)}
                          className="view-job-btn"
                        >
                          View Job
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

export default function JobseekerProfile() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobseekerProfileContent />
    </Suspense>
  );
}
