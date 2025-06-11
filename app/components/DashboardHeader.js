'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import './DashboardHeader.css';

export default function DashboardHeader({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [unreadCount, setUnreadCount] = useState(0);

  // Update currentUser when user prop changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Force refresh user data when component mounts or becomes visible
  useEffect(() => {
    const refreshUserData = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData.user); // Extract user from the response
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
    };

    refreshUserData();

    // Listen for profile update events
    const handleProfileUpdate = () => {
      refreshUserData();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Load unread notifications count for employees
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (currentUser?.user_type === 'employee') {
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const response = await fetch('/api/employee/notifications', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
              const notifications = await response.json();
              const unread = notifications.filter(n => !n.is_read).length;
              setUnreadCount(unread);
            }
          } catch (error) {
            console.error('Error loading unread count:', error);
          }
        }
      }
    };

    loadUnreadCount();
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/');
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigateTo = (path) => {
    router.push(path);
    setIsSidebarOpen(false);
  };  const handleLogoClick = () => {
    // Navigate to appropriate dashboard based on user type
    if (currentUser?.user_type === 'employee') {
      navigateTo('/app-dashboard/employee');
    } else if (currentUser?.user_type === 'job-seeker') {
      navigateTo('/app-dashboard/jobseeker');
    } else {
      navigateTo('/');
    }
  };

  const getNavigationItems = () => {
    if (!currentUser) return [];    const commonItems = [
      { 
        label: 'Profile', 
        path: currentUser.user_type === 'employee' ? '/app-profile/employee' : '/app-profile/jobseeker',
        icon: '👤'
      },
      { 
        label: 'Browse Jobs', 
        path: '/app-jobs/jobs-all',
        icon: '💼'
      }
    ];

    if (currentUser.user_type === 'employee') {
      return [
        ...commonItems,
        { 
          label: 'Company Profile', 
          path: '/app-profile/company',
          icon: '🏢'
        },
        { 
          label: 'Job Management', 
          path: '/app-dashboard/employee/job-add',
          icon: '📝'
        },
        { 
          label: 'Applications', 
          path: '/app-dashboard/employee/job-requests',
          icon: '📋'
        },
        { 
          label: 'Notifications', 
          path: '/app-notifications',
          icon: '🔔',
          badge: unreadCount > 0 ? unreadCount : null
        }
      ];
    } else {
      return [
        ...commonItems,
        { 
          label: 'Job Recommendations', 
          path: '/app-dashboard/jobseeker/job-recommendations',
          icon: '⭐'
        },
        { 
          label: 'My Applications', 
          path: '/app-profile/jobseeker?tab=applications',
          icon: '📄'
        },
        { 
          label: 'Saved Jobs', 
          path: '/app-profile/jobseeker?tab=saved',
          icon: '❤️'
        }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      <header className="dashboard-header">
        <div className="header-content">          <div className="header-left">
            <img 
              src="/Assets/Title.png" 
              alt="GO JOB" 
              className="header-logo"
              onClick={handleLogoClick}
              style={{ cursor: 'pointer' }}
            />
          </div>
          
          <div className="header-right">            <div className="user-info">
              <span className="welcome-text">
                Welcome, {currentUser?.profile?.person?.first_name || currentUser?.username || 'User'}
              </span>
              <div className="user-avatar">
                {currentUser?.profile?.person?.first_name?.charAt(0) || 'U'}
              </div>
            </div>
            
            <button className="menu-toggle" onClick={toggleSidebar}>
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>        <div className="sidebar-header">
          <img src="/Assets/Title.png" alt="GO JOB" className="sidebar-logo" />
          <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
            ×
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item, index) => (
            <button
              key={index}
              className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              onClick={() => navigateTo(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
