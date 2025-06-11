import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const results = {
      tests: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };

    // Test 1: Check database connectivity
    try {
      const { data, error } = await supabase.from('account_type').select('*').limit(1);
      if (error) throw error;
      results.tests.push({
        name: "Database Connectivity",
        status: "PASS",
        message: "Successfully connected to database"
      });
      results.summary.passed++;
    } catch (error) {
      results.tests.push({
        name: "Database Connectivity", 
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    // Test 2: Check account_type table has correct values
    try {
      const { data: accountTypes, error } = await supabase
        .from('account_type')
        .select('*')
        .order('account_type_id');
      
      if (error) throw error;
      
      const hasCompany = accountTypes.find(t => t.account_type_name === 'Company');
      const hasJobSeeker = accountTypes.find(t => t.account_type_name === 'Job Seeker');
      
      if (hasCompany && hasJobSeeker) {
        results.tests.push({
          name: "Account Types Configuration",
          status: "PASS", 
          message: `Found account types: ${accountTypes.map(t => t.account_type_name).join(', ')}`
        });
        results.summary.passed++;
      } else {
        throw new Error('Missing required account types');
      }
    } catch (error) {
      results.tests.push({
        name: "Account Types Configuration",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    // Test 3: Check verification_codes table exists
    try {
      const { data, error } = await supabase
        .from('verification_codes')
        .select('*')
        .limit(1);
      
      if (error && error.code === '42P01') {
        throw new Error('verification_codes table does not exist');
      }
      
      results.tests.push({
        name: "Verification Codes Table",
        status: "PASS",
        message: "verification_codes table exists and accessible"
      });
      results.summary.passed++;
    } catch (error) {
      results.tests.push({
        name: "Verification Codes Table",
        status: "FAIL", 
        message: error.message
      });
      results.summary.failed++;
    }

    // Test 4: Check if test account can login as job-seeker
    try {
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123', 
          userType: 'job-seeker'
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (loginResponse.ok && loginData.token) {
        results.tests.push({
          name: "Job Seeker Login",
          status: "PASS",
          message: "Successfully logged in as job-seeker"
        });
        results.summary.passed++;
      } else {
        throw new Error(loginData.error || 'Login failed');
      }
    } catch (error) {
      results.tests.push({
        name: "Job Seeker Login",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    // Test 5: Check if test account can login as employee  
    try {
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
          userType: 'employee'
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (loginResponse.ok && loginData.token) {
        results.tests.push({
          name: "Employee Login", 
          status: "PASS",
          message: "Successfully logged in as employee"
        });
        results.summary.passed++;
      } else {
        throw new Error(loginData.error || 'Login failed');
      }
    } catch (error) {
      results.tests.push({
        name: "Employee Login",
        status: "FAIL", 
        message: error.message
      });
      results.summary.failed++;
    }

    results.summary.total = results.summary.passed + results.summary.failed;
    
    return NextResponse.json({
      success: true,
      testResults: results,
      overallStatus: results.summary.failed === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'
    });

  } catch (error) {
    console.error('End-to-end test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
