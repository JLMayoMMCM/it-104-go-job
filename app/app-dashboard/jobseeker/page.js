'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { requireAuth, getAuthHeaders } from '../../lib/auth';
import DashboardHeader from '../../components/DashboardHeader';
import JobCard from '../../components/JobCard';
import '../dashboard.css';

export default function JobseekerDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
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
        
        // Ensure user is a jobseeker
        if (data.user.user_type !== 'job-seeker') {
          router.push('/unauthorized');
          return;
        }
        
        setUser(data.user);
        fetchJobseekerStats();
        fetchRecommendedJobs();
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

  const fetchJobseekerStats = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/dashboard/jobseeker-stats', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching jobseeker stats:', error);
    }
  };

  const fetchRecommendedJobs = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/jobs/recommended', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendedJobs(data.jobs?.slice(0, 6) || []);
      }
    } catch (error) {
      console.error('Error fetching recommended jobs:', error);
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
          <h1>Welcome back, {user?.profile?.person?.first_name || 'Job Seeker'}!</h1>
          <p>Ready to find your next opportunity?</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <h3>{stats.applicationCount || 0}</h3>
              <p>Applications Sent</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">❤️</div>
            <div className="stat-content">
              <h3>{stats.savedJobsCount || 0}</h3>
              <p>Saved Jobs</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👀</div>
            <div className="stat-content">
              <h3>{stats.profileViews || 0}</h3>
              <p>Profile Views</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>{recommendedJobs.length}</h3>
              <p>New Recommendations</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => router.push('/app-jobs/jobs-all')}
            >
              <span className="btn-icon">🔍</span>
              Browse Jobs
            </button>
            
            <button 
              className="action-btn"
              onClick={() => router.push('/app-profile/jobseeker')}
            >
              <span className="btn-icon">👤</span>
              Edit Profile
            </button>
            
            <button 
              className="action-btn"
              onClick={() => router.push('/app-profile/jobseeker?tab=applications')}
            >
              <span className="btn-icon">📋</span>
              View Applications
            </button>
            
            <button 
              className="action-btn"
              onClick={() => router.push('/app-profile/jobseeker?tab=saved')}
            >
              <span className="btn-icon">💾</span>
              Saved Jobs
            </button>
          </div>
        </div>

        {/* Recommended Jobs */}
        {recommendedJobs.length > 0 && (
          <div className="recommended-jobs">
            <div className="section-header">
              <h2>Recommended for You</h2>
              <button 
                className="view-all-btn"
                onClick={() => router.push('/app-dashboard/jobseeker/job-recommendations')}
              >
                View All
              </button>
            </div>
            
            <div className="jobs-grid">
              {recommendedJobs.map((job) => (
                <JobCard key={job.job_id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <p>{activity.message}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-activity">No recent activity</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
