'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { requireAuth, getAuthHeaders } from '../lib/auth';
import DashboardHeader from '../components/DashboardHeader';
import './dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication and redirect if unauthorized
    const auth = requireAuth(router, pathname);
    if (!auth) return;
    
    fetchUserData();
  }, []);  const fetchUserData = async () => {
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
        
        // Fetch dashboard stats based on user type
        if (data.user.user_type === 'job-seeker') {
          fetchJobseekerStats();
        } else if (data.user.user_type === 'employee' || data.user.user_type === 'company') {
          fetchEmployeeStats();
        }
      } else {
        // Token is invalid or expired, redirect to login
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
  };  const fetchJobseekerStats = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) return;

      const response = await fetch('/api/dashboard/jobseeker-stats', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
      }
    } catch (error) {
      console.error('Error fetching jobseeker stats:', error);
    }
  };
  const fetchEmployeeStats = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) return;

      const response = await fetch('/api/dashboard/employee-stats', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
      }
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getQuickActions = () => {
    if (user?.user_type === 'job-seeker') {
      return [
        { 
          title: 'Browse Jobs', 
          description: 'Find your next opportunity',
          link: '/app-jobs/jobs-all',
          icon: '🔍'
        },
        { 
          title: 'View Recommendations', 
          description: 'Jobs tailored for you',
          link: '/app-profile/jobseeker',
          icon: '💡'
        },
        { 
          title: 'Update Profile', 
          description: 'Keep your information current',
          link: '/app-profile/jobseeker',
          icon: '👤'
        },
        { 
          title: 'Saved Jobs', 
          description: 'Review your saved positions',
          link: '/app-profile/jobseeker',
          icon: '💾'
        }
      ];
    } else if (user?.user_type === 'employee') {
      return [
        { 
          title: 'Post a Job', 
          description: 'Find the right candidate',
          link: '/app-dashboard/job-add',
          icon: '📝'
        },
        { 
          title: 'Manage Applications', 
          description: 'Review candidate applications',
          link: '/app-profile/employee',
          icon: '📋'
        },
        { 
          title: 'Company Profile', 
          description: 'Update company information',
          link: '/app-profile/company',
          icon: '🏢'
        },
        { 
          title: 'View Analytics', 
          description: 'Track job performance',
          link: '/app-dashboard/analytics',
          icon: '📊'
        }
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <DashboardHeader user={user} />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>{getGreeting()}, {user?.jobseeker?.first_name || user?.employee?.first_name || 'User'}!</h1>
          <p>Welcome to your Go Job dashboard</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          {user?.user_type === 'job-seeker' && (
            <>
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>{stats.recommendedJobs || 0}</h3>
                  <p>Recommended Jobs</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💾</div>
                <div className="stat-content">
                  <h3>{stats.savedJobs || 0}</h3>
                  <p>Saved Jobs</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <h3>{stats.appliedJobs || 0}</h3>
                  <p>Applications Sent</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔍</div>
                <div className="stat-content">
                  <h3>{stats.profileViews || 0}</h3>
                  <p>Profile Views</p>
                </div>
              </div>
            </>
          )}

          {user?.user_type === 'employee' && (
            <>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>{stats.activeJobs || 0}</h3>
                  <p>Active Job Posts</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>{stats.totalApplications || 0}</h3>
                  <p>Total Applications</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏰</div>
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
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            {getQuickActions().map((action, index) => (
              <div key={index} className="action-card" onClick={() => router.push(action.link)}>
                <div className="action-icon">{action.icon}</div>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
                <div className="action-arrow">→</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-activity">
                <p>No recent activity to display</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
