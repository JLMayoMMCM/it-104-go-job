'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardHeader from '../../../components/DashboardHeader';
import './job-view.css';

export default function JobView() {
  const router = useRouter();
  const params = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData.user);
          }
        } catch (error) {
          console.error('Error checking auth:', error);
        }
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (params.id) {
      loadJob();
    }
  }, [params.id]);

  useEffect(() => {
    if (currentUser && job) {
      checkJobStatus();
    }
  }, [currentUser, job]);

  const loadJob = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/jobs/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Job not found');
      }

      const data = await response.json();
      setJob(data.job);
    } catch (error) {
      console.error('Error loading job:', error);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkJobStatus = async () => {
    if (currentUser?.userType !== 'job-seeker') return;

    try {
      const token = localStorage.getItem('authToken');
      
      // Check if job is saved
      const savedResponse = await fetch(`/api/saved-jobs/check?jobId=${job.job_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (savedResponse.ok) {
        const savedData = await savedResponse.json();
        setIsSaved(savedData.isSaved);
      }

      // Check if already applied
      const appliedResponse = await fetch(`/api/job-applications/check?jobId=${job.job_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (appliedResponse.ok) {
        const appliedData = await appliedResponse.json();
        setHasApplied(appliedData.hasApplied);
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  };

  const handleApply = async () => {
    if (!currentUser) {
      router.push('/app-login');
      return;
    }

    if (currentUser.userType !== 'job-seeker') {
      alert('Only job seekers can apply for jobs.');
      return;
    }

    setApplying(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: job.job_id
        })
      });

      if (response.ok) {
        setHasApplied(true);
        alert('Application submitted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleSaveJob = async () => {
    if (!currentUser) {
      router.push('/app-login');
      return;
    }

    if (currentUser.userType !== 'job-seeker') {
      alert('Only job seekers can save jobs.');
      return;
    }

    setSaving(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const url = isSaved ? `/api/saved-jobs/${job.job_id}` : '/api/saved-jobs';
      const method = isSaved ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: !isSaved ? JSON.stringify({ jobId: job.job_id }) : undefined
      });

      if (response.ok) {
        setIsSaved(!isSaved);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save job');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Failed to save job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Salary not specified';
    return `₱${parseFloat(salary).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const getCompanyRating = () => {
    if (!job.job_rating || parseFloat(job.job_rating) === 0) return null;
    return parseFloat(job.job_rating).toFixed(1);
  };

  const goBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="job-view-container">
        {currentUser && <DashboardHeader user={currentUser} />}
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-view-container">
        {currentUser && <DashboardHeader user={currentUser} />}
        <div className="error-container">
          <h2>Job Not Found</h2>
          <p>{error || 'The job you are looking for does not exist or has been removed.'}</p>
          <button onClick={goBack} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-view-container">
      {currentUser && <DashboardHeader user={currentUser} />}
      
      <div className="job-view-content">
        <div className="job-view-header">
          <button onClick={goBack} className="back-btn">
            ← Back to Jobs
          </button>
          
          <div className="job-actions">
            {currentUser?.userType === 'job-seeker' && (
              <>
                <button 
                  onClick={handleSaveJob}
                  disabled={saving}
                  className={`save-btn ${isSaved ? 'saved' : ''}`}
                >
                  {saving ? 'Saving...' : isSaved ? '❤️ Saved' : '🤍 Save Job'}
                </button>
                
                <button 
                  onClick={handleApply}
                  disabled={applying || hasApplied}
                  className={`apply-btn ${hasApplied ? 'applied' : ''}`}
                >
                  {applying ? 'Applying...' : hasApplied ? '✓ Applied' : 'Apply Now'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="job-details-layout">
          {/* Main Job Information */}
          <div className="job-main-content">
            <div className="job-title-section">
              <h1 className="job-title">{job.job_name}</h1>
              <div className="company-info">
                <h2 className="company-name">{job.company_name}</h2>
                {getCompanyRating() && (
                  <div className="company-rating">
                    <span className="rating-icon">⭐</span>
                    <span>{getCompanyRating()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="job-meta">
              <div className="meta-item">
                <span className="meta-icon">📍</span>
                <span>{job.job_location}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">💼</span>
                <span>{job.job_type_name}</span>
              </div>
              {job.job_time && (
                <div className="meta-item">
                  <span className="meta-icon">🕒</span>
                  <span>{job.job_time}</span>
                </div>
              )}
              <div className="meta-item">
                <span className="meta-icon">💰</span>
                <span>{formatSalary(job.job_salary)}</span>
              </div>
              {job.job_quantity > 1 && (
                <div className="meta-item">
                  <span className="meta-icon">👥</span>
                  <span>{job.job_quantity} position{job.job_quantity !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            <div className="job-categories">
              {job.category_fields && job.category_fields.length > 0 && (
                <div className="category-group">
                  <span className="category-label">Fields:</span>
                  {job.category_fields.map((field, index) => (
                    <span key={index} className="category-tag field-tag">
                      {field}
                    </span>
                  ))}
                </div>
              )}
              {job.job_categories && job.job_categories.length > 0 && (
                <div className="category-group">
                  <span className="category-label">Categories:</span>
                  {job.job_categories.map((category, index) => (
                    <span key={index} className="category-tag job-category-tag">
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="job-description-section">
              <h3>Job Description</h3>
              <div className="job-description">
                {job.job_description ? (
                  job.job_description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                ) : (
                  <p>No description provided.</p>
                )}
              </div>
            </div>

            {job.job_requirements && (
              <div className="job-requirements-section">
                <h3>Requirements</h3>
                <div className="job-requirements">
                  {job.job_requirements.split('\n').map((requirement, index) => (
                    <p key={index}>{requirement}</p>
                  ))}
                </div>
              </div>
            )}

            {job.job_benefits && (
              <div className="job-benefits-section">
                <h3>Benefits</h3>
                <div className="job-benefits">
                  {job.job_benefits.split('\n').map((benefit, index) => (
                    <p key={index}>{benefit}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar with Company Info */}
          <div className="job-sidebar">
            <div className="company-details-card">
              <h3>About the Company</h3>
              
              <div className="company-name-large">{job.company_name}</div>
              
              {job.company_description && (
                <div className="company-description">
                  {job.company_description}
                </div>
              )}

              <div className="company-contact">
                {job.company_website && (
                  <div className="contact-item">
                    <span className="contact-icon">🌐</span>
                    <a href={job.company_website} target="_blank" rel="noopener noreferrer">
                      Visit Website
                    </a>
                  </div>
                )}
                
                {job.company_email && (
                  <div className="contact-item">
                    <span className="contact-icon">✉️</span>
                    <a href={`mailto:${job.company_email}`}>
                      {job.company_email}
                    </a>
                  </div>
                )}
                
                {job.company_phone && (
                  <div className="contact-item">
                    <span className="contact-icon">📞</span>
                    <a href={`tel:${job.company_phone}`}>
                      {job.company_phone}
                    </a>
                  </div>
                )}

                {job.company_address && (
                  <div className="contact-item">
                    <span className="contact-icon">📍</span>
                    <div>
                      {job.company_address.address_line}<br />
                      {job.company_address.city}, {job.company_address.province}<br />
                      {job.company_address.postal_code}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="job-dates-card">
              <h3>Important Dates</h3>
              
              <div className="date-item">
                <span className="date-label">Posted:</span>
                <span>{formatDate(job.job_posted_date)}</span>
              </div>
              
              {job.job_hiring_date && (
                <div className="date-item">
                  <span className="date-label">Hiring Date:</span>
                  <span>{formatDate(job.job_hiring_date)}</span>
                </div>
              )}
              
              {job.job_closing_date && (
                <div className="date-item">
                  <span className="date-label">Application Deadline:</span>
                  <span>{formatDate(job.job_closing_date)}</span>
                </div>
              )}
            </div>

            {/* Apply Section for Mobile */}
            {currentUser?.userType === 'job-seeker' && (
              <div className="mobile-apply-section">
                <button 
                  onClick={handleSaveJob}
                  disabled={saving}
                  className={`save-btn ${isSaved ? 'saved' : ''}`}
                >
                  {saving ? 'Saving...' : isSaved ? '❤️ Saved' : '🤍 Save Job'}
                </button>
                
                <button 
                  onClick={handleApply}
                  disabled={applying || hasApplied}
                  className={`apply-btn ${hasApplied ? 'applied' : ''}`}
                >
                  {applying ? 'Applying...' : hasApplied ? '✓ Applied' : 'Apply Now'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
