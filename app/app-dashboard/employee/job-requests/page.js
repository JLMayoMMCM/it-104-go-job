'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { requireAuth, getAuthHeaders } from '../../../lib/auth';
import DashboardHeader from '../../../components/DashboardHeader';
import './job-requests.css';

function JobRequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(searchParams.get('job') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    const auth = requireAuth(router);
    if (!auth) return;
    
    fetchUserData();
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [selectedJob, statusFilter, currentPage]);

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
        if (data.user.user_type !== 'employee') {
          router.push('/unauthorized');
          return;
        }
        setUser(data.user);
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
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (selectedJob) params.append('jobId', selectedJob);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/employee/applications?${params}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus, notes = '') => {
    setUpdating(prev => ({ ...prev, [applicationId]: true }));
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/employee/applications', {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId,
          status: newStatus,
          notes
        })
      });

      if (response.ok) {
        // Refresh applications
        fetchApplications();
        alert('Application status updated successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed to update application: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application. Please try again.');
    } finally {
      setUpdating(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f39c12';
      case 'reviewing':
        return '#3498db';
      case 'accepted':
        return '#27ae60';
      case 'rejected':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    return `₱${parseFloat(salary).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="job-requests-page">
        <DashboardHeader user={user} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="job-requests-page">
      <DashboardHeader user={user} />
      
      <div className="job-requests-container">
        <div className="page-header">
          <h1>Job Applications</h1>
          <p>Review and manage applications for your posted jobs</p>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="job-filter">Filter by Job:</label>
            <select 
              id="job-filter"
              value={selectedJob} 
              onChange={(e) => {
                setSelectedJob(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Jobs</option>
              {jobs.map(job => (
                <option key={job.job_id} value={job.job_id}>
                  {job.job_name} ({job.application_count || 0} applications)
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select 
              id="status-filter"
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="applications-summary">
          <p>
            Showing {applications.length} of {totalItems} applications
            {selectedJob && ` for selected job`}
            {statusFilter && ` with status: ${statusFilter}`}
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No applications found</h3>
            <p>
              {selectedJob || statusFilter 
                ? 'Try adjusting your filters to see more applications.' 
                : 'Applications for your posted jobs will appear here.'}
            </p>
          </div>
        ) : (
          <div className="applications-list">
            {applications.map(application => (
              <div key={application.id} className="application-card">
                <div className="application-header">
                  <div className="applicant-info">
                    <h3>{application.jobseekers?.first_name} {application.jobseekers?.last_name}</h3>
                    <p className="job-title">Applied for: {application.jobs?.title}</p>
                    <p className="application-date">Applied on: {formatDate(application.applied_at)}</p>
                  </div>
                  <div 
                    className="application-status"
                    style={{ backgroundColor: getStatusColor(application.status) }}
                  >
                    {application.status}
                  </div>
                </div>

                <div className="application-details">
                  <div className="applicant-details">
                    <div className="detail-row">
                      <span className="label">Email:</span>
                      <span>{application.jobseekers?.email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Phone:</span>
                      <span>{application.jobseekers?.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Experience:</span>
                      <span>{application.jobseekers?.experience_level || 'Not specified'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Location:</span>
                      <span>{application.jobseekers?.preferred_location || 'Not specified'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Expected Salary:</span>
                      <span>
                        {application.jobseekers?.preferred_salary_min && application.jobseekers?.preferred_salary_max
                          ? `₱${application.jobseekers.preferred_salary_min.toLocaleString()} - ₱${application.jobseekers.preferred_salary_max.toLocaleString()}`
                          : 'Not specified'}
                      </span>
                    </div>
                  </div>

                  {application.jobseekers?.profile_summary && (
                    <div className="profile-summary">
                      <h4>Profile Summary:</h4>
                      <p>{application.jobseekers.profile_summary}</p>
                    </div>
                  )}

                  {application.jobseekers?.skills && (
                    <div className="skills-section">
                      <h4>Skills:</h4>
                      <p>{application.jobseekers.skills}</p>
                    </div>
                  )}

                  {application.cover_letter && (
                    <div className="cover-letter">
                      <h4>Cover Letter:</h4>
                      <p>{application.cover_letter}</p>
                    </div>
                  )}

                  {application.notes && (
                    <div className="application-notes">
                      <h4>Internal Notes:</h4>
                      <p>{application.notes}</p>
                    </div>
                  )}
                </div>

                <div className="application-actions">
                  {application.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(application.id, 'reviewing')}
                        disabled={updating[application.id]}
                        className="btn-review"
                      >
                        {updating[application.id] ? 'Updating...' : 'Mark as Reviewing'}
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Add any notes for accepting this applicant:');
                          handleStatusUpdate(application.id, 'accepted', notes || '');
                        }}
                        disabled={updating[application.id]}
                        className="btn-accept"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Add reason for rejection (optional):');
                          handleStatusUpdate(application.id, 'rejected', notes || '');
                        }}
                        disabled={updating[application.id]}
                        className="btn-reject"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {application.status === 'reviewing' && (
                    <>
                      <button
                        onClick={() => {
                          const notes = prompt('Add any notes for accepting this applicant:');
                          handleStatusUpdate(application.id, 'accepted', notes || '');
                        }}
                        disabled={updating[application.id]}
                        className="btn-accept"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Add reason for rejection (optional):');
                          handleStatusUpdate(application.id, 'rejected', notes || '');
                        }}
                        disabled={updating[application.id]}
                        className="btn-reject"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {application.jobseekers?.resume_url && (
                    <a
                      href={application.jobseekers.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-resume"
                    >
                      View Resume
                    </a>
                  )}

                  <button
                    onClick={() => router.push(`/app-jobs/job-view/${application.job_id}`)}
                    className="btn-view-job"
                  >
                    View Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>      )}
      </div>
    </div>
  );
}

export default function JobRequests() {
  return (
    <Suspense fallback={<div>Loading job requests...</div>}>
      <JobRequestsContent />
    </Suspense>
  );
}
