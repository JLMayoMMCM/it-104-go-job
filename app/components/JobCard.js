'use client';
import { useRouter } from 'next/navigation';
import './JobCard.css';

export default function JobCard({ job, showPreferenceMatch = false }) {
  const router = useRouter();

  const handleViewJob = () => {
    router.push(`/app-jobs/job-view/${job.job_id}`);
  };

  const getPreferenceMatchBadge = () => {
    if (!showPreferenceMatch || !job.preference_score) return null;
    
    if (job.preference_score === 100) {
      return (
        <span className="preference-badge perfect-match">
          ⭐ Perfect Match
        </span>
      );
    } else if (job.preference_score === 50) {
      return (
        <span className="preference-badge similar-field">
          ✨ Similar Field
        </span>
      );
    }
    return null;
  };

  const formatSalary = (salary) => {
    if (!salary) return null;
    return `₱${parseFloat(salary).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCompanyRating = () => {
    if (!job.company_rating || parseFloat(job.company_rating) === 0) return null;
    return parseFloat(job.company_rating).toFixed(1);
  };

  return (
    <div className="job-card" onClick={handleViewJob}>
      {/* Preference match indicator */}
      {showPreferenceMatch && job.preference_score > 0 && (
        <div className="preference-indicator">
          {getPreferenceMatchBadge()}
        </div>
      )}
      
      <div className="job-header">
        <h4 className="job-title">{job.job_name}</h4>
      </div>
      
      <p className="company-name">{job.company_name}</p>
      
      <div className="job-details">
        <span className="detail-item">
          <span className="detail-icon">📍</span>
          {job.job_location}
        </span>
        <span className="detail-item">
          <span className="detail-icon">💼</span>
          {job.job_type_name}
        </span>
        {job.job_time && (
          <span className="detail-item">
            <span className="detail-icon">🕒</span>
            {job.job_time}
          </span>
        )}
      </div>

      {job.job_salary && (
        <div className="salary-info">
          {formatSalary(job.job_salary)}
        </div>
      )}

      <p className="job-description">
        {job.job_description?.substring(0, 120)}...
      </p>

      <div className="job-footer">
        <div className="job-tags">
          {job.category_fields && (
            <span className="tag category-tag">
              {job.category_fields.split(', ')[0]}
            </span>
          )}
          {job.job_categories && (
            <span className="tag job-category-tag">
              {job.job_categories.split(', ')[0]}
            </span>
          )}
        </div>
        
        <div className="job-rating">
          {getCompanyRating() && (
            <div className="rating-display">
              <span className="rating-icon">⭐</span>
              {getCompanyRating()}
            </div>
          )}
        </div>
      </div>

      <div className="job-posted-date">
        Posted {formatDate(job.job_posted_date)}
      </div>
    </div>
  );
}
