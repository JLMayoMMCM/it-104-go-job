'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import './register.css';

export default function Register() {
  const [userType, setUserType] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  // Basic account info (for job-seekers and employees)
  const [accountData, setAccountData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  // Jobseeker specific data
  const [jobseekerData, setJobseekerData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    nationality_id: '',
    gender_id: '',
    education_level: '',
    experience_level: '',
    preferred_job_type: '',
    preferred_location: '',
    preferred_salary_min: '',
    preferred_salary_max: '',
    profile_summary: '',
    skills: ''
  });  // Employee data
  const [employeeData, setEmployeeData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    nationality_id: '',
    gender_id: '',
    job_title: '',
    company_id: ''
  });
  // Company-only data (for company registration without personal account)
  const [companyData, setCompanyData] = useState({
    company_name: '',
    company_description: '',
    company_website: '',
    company_phone: '',
    company_email: ''
  });

  // Address data
  const [addressData, setAddressData] = useState({
    premise_name: '',
    street_name: '',
    barangay_name: '',
    city_name: ''
  });
  const [nationalities, setNationalities] = useState([]);
  const [genders, setGenders] = useState([]);
  // Load nationalities for jobseeker registration
  const loadNationalities = async () => {
    try {
      console.log('Loading nationalities...');
      const response = await fetch('/api/nationalities');
      if (response.ok) {
        const data = await response.json();
        console.log('Nationalities loaded:', data.length, 'records');
        setNationalities(data);
        
        if (data.length === 0) {
          setErrors(prev => ({
            ...prev,
            nationality_id: 'No nationalities available. Please try again later.'
          }));
        }
      } else {
        console.error('Failed to load nationalities:', response.status);
        setErrors(prev => ({
          ...prev,
          nationality_id: 'Failed to load nationality options. Please try again.'
        }));
      }
    } catch (error) {
      console.error('Error loading nationalities:', error);
      setErrors(prev => ({
        ...prev,
        nationality_id: 'Error loading nationality options. Please check your connection.'
      }));    }
  };

  // Load genders for registration
  const loadGenders = async () => {
    try {
      console.log('Loading genders...');
      const response = await fetch('/api/gender');
      if (response.ok) {
        const data = await response.json();
        console.log('Genders loaded:', data.length, 'records');
        setGenders(data);
        
        if (data.length === 0) {
          setErrors(prev => ({
            ...prev,
            gender_id: 'No genders available. Please try again later.'
          }));
        }
      } else {
        console.error('Failed to load genders:', response.status);
        setErrors(prev => ({
          ...prev,
          gender_id: 'Failed to load gender options. Please try again.'
        }));
      }
    } catch (error) {
      console.error('Error loading genders:', error);
      setErrors(prev => ({
        ...prev,
        gender_id: 'Error loading gender options. Please check your connection.'
      }));
    }
  };

  const handleAccountDataChange = (e) => {
    const { name, value } = e.target;
    setAccountData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleJobseekerDataChange = (e) => {
    const { name, value } = e.target;
    setJobseekerData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  const handleEmployeeDataChange = (e) => {
    const { name, value } = e.target;
    setEmployeeData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCompanyDataChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddressDataChange = (e) => {
    const { name, value } = e.target;
    setAddressData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };  const validateStep1 = () => {
    const newErrors = {};

    // Step 1: User type selection
    if (!userType) {
      newErrors.userType = 'Please select a registration type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep2 = () => {
    const newErrors = {};

    // Common validation for job-seekers and employees
    if (userType !== 'company') {
      // Username validation
      if (!accountData.username.trim()) {
        newErrors.username = 'Username is required';
      }

      // Email and password validation
      if (!accountData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(accountData.email)) {
        newErrors.email = 'Email is invalid';
      }

      if (!accountData.password) {
        newErrors.password = 'Password is required';
      } else if (accountData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (accountData.password !== accountData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (userType === 'job-seeker') {
      // Required fields based on database schema
      if (!jobseekerData.first_name.trim()) {
        newErrors.first_name = 'First name is required';
      }
      if (!jobseekerData.last_name.trim()) {
        newErrors.last_name = 'Last name is required';
      }
      if (!jobseekerData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      }      if (!jobseekerData.nationality_id) {
        newErrors.nationality_id = 'Nationality is required';
      }
      if (!jobseekerData.gender_id) {
        newErrors.gender_id = 'Gender is required';
      }
      // Address requirement - at least city name
      if (!addressData.city_name.trim()) {
        newErrors.city_name = 'City is required';
      }
    } else if (userType === 'employee') {
      // Required fields based on database schema
      if (!employeeData.first_name.trim()) {
        newErrors.first_name = 'First name is required';
      }
      if (!employeeData.last_name.trim()) {
        newErrors.last_name = 'Last name is required';
      }      if (!employeeData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      }
      if (!employeeData.birth_date) {
        newErrors.birth_date = 'Date of birth is required';
      }
      if (!employeeData.nationality_id) {
        newErrors.nationality_id = 'Nationality is required';
      }
      if (!employeeData.gender_id) {
        newErrors.gender_id = 'Gender is required';
      }
      if (!employeeData.company_id.trim()) {
        newErrors.company_id = 'Company ID is required';
      }
      // Address requirement - at least city name
      if (!addressData.city_name.trim()) {
        newErrors.city_name = 'City is required';
      }
    } else if (userType === 'company') {
      // Required fields for company registration
      if (!companyData.company_name.trim()) {
        newErrors.company_name = 'Company name is required';
      }
      if (!companyData.company_email.trim()) {
        newErrors.company_email = 'Company email is required';
      } else if (!/\S+@\S+\.\S+/.test(companyData.company_email)) {
        newErrors.company_email = 'Company email is invalid';
      }
      // Address requirement for company
      if (!addressData.city_name.trim()) {
        newErrors.city_name = 'Company city is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };const handleNext = async () => {
    if (step === 1) {      if (validateStep1()) {
        setStep(2);
        // Load nationalities and genders for personal registrations (job-seeker and employee)
        if (userType === 'job-seeker' || userType === 'employee') {
          await loadNationalities();
          await loadGenders();
        }
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      let registrationData = {
        user_type: userType
      };      // Only include email and password for non-company registrations
      if (userType !== 'company') {
        registrationData.username = accountData.username;
        registrationData.email = accountData.email;
        registrationData.password = accountData.password;
      }

      if (userType === 'job-seeker') {
        registrationData = {
          ...registrationData,
          ...jobseekerData,
          ...addressData
        };
      } else if (userType === 'employee') {
        registrationData = {
          ...registrationData,
          ...employeeData,
          ...addressData
        };
      } else if (userType === 'company') {
        registrationData = {
          ...registrationData,
          ...companyData,
          ...addressData
        };
      }const response = await fetch('/api/auth/register-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });      if (response.ok) {
        const data = await response.json();
        if (userType === 'company') {
          alert('Company registration successful! Your company has been added to our directory.');
          router.push('/'); // Redirect to home page for company registration
        } else {
          alert('Registration successful! Please check your email to verify your account.');
          // Redirect to verification page with appropriate parameters
          if (userType === 'employee') {
            router.push(`/app-login/verify?type=employee&email=${encodeURIComponent(accountData.email)}`);
          } else {
            router.push(`/app-login/verify?email=${encodeURIComponent(accountData.email)}`);
          }
        }
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">        <div className="register-header">
          <Image 
            src="/Assets/Title.png" 
            alt="Go Job Logo" 
            width={80} 
            height={80}
            className="logo"
          />
          <h1>Create Your Account</h1>
          <p>Join Go Job and start your career journey</p>
        </div>        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Type</span>
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Details</span>
          </div>
        </div>

        {step === 1 && (
          <div className="register-form">            <div className="user-type-selector">
              <h3>I am a...</h3>
              <div className="user-type-options">
                <button
                  type="button"
                  className={`user-type-btn ${userType === 'job-seeker' ? 'active' : ''}`}
                  onClick={() => setUserType('job-seeker')}
                >
                  <div className="user-type-icon">👤</div>
                  <div className="user-type-text">
                    <h4>Job Seeker</h4>
                    <p>Looking for opportunities</p>
                  </div>
                </button>
                <button
                  type="button"
                  className={`user-type-btn ${userType === 'employee' ? 'active' : ''}`}
                  onClick={() => setUserType('employee')}
                >
                  <div className="user-type-icon">👨‍💼</div>
                  <div className="user-type-text">
                    <h4>Employee</h4>
                    <p>Working for a company</p>
                  </div>
                </button>
                <button
                  type="button"
                  className={`user-type-btn ${userType === 'company' ? 'active' : ''}`}
                  onClick={() => setUserType('company')}
                >
                  <div className="user-type-icon">🏢</div>
                  <div className="user-type-text">
                    <h4>Company</h4>
                    <p>Hiring talented people</p>
                  </div>
                </button>              </div>
              {errors.userType && <span className="error-message">{errors.userType}</span>}
            </div>

            <button 
              type="button" 
              onClick={handleNext}
              className="btn-next"
              disabled={!userType}
            >
              Next Step
            </button>
          </div>
        )}        {step === 2 && userType === 'job-seeker' && (
          <form onSubmit={handleSubmit} className="register-form">
            <h3>Account Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={accountData.username}
                  onChange={handleAccountDataChange}
                  placeholder="Choose a username"
                  className={errors.username ? 'error' : ''}
                />
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={accountData.email}
                  onChange={handleAccountDataChange}
                  placeholder="Enter your email"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={accountData.password}
                  onChange={handleAccountDataChange}
                  placeholder="Create a password"
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={accountData.confirmPassword}
                  onChange={handleAccountDataChange}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>

            <h3>Personal Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={jobseekerData.first_name}
                  onChange={handleJobseekerDataChange}
                  placeholder="First name"
                  className={errors.first_name ? 'error' : ''}
                />
                {errors.first_name && <span className="error-message">{errors.first_name}</span>}
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={jobseekerData.last_name}
                  onChange={handleJobseekerDataChange}
                  placeholder="Last name"
                  className={errors.last_name ? 'error' : ''}
                />
                {errors.last_name && <span className="error-message">{errors.last_name}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={jobseekerData.phone}
                  onChange={handleJobseekerDataChange}
                  placeholder="Phone number"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label>Birth Date</label>
                <input
                  type="date"
                  name="birth_date"
                  value={jobseekerData.birth_date}
                  onChange={handleJobseekerDataChange}
                  className={errors.birth_date ? 'error' : ''}
                />
                {errors.birth_date && <span className="error-message">{errors.birth_date}</span>}
              </div>
            </div>            <div className="form-row">
              <div className="form-group">
                <label>Nationality *</label>
                <select
                  name="nationality_id"
                  value={jobseekerData.nationality_id}
                  onChange={handleJobseekerDataChange}
                  className={errors.nationality_id ? 'error' : ''}
                >
                  <option value="">Select Nationality</option>
                  {nationalities.map(nationality => (
                    <option key={nationality.nationality_id} value={nationality.nationality_id}>
                      {nationality.nationality_name}
                    </option>
                  ))}
                </select>
                {errors.nationality_id && <span className="error-message">{errors.nationality_id}</span>}
              </div>              <div className="form-group">
                <label>Gender *</label>
                <select
                  name="gender_id"
                  value={jobseekerData.gender_id}
                  onChange={handleJobseekerDataChange}
                  className={errors.gender_id ? 'error' : ''}
                >
                  <option value="">Select Gender</option>
                  {genders.map(gender => (
                    <option key={gender.gender_id} value={gender.gender_id}>
                      {gender.gender_name}
                    </option>
                  ))}
                </select>
                {errors.gender_id && <span className="error-message">{errors.gender_id}</span>}
              </div>
            </div>

            <h3>Career Preferences</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Education Level</label>
                <select
                  name="education_level"
                  value={jobseekerData.education_level}
                  onChange={handleJobseekerDataChange}
                >
                  <option value="">Select Education</option>
                  <option value="High School">High School</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="PhD">PhD</option>
                  <option value="Vocational">Vocational</option>
                </select>
              </div>

              <div className="form-group">
                <label>Experience Level</label>
                <select
                  name="experience_level"
                  value={jobseekerData.experience_level}
                  onChange={handleJobseekerDataChange}
                >
                  <option value="">Select Experience</option>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
            </div>

            <h3>Address Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label>House/Building Name</label>
                <input
                  type="text"
                  name="premise_name"
                  value={addressData.premise_name}
                  onChange={handleAddressDataChange}
                  placeholder="House/Building name (optional)"
                />
              </div>

              <div className="form-group">
                <label>Street Name</label>
                <input
                  type="text"
                  name="street_name"
                  value={addressData.street_name}
                  onChange={handleAddressDataChange}
                  placeholder="Street name (optional)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Barangay</label>
                <input
                  type="text"
                  name="barangay_name"
                  value={addressData.barangay_name}
                  onChange={handleAddressDataChange}
                  placeholder="Barangay (optional)"
                />
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city_name"
                  value={addressData.city_name}
                  onChange={handleAddressDataChange}
                  placeholder="City"
                  className={errors.city_name ? 'error' : ''}
                />
                {errors.city_name && <span className="error-message">{errors.city_name}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Profile Summary</label>
              <textarea
                name="profile_summary"
                value={jobseekerData.profile_summary}
                onChange={handleJobseekerDataChange}
                placeholder="Tell us about yourself and your career goals..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleBack} className="btn-back">
                Back
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            {errors.submit && <div className="error-message">{errors.submit}</div>}
          </form>
        )}        {step === 2 && userType === 'employee' && (
          <form onSubmit={handleSubmit} className="register-form">
            <h3>Account Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={accountData.username}
                  onChange={handleAccountDataChange}
                  placeholder="Choose a username"
                  className={errors.username ? 'error' : ''}
                />
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={accountData.email}
                  onChange={handleAccountDataChange}
                  placeholder="Enter your email"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={accountData.password}
                  onChange={handleAccountDataChange}
                  placeholder="Create a password"
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={accountData.confirmPassword}
                  onChange={handleAccountDataChange}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>

            <h3>Personal Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={employeeData.first_name}
                  onChange={handleEmployeeDataChange}
                  placeholder="First name"
                  className={errors.first_name ? 'error' : ''}
                />
                {errors.first_name && <span className="error-message">{errors.first_name}</span>}
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={employeeData.last_name}
                  onChange={handleEmployeeDataChange}
                  placeholder="Last name"
                  className={errors.last_name ? 'error' : ''}
                />
                {errors.last_name && <span className="error-message">{errors.last_name}</span>}
              </div>
            </div>            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={employeeData.phone}
                  onChange={handleEmployeeDataChange}
                  placeholder="Phone number"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label>Birth Date *</label>
                <input
                  type="date"
                  name="birth_date"
                  value={employeeData.birth_date}
                  onChange={handleEmployeeDataChange}
                  className={errors.birth_date ? 'error' : ''}
                />
                {errors.birth_date && <span className="error-message">{errors.birth_date}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  name="job_title"
                  value={employeeData.job_title}
                  onChange={handleEmployeeDataChange}
                  placeholder="Your position"
                />
              </div>
            </div><div className="form-row">
              <div className="form-group">
                <label>Nationality *</label>
                <select
                  name="nationality_id"
                  value={employeeData.nationality_id}
                  onChange={handleEmployeeDataChange}
                  className={errors.nationality_id ? 'error' : ''}
                >
                  <option value="">Select Nationality</option>
                  {nationalities.map(nationality => (
                    <option key={nationality.nationality_id} value={nationality.nationality_id}>
                      {nationality.nationality_name}
                    </option>
                  ))}
                </select>
                {errors.nationality_id && <span className="error-message">{errors.nationality_id}</span>}
              </div>              <div className="form-group">
                <label>Gender *</label>
                <select
                  name="gender_id"
                  value={employeeData.gender_id}
                  onChange={handleEmployeeDataChange}
                  className={errors.gender_id ? 'error' : ''}
                >
                  <option value="">Select Gender</option>
                  {genders.map(gender => (
                    <option key={gender.gender_id} value={gender.gender_id}>
                      {gender.gender_name}
                    </option>
                  ))}
                </select>
                {errors.gender_id && <span className="error-message">{errors.gender_id}</span>}
              </div>
            </div>

            <h3>Company Information</h3>

            <div className="form-group">
              <label>Company ID *</label>
              <input
                type="text"
                name="company_id"
                value={employeeData.company_id}
                onChange={handleEmployeeDataChange}
                placeholder="Enter your company ID"
                className={errors.company_id ? 'error' : ''}
              />
              {errors.company_id && <span className="error-message">{errors.company_id}</span>}
              <small className="help-text">Contact your company administrator for the company ID</small>
            </div>

            <h3>Address Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label>House/Building Name</label>
                <input
                  type="text"
                  name="premise_name"
                  value={addressData.premise_name}
                  onChange={handleAddressDataChange}
                  placeholder="House/Building name (optional)"
                />
              </div>

              <div className="form-group">
                <label>Street Name</label>
                <input
                  type="text"
                  name="street_name"
                  value={addressData.street_name}
                  onChange={handleAddressDataChange}
                  placeholder="Street name (optional)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Barangay</label>
                <input
                  type="text"
                  name="barangay_name"
                  value={addressData.barangay_name}
                  onChange={handleAddressDataChange}
                  placeholder="Barangay (optional)"
                />
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city_name"
                  value={addressData.city_name}
                  onChange={handleAddressDataChange}
                  placeholder="City"
                  className={errors.city_name ? 'error' : ''}
                />
                {errors.city_name && <span className="error-message">{errors.city_name}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleBack} className="btn-back">
                Back
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>            {errors.submit && <div className="error-message">{errors.submit}</div>}
          </form>
        )}

        {step === 2 && userType === 'company' && (
          <form onSubmit={handleSubmit} className="register-form">
            <h3>Company Information</h3>
            
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="company_name"
                value={companyData.company_name}
                onChange={handleCompanyDataChange}
                placeholder="Company name"
                className={errors.company_name ? 'error' : ''}
              />
              {errors.company_name && <span className="error-message">{errors.company_name}</span>}
            </div>            <div className="form-row">
              <div className="form-group">
                <label>Company Email</label>
                <input
                  type="email"
                  name="company_email"
                  value={companyData.company_email}
                  onChange={handleCompanyDataChange}
                  placeholder="company@example.com (optional)"
                />
              </div>

              <div className="form-group">
                <label>Company Phone</label>
                <input
                  type="tel"
                  name="company_phone"
                  value={companyData.company_phone}
                  onChange={handleCompanyDataChange}
                  placeholder="Company phone number"
                />
              </div>
            </div>            <div className="form-group">
              <label>Company Website</label>
              <input
                type="url"
                name="company_website"
                value={companyData.company_website}
                onChange={handleCompanyDataChange}
                placeholder="https://www.company.com"
              />
            </div>            <div className="form-group">
              <label>Company Description</label>
              <textarea
                name="company_description"
                value={companyData.company_description}
                onChange={handleCompanyDataChange}
                placeholder="Brief description of your company..."
                rows="3"
              />
            </div>

            <h3>Company Address</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Building/Office Name</label>
                <input
                  type="text"
                  name="premise_name"
                  value={addressData.premise_name}
                  onChange={handleAddressDataChange}
                  placeholder="Building/Office name (optional)"
                />
              </div>

              <div className="form-group">
                <label>Street Name</label>
                <input
                  type="text"
                  name="street_name"
                  value={addressData.street_name}
                  onChange={handleAddressDataChange}
                  placeholder="Street name (optional)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Barangay</label>
                <input
                  type="text"
                  name="barangay_name"
                  value={addressData.barangay_name}
                  onChange={handleAddressDataChange}
                  placeholder="Barangay (optional)"
                />
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city_name"
                  value={addressData.city_name}
                  onChange={handleAddressDataChange}
                  placeholder="City"
                  className={errors.city_name ? 'error' : ''}
                />
                {errors.city_name && <span className="error-message">{errors.city_name}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleBack} className="btn-back">
                Back
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Company Account'}
              </button>
            </div>

            {errors.submit && <div className="error-message">{errors.submit}</div>}
          </form>
        )}

        <div className="register-footer">
          <p>Already have an account? <a href="/app-login">Sign in here</a></p>
        </div>
      </div>
    </div>
  );
}
