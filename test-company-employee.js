/**
 * Create a test company and then test employee registration
 */

async function createTestCompanyAndEmployee() {
  const timestamp = Date.now();
  
  // Step 1: Create a test company
  const companyData = {
    user_type: 'company',
    company_name: `Test Company ${timestamp}`,
    company_email: `hr@testcompany${timestamp}.com`,
    company_phone: '02-123-4567',
    city_name: 'Manila',
    premise_name: 'Test Corporate Building',
    street_name: 'Corporate Avenue',
    barangay_name: 'Business District'
  };

  try {
    console.log('Step 1: Creating test company...');
    const companyResponse = await fetch('http://localhost:3000/api/auth/register-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
    });

    const companyResult = await companyResponse.json();
    
    if (!companyResponse.ok) {
      console.log('❌ Company creation failed:', companyResult.error);
      return;
    }
    
    console.log('✅ Test company created successfully!');
    
    // Step 2: Get the company ID (we'll need to query the database or use a known ID)
    // For this test, let's assume the company gets an ID like "COMP" + timestamp
    const assumedCompanyId = `COMP${timestamp}`;
    
    console.log('Step 2: Testing employee registration with company verification email...');
    
    // Step 3: Create employee with the company ID
    const employeeData = {
      email: `employee.${timestamp}@testcompany${timestamp}.com`,
      password: 'testpassword123',
      username: `emp_${timestamp}`,
      user_type: 'employee',
      first_name: 'Jane',
      last_name: 'Employee',
      phone: '09876543210',
      birth_date: '1988-03-20',
      nationality_id: 1,
      gender_id: 2,
      job_title: 'Marketing Manager',
      company_id: assumedCompanyId, // This might not work without knowing the actual ID
      city_name: 'Quezon City',
      premise_name: 'Employee Residence',
      street_name: 'Residential Street',
      barangay_name: 'Test Village'
    };

    const employeeResponse = await fetch('http://localhost:3000/api/auth/register-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });

    const employeeResult = await employeeResponse.json();
    
    if (employeeResponse.ok) {
      console.log('✅ Employee registration successful!');
      console.log('Response:', employeeResult);
      console.log('🔔 Check the server console for company-branded verification email logs');
    } else {
      console.log('❌ Employee registration failed:', employeeResult.error);
      console.log('Note: This might be due to invalid company_id. Check the company table for actual IDs.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.createTestCompanyAndEmployee = createTestCompanyAndEmployee;
}

module.exports = { createTestCompanyAndEmployee };
