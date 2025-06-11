'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { requireAuth, getAuthHeaders } from '../../lib/auth';
import DashboardHeader from '../../components/DashboardHeader';
import '../dashboard.css';

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentApplications, setRecentApplications] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and redirect if unauthorized
    const auth = requireAuth(router);
    if (!auth) return;
    
    fetchUserData();
  }, []);

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
        
        // Ensure user is an employee
        if (data.user.user_type !== 'employee') {
          router.push('/unauthorized');
          return;
        }
        
        setUser(data.user);
        fetchEmployeeStats();
        fetchRecentApplications();
        fetchJobPostings();
      } else {
        localStorage.removeItem('authToken');
        router.push('/app-login');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('authToken');
      router.push('/app-login');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeStats = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/dashboard/employee-stats', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  };

  const fetchRecentApplications = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/employee/applications', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setRecentApplications(data.applications?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchJobPostings = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/employee/jobs', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setJobPostings(data.jobs?.slice(0, 3) || []);
      }
    } catch (error) {
      console.error('Error fetching job postings:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <DashboardHeader user={user} />
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <DashboardHeader user={user} />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.profile?.person?.first_name || 'Employee'}!</h1>
          <p>Manage your job postings and applications</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-content">
              <h3>{stats.activeJobs || 0}</h3>
              <p>Active Job Posts</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>{stats.totalApplications || 0}</h3>
              <p>Total Applications</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🔔</div>
            <div className="stat-content">
              <h3>{stats.pendingApplications || 0}</h3>
              <p>Pending Reviews</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.hiredCandidates || 0}</h3>
              <p>Hired This Month</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => router.push('/app-dashboard/employee/job-add')}
            >
              <span className="btn-icon">➕</span>
              Post New Job
            </button>
            
            <button 
              className="action-btn"
              onClick={() => router.push('/app-dashboard/employee/job-requests')}
            >
              <span className="btn-icon">📨</span>
              View Applications
            </button>
            
            <button 
              className="action-btn"
              onClick={() => router.push('/app-profile/employee')}
            >
              <span className="btn-icon">👤</span>
              Edit Profile
            </button>
            
            <button 
              className="action-btn"
              onClick={() => router.push('/app-profile/company')}
            >
              <span className="btn-icon">🏢</span>
              Company Profile
            </button>
          </div>
        </div>

        {/* Recent Applications */}
        {recentApplications.length > 0 && (
          <div className="recent-applications">
            <div className="section-header">
              <h2>Recent Applications</h2>
              <button 
                className="view-all-btn"
                onClick={() => router.push('/app-dashboard/employee/job-requests')}
              >
                View All
              </button>
            </div>
            
            <div className="applications-list">
              {recentApplications.map((application, index) => (
                <div key={index} className="application-item">
                  <div className="applicant-info">
                    <h4>{application.applicant_name}</h4>
                    <p>{application.job_title}</p>
                  </div>
                  <div className="application-status">
                    <span className={`status-badge ${application.status?.toLowerCase()}`}>
                      {application.status}
                    </span>
                    <span className="application-date">{application.applied_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job Postings */}
        <div className="job-postings">
          <div className="section-header">
            <h2>Your Job Postings</h2>
            <button 
              className="view-all-btn"
              onClick={() => router.push('/app-dashboard/employee/job-requests')}
            >
              Manage All
            </button>
          </div>
          
          <div className="jobs-grid">
            {jobPostings.length > 0 ? (
              jobPostings.map((job, index) => (
                <div key={index} className="job-posting-card">
                  <h4>{job.title}</h4>
                  <p>{job.department}</p>
                  <div className="job-stats">
                    <span>📊 {job.applicants || 0} applicants</span>
                    <span>📅 Posted {job.posted_date}</span>
                  </div>
                  <div className="job-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => router.push(`/app-dashboard/employee/job-edit/${job.id}`)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => router.push(`/app-dashboard/employee/job-requests?job=${job.id}`)}
                    >
                      View Applications
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-jobs">
                <p>You haven't posted any jobs yet.</p>
                <button 
                  className="btn-primary"
                  onClick={() => router.push('/app-dashboard/employee/job-add')}
                >
                  Post Your First Job
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
