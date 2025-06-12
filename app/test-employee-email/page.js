'use client';
import { useState } from 'react';

export default function TestEmployeeEmail() {
  const [employeeResult, setEmployeeResult] = useState('');
  const [jobseekerResult, setJobseekerResult] = useState('');
  const [companiesResult, setCompaniesResult] = useState('');
  
  const testEmployeeRegistration = async () => {
    setEmployeeResult('Testing employee registration...');
    
    const timestamp = Date.now();
    const employeeData = {
      email: `employee.test.${timestamp}@example.com`,
      password: 'testpassword123',
      username: `emp_user_${timestamp}`,
      user_type: 'employee',
      first_name: 'John',
      last_name: 'Employee',
      phone: '09123456789',
      birth_date: '1990-05-15',
      nationality_id: 1, // Assuming Filipino is ID 1
      gender_id: 1, // Assuming male is ID 1
      job_title: 'Software Developer',
      company_id: '1', // Using company_id as string to match expected format
      city_name: 'Manila',
      premise_name: 'Test Residence',
      street_name: 'Test Street',
      barangay_name: 'Test Barangay'
    };

    try {
      console.log('Employee test data:', employeeData);
      
      const response = await fetch('/api/auth/register-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      const result = await response.json();
      
      if (response.ok) {
        setEmployeeResult(`✅ Employee registration successful!
Message: ${result.message}
Email: ${employeeData.email}
Company ID: ${employeeData.company_id}
🔔 Check the server console for company-branded verification email logs!`);
      } else {
        setEmployeeResult(`❌ Employee registration failed
Error: ${result.error}
${JSON.stringify(result, null, 2)}`);
      }
    } catch (error) {
      setEmployeeResult(`❌ Test failed with error: ${error.message}`);
    }
  };

  const testJobSeekerRegistration = async () => {
    setJobseekerResult('Testing job seeker registration...');
    
    const timestamp = Date.now();
    const jobseekerData = {
      email: `jobseeker.test.${timestamp}@example.com`,
      password: 'testpassword123',
      username: `js_user_${timestamp}`,
      user_type: 'job-seeker',
      first_name: 'Jane',
      last_name: 'JobSeeker',
      phone: '09876543210',
      birth_date: '1992-08-10',
      nationality_id: 1,
      gender_id: 2,
      city_name: 'Quezon City',
      premise_name: 'Test House',
      street_name: 'Test Avenue',
      barangay_name: 'Test District'
    };

    try {
      console.log('Job seeker test data:', jobseekerData);
      
      const response = await fetch('/api/auth/register-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobseekerData),
      });

      const result = await response.json();
      
      if (response.ok) {
        setJobseekerResult(`✅ Job seeker registration successful!
Message: ${result.message}
Email: ${jobseekerData.email}
🔔 Check the server console for standard verification email logs!`);
      } else {
        setJobseekerResult(`❌ Job seeker registration failed
Error: ${result.error}
${JSON.stringify(result, null, 2)}`);
      }
    } catch (error) {
      setJobseekerResult(`❌ Test failed with error: ${error.message}`);
    }
  };

  const checkCompanies = async () => {
    setCompaniesResult('Checking available companies...');
    
    try {
      const response = await fetch('/api/companies');
      
      if (response.ok) {
        const companies = await response.json();
        setCompaniesResult(`✅ Available Companies:
${JSON.stringify(companies, null, 2)}`);
      } else {
        setCompaniesResult(`❌ Failed to fetch companies
Companies API might not be available. Using default company_id: 1`);
      }
    } catch (error) {
      setCompaniesResult(`❌ Error checking companies: ${error.message}
Using default company_id: 1 for testing`);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px', backgroundColor: '#f5f5f5' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1>Employee Verification Email Test</h1>
        <p>This page tests the new company-branded verification email feature for employee registration.</p>
        
        <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Test Employee Registration with Company-Branded Email</h3>
          <p>This test will register an employee with a known company and send a company-branded verification email.</p>
          <button 
            style={{ background: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', margin: '10px 5px' }}
            onClick={testEmployeeRegistration}
          >
            Test Employee Registration
          </button>
          <pre style={{ background: '#f8f9fa', padding: '10px', borderRadius: '5px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {employeeResult}
          </pre>
        </div>
        
        <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Test Regular Job Seeker Registration (for comparison)</h3>
          <p>This test will register a job seeker with the standard verification email.</p>
          <button 
            style={{ background: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', margin: '10px 5px' }}
            onClick={testJobSeekerRegistration}
          >
            Test Job Seeker Registration
          </button>
          <pre style={{ background: '#f8f9fa', padding: '10px', borderRadius: '5px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {jobseekerResult}
          </pre>
        </div>
        
        <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Check Available Companies</h3>
          <p>View companies available in the database for testing.</p>
          <button 
            style={{ background: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', margin: '10px 5px' }}
            onClick={checkCompanies}
          >
            Check Companies
          </button>
          <pre style={{ background: '#f8f9fa', padding: '10px', borderRadius: '5px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {companiesResult}
          </pre>
        </div>
      </div>
    </div>
  );
}
