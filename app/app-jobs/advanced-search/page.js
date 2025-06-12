'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
import JobCard from '../../components/JobCard';
import './advanced-search.css';

function AdvancedJobSearchContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searching, setSearching] = useState(false);
  
  // Advanced search filters
  const [filters, setFilters] = useState({
    keywords: '',
    location: '',
    jobType: '',
    categoryField: '',
    jobCategory: '',
    salaryMin: '',
    salaryMax: '',
    experienceLevel: '',
    companySize: '',
    workMode: '',
    benefits: [],
    skills: [],
    postedWithin: '',
    sortBy: 'relevance'
  });

  // Filter options
  const [jobTypes, setJobTypes] = useState([]);
  const [categoryFields, setCategoryFields] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  
  // Saved searches
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [savingSearch, setSavingSearch] = useState(false);
  
  // Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkAuth();
    loadFilterOptions();
    loadSavedSearches();
    
    // Load search from URL params if present
    const urlFilters = {};
    for (const [key, value] of searchParams.entries()) {
      urlFilters[key] = value;
    }
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      searchJobs();
      if (showRecommendations) {
        loadRecommendations();
      }
    }
  }, [currentUser, filters, currentPage]);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData.user);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    }
    setLoading(false);
  };

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

  const loadSavedSearches = async () => {
    if (!currentUser) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/saved-searches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.searches || []);
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/jobs/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.jobs?.slice(0, 6) || []);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const searchJobs = async () => {
    setSearching(true);
    
    try {
      // Build search parameters
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        advanced: 'true', // Flag for advanced search
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => {
            if (Array.isArray(value)) return value.length > 0;
            return value !== '';
          })
        )
      });

      const response = await fetch(`/api/jobs/search?${searchParams}`);
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        setTotalJobs(data.totalJobs || 0);
        setTotalPages(data.totalPages || 1);
        setShowRecommendations(data.jobs?.length === 0);
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
    
    // Update URL
    const newParams = new URLSearchParams();
    const updatedFilters = { ...filters, [filterName]: value };
    Object.entries(updatedFilters).forEach(([key, val]) => {
      if (val && (Array.isArray(val) ? val.length > 0 : true)) {
        newParams.set(key, Array.isArray(val) ? val.join(',') : val);
      }
    });
    router.replace(`/app-jobs/advanced-search?${newParams.toString()}`);
  };

  const handleArrayFilterChange = (filterName, value, checked) => {
    setFilters(prev => {
      const currentArray = prev[filterName] || [];
      if (checked) {
        return { ...prev, [filterName]: [...currentArray, value] };
      } else {
        return { ...prev, [filterName]: currentArray.filter(item => item !== value) };
      }
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      keywords: '',
      location: '',
      jobType: '',
      categoryField: '',
      jobCategory: '',
      salaryMin: '',
      salaryMax: '',
      experienceLevel: '',
      companySize: '',
      workMode: '',
      benefits: [],
      skills: [],
      postedWithin: '',
      sortBy: 'relevance'
    });
    setCurrentPage(1);
    router.replace('/app-jobs/advanced-search');
  };

  const saveCurrentSearch = async () => {
    if (!searchName.trim()) {
      alert('Please enter a name for this search');
      return;
    }

    setSavingSearch(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: searchName,
          filters: filters,
          resultCount: totalJobs
        })
      });

      if (response.ok) {
        setShowSaveSearchModal(false);
        setSearchName('');
        loadSavedSearches();
        alert('Search saved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to save search: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving search:', error);
      alert('Failed to save search');
    } finally {
      setSavingSearch(false);
    }
  };

  const loadSavedSearch = (search) => {
    setFilters(search.filters);
    setCurrentPage(1);
    
    // Update URL
    const newParams = new URLSearchParams();
    Object.entries(search.filters).forEach(([key, val]) => {
      if (val && (Array.isArray(val) ? val.length > 0 : true)) {
        newParams.set(key, Array.isArray(val) ? val.join(',') : val);
      }
    });
    router.replace(`/app-jobs/advanced-search?${newParams.toString()}`);
  };

  const deleteSavedSearch = async (searchId) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/saved-searches/${searchId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  };

  if (loading) {
    return (
      <div className="advanced-search-container">
        <DashboardHeader user={currentUser} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading advanced search...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-search-container">
      <DashboardHeader user={currentUser} />
      
      <div className="advanced-search-content">
        <div className="search-header">
          <div className="header-main">
            <h1>Advanced Job Search</h1>
            <p>Find your perfect job with powerful search filters and save your searches</p>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={() => router.push('/app-jobs/jobs-all')}
              className="simple-search-btn"
            >
              Simple Search
            </button>
          </div>
        </div>

        <div className="search-layout">
          {/* Advanced Filters Sidebar */}
          <div className="filters-sidebar">
            <div className="filters-header">
              <h3>Search Filters</h3>
              <div className="filter-actions">
                <button onClick={clearFilters} className="clear-btn">
                  Clear All
                </button>
                {currentUser?.user_type === 'job-seeker' && (
                  <button 
                    onClick={() => setShowSaveSearchModal(true)}
                    className="save-search-btn"
                  >
                    Save Search
                  </button>
                )}
              </div>
            </div>

            {/* Basic Search */}
            <div className="filter-section">
              <h4>Basic Search</h4>
              
              <div className="filter-group">
                <label>Keywords</label>
                <input
                  type="text"
                  placeholder="Job title, skills, company..."
                  value={filters.keywords}
                  onChange={(e) => handleFilterChange('keywords', e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="City, province, or remote"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            {/* Job Details */}
            <div className="filter-section">
              <h4>Job Details</h4>
              
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
                  value={filters.categoryField}
                  onChange={(e) => handleFilterChange('categoryField', e.target.value)}
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
                <label>Work Mode</label>
                <select
                  value={filters.workMode}
                  onChange={(e) => handleFilterChange('workMode', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Modes</option>
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Salary & Experience */}
            <div className="filter-section">
              <h4>Salary & Experience</h4>
              
              <div className="filter-group">
                <label>Salary Range</label>
                <div className="salary-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.salaryMin}
                    onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                    className="salary-input"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.salaryMax}
                    onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                    className="salary-input"
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Experience Level</label>
                <select
                  value={filters.experienceLevel}
                  onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Any Level</option>
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid Level (3-5 years)</option>
                  <option value="senior">Senior Level (6-10 years)</option>
                  <option value="executive">Executive (10+ years)</option>
                </select>
              </div>
            </div>

            {/* Company & Benefits */}
            <div className="filter-section">
              <h4>Company & Benefits</h4>
              
              <div className="filter-group">
                <label>Company Size</label>
                <select
                  value={filters.companySize}
                  onChange={(e) => handleFilterChange('companySize', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Any Size</option>
                  <option value="startup">Startup (1-50)</option>
                  <option value="small">Small (51-200)</option>
                  <option value="medium">Medium (201-1000)</option>
                  <option value="large">Large (1000+)</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Benefits</label>
                <div className="checkbox-group">
                  {['Health Insurance', 'Dental Coverage', 'Vision Coverage', 'Retirement Plan', 'Paid Time Off', 'Flexible Schedule', 'Work From Home', 'Professional Development'].map(benefit => (
                    <label key={benefit} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(filters.benefits || []).includes(benefit)}
                        onChange={(e) => handleArrayFilterChange('benefits', benefit, e.target.checked)}
                      />
                      {benefit}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Date & Sorting */}
            <div className="filter-section">
              <h4>Date & Sorting</h4>
              
              <div className="filter-group">
                <label>Posted Within</label>
                <select
                  value={filters.postedWithin}
                  onChange={(e) => handleFilterChange('postedWithin', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Any Time</option>
                  <option value="1">Last 24 hours</option>
                  <option value="3">Last 3 days</option>
                  <option value="7">Last week</option>
                  <option value="14">Last 2 weeks</option>
                  <option value="30">Last month</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="filter-select"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest First</option>
                  <option value="salary_high">Highest Salary</option>
                  <option value="salary_low">Lowest Salary</option>
                  <option value="company_rating">Company Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="search-results">
            {/* Saved Searches */}
            {currentUser?.user_type === 'job-seeker' && savedSearches.length > 0 && (
              <div className="saved-searches-section">
                <h3>Your Saved Searches</h3>
                <div className="saved-searches-grid">
                  {savedSearches.map(search => (
                    <div key={search.id} className="saved-search-card">
                      <div className="search-info">
                        <h4>{search.name}</h4>
                        <p>{search.result_count} jobs found</p>
                        <small>Saved {new Date(search.created_at).toLocaleDateString()}</small>
                      </div>
                      <div className="search-actions">
                        <button
                          onClick={() => loadSavedSearch(search)}
                          className="load-search-btn"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteSavedSearch(search.id)}
                          className="delete-search-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Header */}
            <div className="results-header">
              <div className="results-info">
                <h3>
                  {searching ? 'Searching...' : `${totalJobs} Jobs Found`}
                </h3>
                {totalJobs > 0 && (
                  <p>Page {currentPage} of {totalPages}</p>
                )}
              </div>
            </div>

            {/* Search Results */}
            {searching ? (
              <div className="searching-container">
                <div className="loading-spinner"></div>
                <p>Searching for jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No jobs found</h3>
                <p>Try adjusting your search filters or keywords</p>
                <button onClick={clearFilters} className="clear-filters-btn">
                  Clear All Filters
                </button>
                
                {/* Show recommendations */}
                {showRecommendations && recommendations.length > 0 && (
                  <div className="recommendations-section">
                    <h4>Recommended for You</h4>
                    <div className="recommendations-grid">
                      {recommendations.map(job => (
                        <JobCard key={job.job_id} job={job} showPreferenceMatch={true} />
                      ))}
                    </div>
                  </div>
                )}
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
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      Previous
                    </button>

                    <div className="page-numbers">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, currentPage - 2) + i;
                        if (page <= totalPages) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`page-btn ${currentPage === page ? 'active' : ''}`}
                            >
                              {page}
                            </button>
                          );
                        }
                        return null;
                      })}
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Save Search Modal */}
      {showSaveSearchModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Save Current Search</h3>
            <p>Give your search a name to save it for later</p>
            
            <div className="modal-form">
              <label>Search Name</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., Frontend Developer Jobs in Manila"
                className="modal-input"
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowSaveSearchModal(false)}
                className="modal-cancel-btn"
                disabled={savingSearch}
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentSearch}
                className="modal-save-btn"
                disabled={savingSearch || !searchName.trim()}
              >
                {savingSearch ? 'Saving...' : 'Save Search'}
              </button>
            </div>
          </div>        </div>
      )}
    </div>
  );
}

export default function AdvancedJobSearch() {
  return (
    <Suspense fallback={<div>Loading job search...</div>}>
      <AdvancedJobSearchContent />
    </Suspense>
  );
}
