'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../components/DashboardHeader';
import './notifications.css';

export default function Notifications() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, job-applications, profile-views, recommendations

  useEffect(() => {
    checkAuth();
    loadNotifications();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/app-login');
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        localStorage.removeItem('authToken');
        router.push('/app-login');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      localStorage.removeItem('authToken');
      router.push('/app-login');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'job_application':
        if (user?.user_type === 'employee') {
          router.push('/app-dashboard/employee/job-requests');
        } else {
          router.push('/app-profile/jobseeker?tab=applications');
        }
        break;
      case 'job_recommendation':
        router.push('/app-jobs/jobs-all');
        break;
      case 'profile_view':
        router.push('/app-profile/jobseeker');
        break;
      case 'company_update':
        router.push('/app-profile/company');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_application': return '📝';
      case 'job_recommendation': return '💼';
      case 'profile_view': return '👁️';
      case 'company_update': return '🏢';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return '#ff4757';
    if (priority === 'medium') return '#ffa502';
    return '#3742fa';
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(notif => !notif.is_read).length;

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      {user && <DashboardHeader user={user} />}
      
      <div className="notifications-content">
        <div className="notifications-header">
          <div className="header-content">
            <h1>Notifications</h1>
            <div className="notification-stats">
              <span className="unread-count">
                {unreadCount} unread
              </span>
              <span className="total-count">
                {notifications.length} total
              </span>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={markAllAsRead}
              className="mark-all-read-btn"
              disabled={unreadCount === 0}
            >
              Mark All Read
            </button>
          </div>
        </div>

        <div className="notifications-filters">
          <button 
            onClick={() => setFilter('all')}
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          >
            All ({notifications.length})
          </button>
          <button 
            onClick={() => setFilter('job_application')}
            className={`filter-btn ${filter === 'job_application' ? 'active' : ''}`}
          >
            Applications ({notifications.filter(n => n.type === 'job_application').length})
          </button>
          <button 
            onClick={() => setFilter('job_recommendation')}
            className={`filter-btn ${filter === 'job_recommendation' ? 'active' : ''}`}
          >
            Jobs ({notifications.filter(n => n.type === 'job_recommendation').length})
          </button>
          <button 
            onClick={() => setFilter('profile_view')}
            className={`filter-btn ${filter === 'profile_view' ? 'active' : ''}`}
          >
            Profile ({notifications.filter(n => n.type === 'profile_view').length})
          </button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id}
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-content">
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-body">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {new Date(notification.created_at).toLocaleDateString()} at{' '}
                      {new Date(notification.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="notification-actions">
                    <div 
                      className="priority-indicator"
                      style={{ backgroundColor: getNotificationColor(notification.type, notification.priority) }}
                    ></div>
                    
                    {!notification.is_read && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="mark-read-btn"
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="delete-btn"
                      title="Delete notification"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-notifications">
              <div className="empty-icon">🔔</div>
              <h3>No notifications</h3>
              <p>
                {filter === 'all' 
                  ? "You're all caught up! No new notifications."
                  : `No ${filter.replace('_', ' ')} notifications.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
