import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const results = {
      tests: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };

    // Test 1: Create test accounts for each account type
    try {
      const testPassword = 'testpass123';
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      
      // Job Seeker Account (account_type_id = 2)
      const { data: jobSeekerAccount, error: jsError } = await supabase
        .from('account')
        .upsert([{
          account_email: 'jobseeker@test.com',
          account_username: 'testjobseeker',
          account_password: hashedPassword,
          account_number: 'ACC_JS_' + Date.now(),
          account_type_id: 2,
          account_is_verified: true
        }], { onConflict: 'account_email' })
        .select('account_id')
        .single();

      // Company/Employee Account (account_type_id = 1)
      const { data: companyAccount, error: compError } = await supabase
        .from('account')
        .upsert([{
          account_email: 'company@test.com',
          account_username: 'testcompany',
          account_password: hashedPassword,
          account_number: 'ACC_CO_' + Date.now(),
          account_type_id: 1,
          account_is_verified: true
        }], { onConflict: 'account_email' })
        .select('account_id')
        .single();

      if (!jsError && !compError) {
        results.tests.push({
          name: "Test Account Creation",
          status: "PASS",
          message: "Created job seeker and company test accounts"
        });
        results.summary.passed++;
      } else {
        throw new Error(`Account creation failed: ${jsError?.message || compError?.message}`);
      }
    } catch (error) {
      results.tests.push({
        name: "Test Account Creation",
        status: "FAIL", 
        message: error.message
      });
      results.summary.failed++;
    }

    // Test 2: Job Seeker Login with Correct Account Type
    try {
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'jobseeker@test.com',
          password: 'testpass123',
          userType: 'job-seeker'
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (loginResponse.ok && loginData.redirectUrl === '/app-profile/jobseeker') {
        results.tests.push({
          name: "Job Seeker Login & Redirect",
          status: "PASS",
          message: `Correct redirect: ${loginData.redirectUrl}`
        });
        results.summary.passed++;
      } else {
        throw new Error(`Expected redirect to /app-profile/jobseeker, got: ${loginData.redirectUrl || 'no redirect'}`);
      }
    } catch (error) {
      results.tests.push({
        name: "Job Seeker Login & Redirect",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    // Test 3: Company Login with Employee User Type
    try {
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'company@test.com',
          password: 'testpass123',
          userType: 'employee'
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (loginResponse.ok && loginData.redirectUrl === '/app-profile/employee') {
        results.tests.push({
          name: "Company Login as Employee & Redirect",
          status: "PASS",
          message: `Correct redirect: ${loginData.redirectUrl}`
        });
        results.summary.passed++;
      } else {
        throw new Error(`Expected redirect to /app-profile/employee, got: ${loginData.redirectUrl || 'no redirect'}`);
      }
    } catch (error) {
      results.tests.push({
        name: "Company Login as Employee & Redirect",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    // Test 4: Invalid Account Type Restriction
    try {
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'jobseeker@test.com',
          password: 'testpass123',
          userType: 'employee' // Wrong type for job seeker account
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (loginResponse.status === 401 && loginData.error.includes('select the correct account type')) {
        results.tests.push({
          name: "Account Type Restriction",
          status: "PASS",
          message: "Correctly blocked wrong account type login"
        });
        results.summary.passed++;
      } else {
        throw new Error(`Expected 401 with account type error, got: ${loginResponse.status} - ${loginData.error}`);
      }
    } catch (error) {
      results.tests.push({
        name: "Account Type Restriction",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    // Test 5: Check Account Type Mapping
    try {
      const { data: accountTypes } = await supabase
        .from('account_type')
        .select('*')
        .order('account_type_id');
      
      const expectedTypes = {
        1: 'Company',
        2: 'Job Seeker'
      };
      
      let mappingCorrect = true;
      for (const type of accountTypes) {
        if (expectedTypes[type.account_type_id] !== type.account_type_name) {
          mappingCorrect = false;
          break;
        }
      }
      
      if (mappingCorrect) {
        results.tests.push({
          name: "Account Type Mapping",
          status: "PASS",
          message: "Account types correctly mapped in database"
        });
        results.summary.passed++;
      } else {
        throw new Error('Account type mapping incorrect in database');
      }
    } catch (error) {
      results.tests.push({
        name: "Account Type Mapping",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    results.summary.total = results.summary.passed + results.summary.failed;
    
    return NextResponse.json({
      success: true,
      testResults: results,
      overallStatus: results.summary.failed === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED',
      testCredentials: {
        jobSeeker: { username: 'jobseeker@test.com', password: 'testpass123' },
        company: { username: 'company@test.com', password: 'testpass123' }
      }
    });

  } catch (error) {
    console.error('Login redirection test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
