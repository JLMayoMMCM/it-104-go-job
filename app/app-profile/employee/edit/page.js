'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../components/DashboardHeader';
import './employee-edit.css';

export default function EditEmployeeProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form data states
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    nationalityId: ''
  });

  const [employmentData, setEmploymentData] = useState({
    position: '',
    department: '',
    hireDate: ''
  });
  const [addressData, setAddressData] = useState({
    premiseName: '',
    streetName: '',
    barangayName: '',
    cityName: ''
  });

  const [profilePictureData, setProfilePictureData] = useState({
    currentPicture: null,
    newPicture: null,
    picturePreview: null
  });

  const [resumeData, setResumeData] = useState({
    currentResume: null,
    newResume: null,
    resumePreview: null
  });

  // Reference data
  const [nationalities, setNationalities] = useState([]);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

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
        await loadProfileData(token);
        await loadReferenceData();
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
  const loadProfileData = async (token) => {
    try {
      const response = await fetch('/api/employee/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Set personal data using correct field names
        setPersonalData({
          firstName: data.profile.first_name || '',
          lastName: data.profile.last_name || '',
          phone: data.profile.phone || '',
          dateOfBirth: data.profile.date_of_birth || '',
          nationalityId: data.profile.nationality_id || ''
        });

        // Set employment data using correct field names
        setEmploymentData({
          position: data.profile.position_name || '',
          department: data.profile.department || '',
          hireDate: data.profile.hire_date || ''
        });        // Set address data using correct field names
        setAddressData({
          premiseName: data.profile.address?.premise_name || '',
          streetName: data.profile.address?.street_name || '',
          barangayName: data.profile.address?.barangay_name || '',
          cityName: data.profile.address?.city_name || ''
        });

        // Set current profile picture
        if (data.profile.profile_picture) {
          setProfilePictureData(prev => ({
            ...prev,
            currentPicture: data.profile.profile_picture
          }));
        }

        // Set current resume (if exists)
        if (data.profile.resume_file) {
          setResumeData(prev => ({
            ...prev,
            currentResume: data.profile.resume_file
          }));
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const loadReferenceData = async () => {
    try {
      // Load nationalities
      const nationalitiesResponse = await fetch('/api/nationalities');
      if (nationalitiesResponse.ok) {
        const nationalitiesData = await nationalitiesResponse.json();
        setNationalities(nationalitiesData.nationalities || []);
      }
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const savePersonalData = async () => {
    setSaving(true);
    setErrorMessage('');
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/employee/profile/personal', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personalData)
      });

      if (response.ok) {
        setSuccessMessage('Personal information updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to update personal information');
      }
    } catch (error) {
      console.error('Error saving personal data:', error);
      setErrorMessage('Failed to update personal information');
    } finally {
      setSaving(false);
    }
  };
  const saveAddressData = async () => {
    setSaving(true);
    setErrorMessage('');
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/employee/profile/address', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressData)
      });

      if (response.ok) {
        setSuccessMessage('Address information updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to update address information');
      }
    } catch (error) {
      console.error('Error saving address data:', error);
      setErrorMessage('Failed to update address information');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrorMessage('Profile picture file size must be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Profile picture must be a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }

      setProfilePictureData(prev => ({
        ...prev,
        newPicture: file,
        picturePreview: URL.createObjectURL(file)
      }));
      setErrorMessage('');
    }
  };

  const saveProfilePicture = async () => {
    if (!profilePictureData.newPicture) {
      setErrorMessage('Please select a profile picture to upload');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('profilePicture', profilePictureData.newPicture);

      const response = await fetch('/api/employee/profile/picture', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setProfilePictureData(prev => ({
          ...prev,
          currentPicture: data.fileName,
          newPicture: null,
          picturePreview: null
        }));
        setSuccessMessage('Profile picture updated successfully!');
        
        // Trigger header refresh
        window.dispatchEvent(new Event('profileUpdated'));
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error saving profile picture:', error);
      setErrorMessage('Failed to upload profile picture');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setErrorMessage('Resume file size must be less than 10MB');
        return;
      }

      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Resume must be a PDF or Word document');
        return;
      }

      setResumeData(prev => ({
        ...prev,
        newResume: file,
        resumePreview: file.type === 'application/pdf' ? URL.createObjectURL(file) : null
      }));
      setErrorMessage('');
    }
  };

  const saveResume = async () => {
    if (!resumeData.newResume) {
      setErrorMessage('Please select a resume file to upload');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('resume', resumeData.newResume);

      const response = await fetch('/api/employee/profile/resume', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setResumeData(prev => ({
          ...prev,
          currentResume: data.fileName,
          newResume: null,
          resumePreview: null
        }));
        setSuccessMessage('Resume uploaded successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      setErrorMessage('Failed to upload resume');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      {user && <DashboardHeader user={user} />}
      
      <div className="edit-profile-content">
        <div className="edit-profile-header">
          <button 
            onClick={() => router.push('/app-profile/employee')}
            className="back-button"
          >
            ← Back to Profile
          </button>
          <h1>Edit Employee Profile</h1>
          <p>Update your personal and employment information</p>
        </div>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        <div className="edit-profile-tabs">
          <button 
            onClick={() => setActiveTab('personal')}
            className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
          >
            Personal Information
          </button>
          <button 
            onClick={() => setActiveTab('address')}
            className={`tab-button ${activeTab === 'address' ? 'active' : ''}`}
          >
            Address
          </button>          <button 
            onClick={() => setActiveTab('employment')}
            className={`tab-button ${activeTab === 'employment' ? 'active' : ''}`}
          >
            Employment Info
          </button>
          <button 
            onClick={() => setActiveTab('picture')}
            className={`tab-button ${activeTab === 'picture' ? 'active' : ''}`}
          >
            Profile Picture
          </button>
          <button 
            onClick={() => setActiveTab('resume')}
            className={`tab-button ${activeTab === 'resume' ? 'active' : ''}`}
          >
            Resume
          </button>
        </div>

        <div className="edit-profile-form">
          {activeTab === 'personal' && (
            <div className="form-section">
              <h2>Personal Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={personalData.firstName}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    value={personalData.lastName}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    value={personalData.phone}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    value={personalData.dateOfBirth}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nationality">Nationality</label>
                  <select
                    id="nationality"
                    value={personalData.nationalityId}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, nationalityId: e.target.value }))}
                  >
                    <option value="">Select nationality</option>
                    {nationalities.map(nationality => (
                      <option key={nationality.nationality_id} value={nationality.nationality_id}>
                        {nationality.nationality_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button 
                  onClick={savePersonalData}
                  disabled={saving}
                  className="save-button"
                >
                  {saving ? 'Saving...' : 'Save Personal Information'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="form-section">
              <h2>Address Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="premiseName">Building/Premise Name</label>
                  <input
                    type="text"
                    id="premiseName"
                    value={addressData.premiseName}
                    onChange={(e) => setAddressData(prev => ({ ...prev, premiseName: e.target.value }))}
                    placeholder="Enter building or premise name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="streetName">Street Name</label>
                  <input
                    type="text"
                    id="streetName"
                    value={addressData.streetName}
                    onChange={(e) => setAddressData(prev => ({ ...prev, streetName: e.target.value }))}
                    placeholder="Enter street name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="barangayName">Barangay</label>
                  <input
                    type="text"
                    id="barangayName"
                    value={addressData.barangayName}
                    onChange={(e) => setAddressData(prev => ({ ...prev, barangayName: e.target.value }))}
                    placeholder="Enter barangay name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cityName">City</label>
                  <input
                    type="text"
                    id="cityName"
                    value={addressData.cityName}
                    onChange={(e) => setAddressData(prev => ({ ...prev, cityName: e.target.value }))}
                    placeholder="Enter city name"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button 
                  onClick={saveAddressData}
                  disabled={saving}
                  className="save-button"
                >
                  {saving ? 'Saving...' : 'Save Address Information'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'employment' && (
            <div className="form-section">
              <h2>Employment Information</h2>
              <p className="info-note">
                <strong>Note:</strong> Employment information can only be updated by your company administrator.
                Contact your HR department to make changes to your position, department, or hire date.
              </p>
              <div className="form-grid readonly">
                <div className="form-group">
                  <label htmlFor="position">Position</label>
                  <input
                    type="text"
                    id="position"
                    value={employmentData.position}
                    readOnly
                    className="readonly-field"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    value={employmentData.department}
                    readOnly
                    className="readonly-field"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="hireDate">Hire Date</label>
                  <input
                    type="date"
                    id="hireDate"
                    value={employmentData.hireDate}
                    readOnly
                    className="readonly-field"
                  />
                </div>              </div>
            </div>
          )}

          {activeTab === 'picture' && (
            <div className="form-section">
              <h2>Profile Picture</h2>
              
              {profilePictureData.currentPicture && (
                <div className="current-picture">
                  <h3>Current Profile Picture</h3>
                  <div className="picture-preview">
                    <img 
                      src={`/uploads/pictures/${profilePictureData.currentPicture}`} 
                      alt="Current profile picture"
                      className="current-picture-img"
                    />
                  </div>
                </div>
              )}

              <div className="picture-upload">
                <h3>Upload New Profile Picture</h3>
                <div className="upload-area">
                  <input
                    type="file"
                    id="pictureFile"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleProfilePictureUpload}
                    className="file-input"
                  />
                  <label htmlFor="pictureFile" className="upload-label">
                    <span className="upload-icon">🖼️</span>
                    Choose Picture
                  </label>
                  <p className="upload-note">
                    Accepted formats: JPEG, PNG, GIF, WebP (Max 5MB)
                  </p>
                </div>

                {profilePictureData.newPicture && (
                  <div className="new-picture-info">
                    <p><strong>Selected:</strong> {profilePictureData.newPicture.name}</p>
                    <p><strong>Size:</strong> {(profilePictureData.newPicture.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}

                {profilePictureData.picturePreview && (
                  <div className="picture-preview">
                    <h4>Preview</h4>
                    <img
                      src={profilePictureData.picturePreview}
                      alt="Profile picture preview"
                      className="picture-preview-img"
                    />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button 
                  onClick={saveProfilePicture}
                  disabled={saving || !profilePictureData.newPicture}
                  className="save-button"
                >
                  {saving ? 'Uploading...' : 'Update Profile Picture'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="form-section">
              <h2>Resume</h2>
              
              {resumeData.currentResume && (
                <div className="current-resume">
                  <h3>Current Resume</h3>
                  <div className="resume-info">
                    <span className="resume-icon">📄</span>
                    <span className="resume-name">{resumeData.currentResume}</span>
                    <button 
                      onClick={() => window.open(`/api/resume/download/${resumeData.currentResume}`, '_blank')}
                      className="download-button"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}

              <div className="resume-upload">
                <h3>Upload New Resume</h3>
                <div className="upload-area">
                  <input
                    type="file"
                    id="resumeFile"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="file-input"
                  />
                  <label htmlFor="resumeFile" className="upload-label">
                    <span className="upload-icon">📁</span>
                    Choose File
                  </label>
                  <p className="upload-note">
                    Accepted formats: PDF, DOC, DOCX (Max 10MB)
                  </p>
                </div>

                {resumeData.newResume && (
                  <div className="new-resume-info">
                    <p><strong>Selected:</strong> {resumeData.newResume.name}</p>
                    <p><strong>Size:</strong> {(resumeData.newResume.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}

                {resumeData.resumePreview && (
                  <div className="resume-preview">
                    <h4>Preview</h4>
                    <iframe
                      src={resumeData.resumePreview}
                      width="100%"
                      height="500px"
                      title="Resume Preview"
                      style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button 
                  onClick={saveResume}
                  disabled={saving || !resumeData.newResume}
                  className="save-button"
                >
                  {saving ? 'Uploading...' : 'Upload Resume'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
