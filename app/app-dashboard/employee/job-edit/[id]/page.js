'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { requireAuth, getAuthHeaders } from '../../../../lib/auth';
import DashboardHeader from '../../../../components/DashboardHeader';
import './job-edit.css';

export default function JobEdit() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [jobTypes, setJobTypes] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    job_name: '',
    job_description: '',
    job_location: '',
    job_type: '',
    job_category_id: '',
    job_salary: '',
    job_requirements: '',
    job_benefits: '',
    job_closing_date: '',
    job_is_active: true,
    job_quantity: 1
  });

  useEffect(() => {
    const auth = requireAuth(router);
    if (!auth) return;
    
    fetchUserData();
    loadFormOptions();
    loadJobData();
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
    }
  };

  const loadFormOptions = async () => {
    try {
      // Load job types
      const jobTypesResponse = await fetch('/api/job-types');
      if (jobTypesResponse.ok) {
        const jobTypesData = await jobTypesResponse.json();
        setJobTypes(jobTypesData);
      }

      // Load job categories
      const categoriesResponse = await fetch('/api/job-categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setJobCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error loading form options:', error);
    }
  };

  const loadJobData = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/employee/jobs/${params.id}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        const job = data.job;
        
        setFormData({
          job_name: job.job_name || '',
          job_description: job.job_description || '',
          job_location: job.job_location || '',
          job_type: job.job_type_name || '',
          job_category_id: job.job_category_id || '',
          job_salary: job.job_salary || '',
          job_requirements: job.job_requirements || '',
          job_benefits: job.job_benefits || '',
          job_closing_date: job.job_closing_date ? job.job_closing_date.split('T')[0] : '',
          job_is_active: job.job_is_active !== false,
          job_quantity: job.job_quantity || 1
        });
      } else {
        setErrors({ general: 'Job not found or you do not have permission to edit it.' });
      }
    } catch (error) {
      console.error('Error loading job data:', error);
      setErrors({ general: 'Failed to load job data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.job_name.trim()) {
      newErrors.job_name = 'Job title is required';
    }

    if (!formData.job_description.trim()) {
      newErrors.job_description = 'Job description is required';
    }

    if (!formData.job_location.trim()) {
      newErrors.job_location = 'Location is required';
    }

    if (!formData.job_type) {
      newErrors.job_type = 'Job type is required';
    }

    if (!formData.job_category_id) {
      newErrors.job_category_id = 'Job category is required';
    }

    if (formData.job_closing_date) {
      const deadline = new Date(formData.job_closing_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadline <= today) {
        newErrors.job_closing_date = 'Application deadline must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/employee/jobs/${params.id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          job_salary: formData.job_salary ? parseFloat(formData.job_salary) : null,
          job_quantity: parseInt(formData.job_quantity)
        }),
      });

      if (response.ok) {
        alert('Job updated successfully!');
        router.push('/app-profile/employee');
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.error || 'Failed to update job' });
      }
    } catch (error) {
      console.error('Error updating job:', error);
      setErrors({ general: 'Error updating job. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/app-profile/employee');
  };

  if (loading) {
    return (
      <div className="job-edit-page">
        <DashboardHeader user={user} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="job-edit-page">
      <DashboardHeader user={user} />
      
      <div className="job-edit-container">
        <div className="job-edit-header">
          <h1>Edit Job</h1>
          <p>Update the job details below</p>
        </div>

        {errors.general && (
          <div className="error-banner">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="job-edit-form">
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="job_name">Job Title *</label>
              <input
                type="text"
                id="job_name"
                name="job_name"
                value={formData.job_name}
                onChange={handleInputChange}
                placeholder="e.g. Senior Software Developer"
                className={errors.job_name ? 'error' : ''}
              />
              {errors.job_name && <span className="error-message">{errors.job_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="job_description">Job Description *</label>
              <textarea
                id="job_description"
                name="job_description"
                value={formData.job_description}
                onChange={handleInputChange}
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                rows="6"
                className={errors.job_description ? 'error' : ''}
              />
              {errors.job_description && <span className="error-message">{errors.job_description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="job_location">Location *</label>
                <input
                  type="text"
                  id="job_location"
                  name="job_location"
                  value={formData.job_location}
                  onChange={handleInputChange}
                  placeholder="e.g. Manila, Philippines"
                  className={errors.job_location ? 'error' : ''}
                />
                {errors.job_location && <span className="error-message">{errors.job_location}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="job_type">Job Type *</label>
                <select
                  id="job_type"
                  name="job_type"
                  value={formData.job_type}
                  onChange={handleInputChange}
                  className={errors.job_type ? 'error' : ''}
                >
                  <option value="">Select Job Type</option>
                  {jobTypes.map(type => (
                    <option key={type.job_type_id} value={type.job_type_name}>
                      {type.job_type_name}
                    </option>
                  ))}
                </select>
                {errors.job_type && <span className="error-message">{errors.job_type}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="job_category_id">Job Category *</label>
                <select
                  id="job_category_id"
                  name="job_category_id"
                  value={formData.job_category_id}
                  onChange={handleInputChange}
                  className={errors.job_category_id ? 'error' : ''}
                >
                  <option value="">Select Category</option>
                  {jobCategories.map(category => (
                    <option key={category.job_category_id} value={category.job_category_id}>
                      {category.job_category_name}
                    </option>
                  ))}
                </select>
                {errors.job_category_id && <span className="error-message">{errors.job_category_id}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="job_quantity">Number of Positions</label>
                <input
                  type="number"
                  id="job_quantity"
                  name="job_quantity"
                  value={formData.job_quantity}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Compensation & Timeline</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="job_salary">Salary (PHP)</label>
                <input
                  type="number"
                  id="job_salary"
                  name="job_salary"
                  value={formData.job_salary}
                  onChange={handleInputChange}
                  placeholder="e.g. 65000"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="job_closing_date">Application Deadline</label>
                <input
                  type="date"
                  id="job_closing_date"
                  name="job_closing_date"
                  value={formData.job_closing_date}
                  onChange={handleInputChange}
                  className={errors.job_closing_date ? 'error' : ''}
                />
                {errors.job_closing_date && <span className="error-message">{errors.job_closing_date}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Additional Details</h2>
            
            <div className="form-group">
              <label htmlFor="job_requirements">Requirements</label>
              <textarea
                id="job_requirements"
                name="job_requirements"
                value={formData.job_requirements}
                onChange={handleInputChange}
                placeholder="List the qualifications, skills, and experience required..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="job_benefits">Benefits</label>
              <textarea
                id="job_benefits"
                name="job_benefits"
                value={formData.job_benefits}
                onChange={handleInputChange}
                placeholder="Describe the benefits and perks offered..."
                rows="4"
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="job_is_active"
                  checked={formData.job_is_active}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Job is active and accepting applications
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel}
              className="btn-cancel"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Updating Job...' : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
