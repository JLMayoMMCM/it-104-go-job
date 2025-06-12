'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../components/DashboardHeader';
import { requireAuth, getAuthHeaders } from '../../../lib/auth';
import './bulk-applications.css';

export default function BulkApplicationsManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [filters, setFilters] = useState({
    status: '',
    jobId: '',
    sortBy: 'newest'
  });
  const [jobs, setJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [performing, setPerforming] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = requireAuth(router);
    if (!auth) return;
    
    fetchUserData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadApplications();
      loadJobs();
    }
  }, [currentUser, filters, currentPage]);

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
        
        setCurrentUser(data.user);
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

  const loadApplications = async () => {
    try {
      const headers = getAuthHeaders();
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/employee/applications?${params}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalApplications(data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/employee/jobs', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedApplications.size === applications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(applications.map(app => app.id)));
    }
  };

  const handleSelectApplication = (applicationId) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
    setSelectedApplications(new Set());
  };

  const performBulkAction = async () => {
    if (selectedApplications.size === 0 || !bulkAction) {
      alert('Please select applications and an action');
      return;
    }

    setPerforming(true);
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/employee/applications/bulk', {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationIds: Array.from(selectedApplications),
          action: bulkAction,
          notes: bulkNotes
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully updated ${data.updatedCount} applications`);
        setSelectedApplications(new Set());
        setBulkAction('');
        setBulkNotes('');
        loadApplications();
      } else {
        const errorData = await response.json();
        alert(`Failed to perform bulk action: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Failed to perform bulk action');
    } finally {
      setPerforming(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#ffc107';
      case 'accepted': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'reviewed': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bulk-applications-container">
        <DashboardHeader user={currentUser} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading bulk management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-applications-container">
      <DashboardHeader user={currentUser} />
      
      <div className="bulk-applications-content">
        <div className="page-header">
          <div className="header-main">
            <h1>Bulk Application Management</h1>
            <p>Manage multiple job applications efficiently</p>
          </div>
          <button 
            onClick={() => router.back()}
            className="back-btn"
          >
            ← Back
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Filter by Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Filter by Job</label>
              <select
                value={filters.jobId}
                onChange={(e) => handleFilterChange('jobId', e.target.value)}
                className="filter-select"
              >
                <option value="">All Jobs</option>
                {jobs.map(job => (
                  <option key={job.job_id} value={job.job_id}>
                    {job.job_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>

          <div className="results-summary">
            <span>{totalApplications} total applications</span>
            <span>{selectedApplications.size} selected</span>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedApplications.size > 0 && (
          <div className="bulk-actions-section">
            <div className="bulk-actions-header">
              <h3>Bulk Actions ({selectedApplications.size} selected)</h3>
            </div>
            
            <div className="bulk-actions-controls">
              <div className="action-group">
                <label>Action</label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="action-select"
                >
                  <option value="">Select Action</option>
                  <option value="accept">Accept Applications</option>
                  <option value="reject">Reject Applications</option>
                  <option value="mark-reviewed">Mark as Reviewed</option>
                  <option value="archive">Archive Applications</option>
                </select>
              </div>

              <div className="notes-group">
                <label>Notes (optional)</label>
                <textarea
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="Add notes for this bulk action..."
                  rows="2"
                  className="notes-textarea"
                />
              </div>

              <div className="action-buttons">
                <button
                  onClick={performBulkAction}
                  disabled={!bulkAction || performing}
                  className="perform-action-btn"
                >
                  {performing ? 'Processing...' : `Perform Action`}
                </button>
                <button
                  onClick={() => setSelectedApplications(new Set())}
                  className="clear-selection-btn"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applications Table */}
        <div className="applications-table-section">
          <div className="table-header">
            <div className="table-controls">
              <label className="select-all-label">
                <input
                  type="checkbox"
                  checked={selectedApplications.size === applications.length && applications.length > 0}
                  onChange={handleSelectAll}
                />
                Select All
              </label>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="no-applications">
              <div className="no-data-icon">📋</div>
              <h3>No applications found</h3>
              <p>No applications match your current filters.</p>
            </div>
          ) : (
            <div className="applications-table">
              <table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Applicant</th>
                    <th>Job Title</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(application => (
                    <tr key={application.id} className={selectedApplications.has(application.id) ? 'selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedApplications.has(application.id)}
                          onChange={() => handleSelectApplication(application.id)}
                        />
                      </td>
                      <td>
                        <div className="applicant-info">
                          <div className="applicant-name">
                            {application.jobseekers?.first_name} {application.jobseekers?.last_name}
                          </div>
                          <div className="applicant-email">
                            {application.jobseekers?.email}
                          </div>
                        </div>
                      </td>
                      <td className="job-title">
                        {application.jobs?.title}
                      </td>
                      <td className="applied-date">
                        {formatDate(application.applied_at)}
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(application.status) }}
                        >
                          {application.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => router.push(`/app-dashboard/employee/application-view/${application.id}`)}
                            className="view-btn"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>

              <div className="page-info">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
