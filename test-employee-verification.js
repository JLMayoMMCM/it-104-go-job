/**
 * Test script for employee registration with company verification email
 */

async function testEmployeeRegistration() {
  const timestamp = Date.now();
  
  const employeeTestData = {
    email: `employee.test.${timestamp}@example.com`,
    password: 'testpassword123',
    username: `emp_user_${timestamp}`,
    user_type: 'employee',
    first_name: 'John',
    last_name: 'Employee',
    phone: '09123456789',
    birth_date: '1990-05-15',
    nationality_id: 1, // Assuming this exists
    gender_id: 1, // Assuming this exists
    job_title: 'Software Developer',
    company_id: 'COMP001', // This should be a valid company ID
    city_name: 'Manila',
    premise_name: 'Test Residence',
    street_name: 'Test Street',
    barangay_name: 'Test Barangay'
  };

  try {
    console.log('Testing employee registration with company verification email...');
    console.log('Test data:', employeeTestData);
    
    const response = await fetch('http://localhost:3000/api/auth/register-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeTestData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Employee registration successful!');
      console.log('Response:', result);
      console.log('🔔 Check the server console for email sending logs');
    } else {
      console.log('❌ Registration failed:');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  // This is Node.js environment
  const fetch = require('node-fetch');
  testEmployeeRegistration();
} else {
  // This is browser environment
  window.testEmployeeRegistration = testEmployeeRegistration;
  console.log('testEmployeeRegistration function is available in the browser console');
}
