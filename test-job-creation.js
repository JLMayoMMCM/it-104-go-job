// Test script for job creation API
const API_BASE = 'http://localhost:3001';

async function testJobCreation() {
  console.log('🧪 Testing Job Creation API...\n');

  try {
    // First, try to login as an employee to get a valid token
    console.log('1. Testing employee login...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_email: 'employee@test.com', // You might need to adjust this
        account_password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed, using test token instead');
      // Create a test with mock token (this will fail but show us the validation)
      return testWithMockToken();
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');

    // Test job creation
    console.log('\n2. Testing job creation...');
    const jobData = {
      job_name: 'Test Web Developer Position',
      job_description: 'A test job for web development',
      job_location: 'Remote',
      job_quantity: 2,
      job_type_id: 1, // Assuming this exists
      job_experience_level_id: 1,
      job_education_level_id: 1,
      job_salary: 50000,
      job_time: 'Full-time',
      job_requirements: 'React, Node.js experience',
      job_benefits: 'Health insurance, flexible hours',
      job_closing_date: '2025-07-12T00:00:00Z',
      job_is_active: true
    };

    const createResponse = await fetch(`${API_BASE}/api/employee/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify(jobData)
    });

    const createResult = await createResponse.json();
    
    if (createResponse.ok) {
      console.log('✅ Job creation successful!');
      console.log('Created job:', createResult.job);
    } else {
      console.log('❌ Job creation failed:');
      console.log('Status:', createResponse.status);
      console.log('Error:', createResult);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

async function testWithMockToken() {
  console.log('\n🔧 Testing with mock request (to see validation)...');
  
  const jobData = {
    job_name: 'Test Web Developer Position',
    job_description: 'A test job for web development',
    job_location: 'Remote',
    job_quantity: 2,
    job_type_id: 1,
    job_experience_level_id: 1,
    job_education_level_id: 1,
    job_salary: 50000,
    job_time: 'Full-time',
    job_requirements: 'React, Node.js experience',
    job_benefits: 'Health insurance, flexible hours',
    job_closing_date: '2025-07-12T00:00:00Z',
    job_is_active: true
  };

  try {
    const response = await fetch(`${API_BASE}/api/employee/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify(jobData)
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.status === 401) {
      console.log('✅ Authorization validation working correctly');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Run the test
testJobCreation();
