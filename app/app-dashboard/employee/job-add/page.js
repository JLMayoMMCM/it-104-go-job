'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { requireAuth, getAuthHeaders } from '../../../lib/auth';
import DashboardHeader from '../../../components/DashboardHeader';
import './employee-job-add.css';

export default function EmployeeJobAdd() {
  const router = useRouter();
  const [user, setUser] = useState(null);  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [jobTypes, setJobTypes] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [categoryFields, setCategoryFields] = useState([]);
  const [experienceLevels, setExperienceLevels] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [autoSelectedFields, setAutoSelectedFields] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    job_name: '',
    job_description: '',
    job_location: '',
    job_type: '',
    job_category_ids: [], // Changed to array for multiple categories
    job_field_ids: [], // Added for category fields
    job_salary: '',
    job_requirements: '',
    job_benefits: '',
    job_closing_date: '',
    job_quantity: 1,
    job_time: 'Full-time',
    employment_type: 'Permanent',
    job_experience_level_id: '', // Changed to use database ID
    job_education_level_id: '' // Added education level
  });

  useEffect(() => {
    const auth = requireAuth(router);
    if (!auth) return;
    
    fetchUserData();
    loadFormOptions();
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
    } finally {
      setLoading(false);
    }
  };  const loadFormOptions = async () => {
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

      // Load category fields
      const fieldsResponse = await fetch('/api/category-fields');
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        setCategoryFields(fieldsData);
      }

      // Load experience levels
      const experienceResponse = await fetch('/api/experience-levels');
      if (experienceResponse.ok) {
        const experienceData = await experienceResponse.json();
        setExperienceLevels(experienceData);
      }

      // Load education levels
      const educationResponse = await fetch('/api/education-levels');
      if (educationResponse.ok) {
        const educationData = await educationResponse.json();
        setEducationLevels(educationData);
      }
    } catch (error) {
      console.error('Error loading form options:', error);
    }
  };

  // Function to handle category selection
  const handleCategoryChange = (categoryId, isSelected) => {
    let updatedCategories;
    
    if (isSelected) {
      updatedCategories = [...selectedCategories, categoryId];
    } else {
      updatedCategories = selectedCategories.filter(id => id !== categoryId);
    }
    
    setSelectedCategories(updatedCategories);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      job_category_ids: updatedCategories
    }));
    
    // Auto-populate category fields based on selected categories
    updateCategoryFields(updatedCategories);
    
    // Clear error for this field
    if (errors.job_category_ids) {
      setErrors(prev => ({
        ...prev,
        job_category_ids: ''
      }));
    }
  };

  // Function to automatically populate category fields based on selected categories
  const updateCategoryFields = (selectedCategoryIds) => {
    const fieldsToAdd = [];
    
    selectedCategoryIds.forEach(categoryId => {
      const category = jobCategories.find(cat => cat.job_category_id === parseInt(categoryId));
      if (category && category.category_field_id) {
        if (!fieldsToAdd.includes(category.category_field_id)) {
          fieldsToAdd.push(category.category_field_id);
        }
      }
    });
    
    setAutoSelectedFields(fieldsToAdd);
    setFormData(prev => ({
      ...prev,
      job_field_ids: fieldsToAdd
    }));
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
    }    if (!formData.job_type) {
      newErrors.job_type = 'Job type is required';
    }

    if (!formData.job_category_ids || formData.job_category_ids.length === 0) {
      newErrors.job_category_ids = 'At least one job category is required';
    }

    if (formData.job_closing_date) {
      const deadline = new Date(formData.job_closing_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadline <= today) {
        newErrors.job_closing_date = 'Application deadline must be in the future';
      }
    }

    if (formData.job_quantity < 1) {
      newErrors.job_quantity = 'Number of positions must be at least 1';
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
      
      // Find job_type_id from job_type name
      const selectedJobType = jobTypes.find(type => type.job_type_name === formData.job_type);
      
      const requestData = {
        ...formData,
        job_type_id: selectedJobType ? selectedJobType.job_type_id : null,
        job_salary: formData.job_salary ? parseFloat(formData.job_salary) : null,
        job_quantity: parseInt(formData.job_quantity),
        job_category_ids: formData.job_category_ids,
        job_field_ids: formData.job_field_ids
      };
      
      // Remove the job_type field since we're sending job_type_id
      delete requestData.job_type;
      
      const response = await fetch('/api/employee/jobs', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Job posted successfully!');
        router.push('/app-profile/employee');
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.error || 'Failed to post job' });
      }
    } catch (error) {
      console.error('Error posting job:', error);
      setErrors({ general: 'Error posting job. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/app-profile/employee');
  };
  const handleSaveDraft = async () => {
    const draftData = {
      ...formData,
      job_is_active: false
    };
    
    setSubmitting(true);

    try {
      const headers = getAuthHeaders();
      
      // Find job_type_id from job_type name
      const selectedJobType = jobTypes.find(type => type.job_type_name === draftData.job_type);
      
      const requestData = {
        ...draftData,
        job_type_id: selectedJobType ? selectedJobType.job_type_id : null,
        job_salary: draftData.job_salary ? parseFloat(draftData.job_salary) : null,
        job_quantity: parseInt(draftData.job_quantity),
        job_category_ids: draftData.job_category_ids,
        job_field_ids: draftData.job_field_ids
      };
      
      // Remove the job_type field since we're sending job_type_id
      delete requestData.job_type;
      
      const response = await fetch('/api/employee/jobs', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        alert('Job saved as draft!');
        router.push('/app-profile/employee');
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.error || 'Failed to save draft' });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setErrors({ general: 'Error saving draft. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-job-add-page">
        <DashboardHeader user={user} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-job-add-page">
      <DashboardHeader user={user} />
      
      <div className="job-add-container">
        <div className="job-add-header">
          <h1>Post a New Job</h1>
          <p>Fill out the details below to post a new job opening for your company</p>
        </div>

        {errors.general && (
          <div className="error-banner">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="job-add-form">
          <div className="form-section">
            <h2>📋 Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="job_name">Job Title *</label>
              <input
                type="text"
                id="job_name"
                name="job_name"
                value={formData.job_name}
                onChange={handleInputChange}
                placeholder="e.g. Senior Software Developer, Marketing Manager, Sales Associate"
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
                placeholder="Describe the role, key responsibilities, what you're looking for in a candidate, company culture, and growth opportunities..."
                rows="6"
                className={errors.job_description ? 'error' : ''}
              />
              {errors.job_description && <span className="error-message">{errors.job_description}</span>}
              <small className="field-hint">Include key responsibilities, required skills, and what makes this role exciting</small>
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
                  placeholder="e.g. Manila, Philippines or Remote"
                  className={errors.job_location ? 'error' : ''}
                />
                {errors.job_location && <span className="error-message">{errors.job_location}</span>}
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
                  className={errors.job_quantity ? 'error' : ''}
                />
                {errors.job_quantity && <span className="error-message">{errors.job_quantity}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>🏷️ Job Classification</h2>
            
            <div className="form-row">
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
              </div>              <div className="form-group">
                <label>Job Categories *</label>
                <div className="checkbox-group categories-group">
                  {jobCategories.map(category => (
                    <label key={category.job_category_id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.job_category_id.toString())}
                        onChange={(e) => handleCategoryChange(category.job_category_id.toString(), e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      {category.job_category_name}
                      {category.category_field_name && (
                        <small className="field-info">({category.category_field_name})</small>
                      )}
                    </label>
                  ))}
                </div>
                {errors.job_category_ids && <span className="error-message">{errors.job_category_ids}</span>}
                <small className="field-hint">Select one or more categories that best describe this job</small>
              </div>
            </div>

            {/* Auto-populated Category Fields */}
            {autoSelectedFields.length > 0 && (
              <div className="form-group">
                <label>Auto-Selected Category Fields</label>
                <div className="selected-fields">
                  {autoSelectedFields.map(fieldId => {
                    const field = categoryFields.find(f => f.category_field_id === fieldId);
                    return field ? (
                      <span key={fieldId} className="field-tag">
                        {field.category_field_name}
                      </span>
                    ) : null;
                  })}
                </div>
                <small className="field-hint">These fields are automatically added based on your selected categories</small>
              </div>
            )}            <div className="form-row">
              <div className="form-group">
                <label htmlFor="job_time">Work Schedule</label>
                <select
                  id="job_time"
                  name="job_time"
                  value={formData.job_time}
                  onChange={handleInputChange}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="job_experience_level_id">Experience Level</label>
                <select
                  id="job_experience_level_id"
                  name="job_experience_level_id"
                  value={formData.job_experience_level_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select Experience Level</option>
                  {experienceLevels.map(level => (
                    <option key={level.job_seeker_experience_level_id} value={level.job_seeker_experience_level_id}>
                      {level.experience_level_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="job_education_level_id">Education Level</label>
                <select
                  id="job_education_level_id"
                  name="job_education_level_id"
                  value={formData.job_education_level_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select Education Level</option>
                  {educationLevels.map(level => (
                    <option key={level.job_seeker_education_level_id} value={level.job_seeker_education_level_id}>
                      {level.education_level_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>💰 Compensation & Timeline</h2>
            
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
                <small className="field-hint">Monthly salary amount (optional but recommended)</small>
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
                <small className="field-hint">Leave blank if no specific deadline</small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>📝 Additional Details</h2>
            
            <div className="form-group">
              <label htmlFor="job_requirements">Requirements & Qualifications</label>
              <textarea
                id="job_requirements"
                name="job_requirements"
                value={formData.job_requirements}
                onChange={handleInputChange}
                placeholder="• Bachelor's degree in relevant field&#10;• 3+ years of experience&#10;• Proficiency in specific skills/tools&#10;• Strong communication skills&#10;• etc."
                rows="6"
              />
              <small className="field-hint">List education, experience, skills, and qualifications needed</small>
            </div>

            <div className="form-group">
              <label htmlFor="job_benefits">Benefits & Perks</label>
              <textarea
                id="job_benefits"
                name="job_benefits"
                value={formData.job_benefits}
                onChange={handleInputChange}
                placeholder="• Health insurance&#10;• Flexible working hours&#10;• Professional development opportunities&#10;• Work from home options&#10;• Performance bonuses&#10;• etc."
                rows="5"
              />
              <small className="field-hint">Highlight what makes your company attractive to candidates</small>
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
              type="button" 
              onClick={handleSaveDraft}
              className="btn-draft"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save as Draft'}
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
