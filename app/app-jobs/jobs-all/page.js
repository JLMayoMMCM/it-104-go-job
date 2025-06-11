'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
import JobCard from '../../components/JobCard';
import './jobs-all.css';

export default function JobsAll() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    jobType: '',
    category: '',
    field: '',
    salaryMin: '',
    salaryMax: '',
    sortBy: 'newest'
  });

  // Filter options
  const [jobTypes, setJobTypes] = useState([]);
  const [categoryFields, setCategoryFields] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);

  useEffect(() => {
    // Check if user is logged in
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
    loadFilterOptions();
    loadJobs();
  }, []);

  useEffect(() => {
    loadJobs();
  }, [filters, currentPage]);

  const loadFilterOptions = async () => {
    try {
      // Load job types
      const jobTypesResponse = await fetch('/api/job-types');
      if (jobTypesResponse.ok) {
        const jobTypesData = await jobTypesResponse.json();
        setJobTypes(jobTypesData);
      }

      // Load category fields
      const fieldsResponse = await fetch('/api/category-fields');
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        setCategoryFields(fieldsData);
      }

      // Load job categories
      const categoriesResponse = await fetch('/api/job-categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setJobCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/jobs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setTotalJobs(data.totalJobs || 0);
      setTotalPages(data.totalPages || 1);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      jobType: '',
      category: '',
      field: '',
      salaryMin: '',
      salaryMax: '',
      sortBy: 'newest'
    });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5;
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);
    
    if (end - start < showPages - 1) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="jobs-all-container">
      {currentUser && <DashboardHeader user={currentUser} />}
      
      <div className="jobs-all-content">
        <div className="jobs-header">
          <div className="header-content">
            <h1 className="page-title">Browse Jobs</h1>
            <p className="page-subtitle">
              {totalJobs > 0 ? `${totalJobs} job${totalJobs !== 1 ? 's' : ''} available` : 'No jobs found'}
            </p>
          </div>
        </div>

        <div className="jobs-layout">
          {/* Filters Sidebar */}
          <div className="filters-sidebar">
            <div className="filters-header">
              <h3>Filter Jobs</h3>
              <button 
                className="clear-filters-btn"
                onClick={clearFilters}
              >
                Clear All
              </button>
            </div>

            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Job title, company, or keywords..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="City, province, or region..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Job Type</label>
              <select
                value={filters.jobType}
                onChange={(e) => handleFilterChange('jobType', e.target.value)}
                className="filter-select"
              >
                <option value="">All Types</option>
                {jobTypes.map(type => (
                  <option key={type.job_type_id} value={type.job_type_name}>
                    {type.job_type_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Category Field</label>
              <select
                value={filters.field}
                onChange={(e) => handleFilterChange('field', e.target.value)}
                className="filter-select"
              >
                <option value="">All Fields</option>
                {categoryFields.map(field => (
                  <option key={field.category_field_id} value={field.category_field_name}>
                    {field.category_field_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Job Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {jobCategories.map(category => (
                  <option key={category.job_category_id} value={category.job_category_name}>
                    {category.job_category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Salary Range</label>
              <div className="salary-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.salaryMin}
                  onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                  className="filter-input salary-input"
                />
                <span className="salary-separator">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.salaryMax}
                  onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                  className="filter-input salary-input"
                />
              </div>
            </div>
          </div>

          {/* Jobs Content */}
          <div className="jobs-content">
            <div className="content-header">
              <div className="sort-controls">
                <label>Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="sort-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="salary_high">Highest Salary</option>
                  <option value="salary_low">Lowest Salary</option>
                  <option value="rating">Company Rating</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading jobs...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p className="error-message">{error}</p>
                <button onClick={loadJobs} className="retry-btn">
                  Try Again
                </button>
              </div>
            ) : jobs.length === 0 ? (
              <div className="no-jobs-container">
                <div className="no-jobs-icon">💼</div>
                <h3>No jobs found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="clear-filters-btn">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="jobs-grid">
                  {jobs.map(job => (
                    <JobCard 
                      key={job.job_id} 
                      job={job} 
                      showPreferenceMatch={currentUser?.user_type === 'job-seeker'}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      Previous
                    </button>

                    <div className="page-numbers">
                      {currentPage > 3 && (
                        <>
                          <button
                            onClick={() => handlePageChange(1)}
                            className="pagination-btn"
                          >
                            1
                          </button>
                          {currentPage > 4 && <span className="pagination-ellipsis">...</span>}
                        </>
                      )}

                      {getPageNumbers().map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && <span className="pagination-ellipsis">...</span>}
                          <button
                            onClick={() => handlePageChange(totalPages)}
                            className="pagination-btn"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                )}

                <div className="pagination-info">
                  Showing page {currentPage} of {totalPages} ({totalJobs} total jobs)
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
