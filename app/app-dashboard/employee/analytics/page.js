'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../components/DashboardHeader';
import './analytics.css';

export default function JobAnalytics() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // Last 30 days
  const [selectedJob, setSelectedJob] = useState('all');
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [dateRange, selectedJob, user]);

  const checkAuthAndLoadData = async () => {
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
        if (userData.user.user_type !== 'employee') {
          router.push('/unauthorized');
          return;
        }
        setUser(userData.user);
        await loadJobs(token);
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

  const loadJobs = async (token) => {
    try {
      const response = await fetch('/api/employee/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        days: dateRange,
        ...(selectedJob !== 'all' && { jobId: selectedJob })
      });

      const response = await fetch(`/api/employee/analytics?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'reviewing': return '#17a2b8';
      case 'accepted': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {user && <DashboardHeader user={user} />}
      
      <div className="analytics-content">
        <div className="analytics-header">
          <div className="header-content">
            <h1>Job Analytics</h1>
            <p>Track the performance of your job postings and applications</p>
          </div>
          
          <div className="analytics-filters">
            <div className="filter-group">
              <label htmlFor="dateRange">Time Period</label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="filter-select"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="selectedJob">Job</label>
              <select
                id="selectedJob"
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Jobs</option>
                {jobs.map(job => (
                  <option key={job.job_id} value={job.job_id}>
                    {job.job_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {analytics && (
          <div className="analytics-dashboard">
            {/* Key Metrics */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">👁️</div>
                <div className="metric-content">
                  <h3>Total Views</h3>
                  <p className="metric-value">{formatNumber(analytics.totalViews)}</p>
                  <span className="metric-change positive">
                    +{formatNumber(analytics.viewsChange)} from previous period
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">📝</div>
                <div className="metric-content">
                  <h3>Applications</h3>
                  <p className="metric-value">{formatNumber(analytics.totalApplications)}</p>
                  <span className="metric-change positive">
                    +{formatNumber(analytics.applicationsChange)} from previous period
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <h3>Application Rate</h3>
                  <p className="metric-value">{formatPercentage(analytics.applicationRate)}</p>
                  <span className="metric-subtitle">
                    Applications per view
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">✅</div>
                <div className="metric-content">
                  <h3>Hiring Rate</h3>
                  <p className="metric-value">{formatPercentage(analytics.hiringRate)}</p>
                  <span className="metric-subtitle">
                    Accepted applications
                  </span>
                </div>
              </div>
            </div>

            {/* Application Status Breakdown */}
            <div className="analytics-section">
              <h2>Application Status Breakdown</h2>
              <div className="status-grid">
                {analytics.statusBreakdown?.map(status => (
                  <div key={status.status} className="status-card">
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(status.status) }}
                    ></div>
                    <div className="status-content">
                      <h4>{status.status.charAt(0).toUpperCase() + status.status.slice(1)}</h4>
                      <p className="status-count">{formatNumber(status.count)}</p>
                      <span className="status-percentage">
                        {formatPercentage((status.count / analytics.totalApplications) * 100)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Jobs */}
            <div className="analytics-section">
              <h2>Top Performing Jobs</h2>
              <div className="jobs-performance">
                {analytics.topJobs?.map((job, index) => (
                  <div key={job.job_id} className="performance-card">
                    <div className="performance-rank">#{index + 1}</div>
                    <div className="performance-content">
                      <h4>{job.job_name}</h4>
                      <div className="performance-stats">
                        <div className="stat">
                          <span className="stat-label">Views</span>
                          <span className="stat-value">{formatNumber(job.views)}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Applications</span>
                          <span className="stat-value">{formatNumber(job.applications)}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Rate</span>
                          <span className="stat-value">{formatPercentage(job.applicationRate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="performance-actions">
                      <button 
                        onClick={() => router.push(`/app-jobs/job-view/${job.job_id}`)}
                        className="view-job-btn"
                      >
                        View Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="analytics-section">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {analytics.recentActivity?.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <p className="activity-title">{activity.title}</p>
                      <p className="activity-description">{activity.description}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
