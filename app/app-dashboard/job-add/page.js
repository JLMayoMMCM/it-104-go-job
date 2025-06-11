'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
import './job-add.css';

export default function JobAdd() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [jobTypes, setJobTypes] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    job_type: '',
    category_id: '',
    salary_min: '',
    salary_max: '',
    requirements: '',
    benefits: '',
    application_deadline: '',
    status: 'active'
  });

  useEffect(() => {
    fetchUserData();
    loadFormOptions();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        if (data.user.user_type !== 'employee') {
          router.push('/app-login');
          return;
        }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.job_type) {
      newErrors.job_type = 'Job type is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Job category is required';
    }

    if (formData.salary_min && formData.salary_max) {
      if (parseInt(formData.salary_min) >= parseInt(formData.salary_max)) {
        newErrors.salary_max = 'Maximum salary must be greater than minimum salary';
      }
    }

    if (!formData.application_deadline) {
      newErrors.application_deadline = 'Application deadline is required';
    } else {
      const deadline = new Date(formData.application_deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadline <= today) {
        newErrors.application_deadline = 'Application deadline must be in the future';
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
      const response = await fetch('/api/company/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Job posted successfully!');
        router.push('/app-profile/employee');
      } else {
        const errorData = await response.json();
        alert(`Failed to post job: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Error posting job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/app-profile/employee');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading job form...</p>
      </div>
    );
  }

  return (
    <div className="job-add-page">
      <DashboardHeader user={user} />
      
      <div className="job-add-container">
        <div className="job-add-header">
          <h1>Post a New Job</h1>
          <p>Fill out the details below to post a new job opening</p>
        </div>

        <form onSubmit={handleSubmit} className="job-add-form">
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="title">Job Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Senior Software Developer"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Job Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                rows="6"
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Manila, Philippines"
                  className={errors.location ? 'error' : ''}
                />
                {errors.location && <span className="error-message">{errors.location}</span>}
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

            <div className="form-group">
              <label htmlFor="category_id">Job Category *</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={errors.category_id ? 'error' : ''}
              >
                <option value="">Select Category</option>
                {jobCategories.map(category => (
                  <option key={category.job_category_id} value={category.job_category_id}>
                    {category.job_category_name}
                  </option>
                ))}
              </select>
              {errors.category_id && <span className="error-message">{errors.category_id}</span>}
            </div>
          </div>

          <div className="form-section">
            <h2>Compensation & Timeline</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="salary_min">Minimum Salary (PHP)</label>
                <input
                  type="number"
                  id="salary_min"
                  name="salary_min"
                  value={formData.salary_min}
                  onChange={handleInputChange}
                  placeholder="e.g. 50000"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="salary_max">Maximum Salary (PHP)</label>
                <input
                  type="number"
                  id="salary_max"
                  name="salary_max"
                  value={formData.salary_max}
                  onChange={handleInputChange}
                  placeholder="e.g. 80000"
                  min="0"
                  className={errors.salary_max ? 'error' : ''}
                />
                {errors.salary_max && <span className="error-message">{errors.salary_max}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="application_deadline">Application Deadline *</label>
              <input
                type="date"
                id="application_deadline"
                name="application_deadline"
                value={formData.application_deadline}
                onChange={handleInputChange}
                className={errors.application_deadline ? 'error' : ''}
              />
              {errors.application_deadline && <span className="error-message">{errors.application_deadline}</span>}
            </div>
          </div>

          <div className="form-section">
            <h2>Additional Details</h2>
            
            <div className="form-group">
              <label htmlFor="requirements">Requirements</label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                placeholder="List the qualifications, skills, and experience required..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="benefits">Benefits</label>
              <textarea
                id="benefits"
                name="benefits"
                value={formData.benefits}
                onChange={handleInputChange}
                placeholder="Describe the benefits and perks offered..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Job Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
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
              {submitting ? 'Posting Job...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
