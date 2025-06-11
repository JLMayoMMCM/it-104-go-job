import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const results = {
      loginPageChanges: [],
      apiChanges: [],
      authChanges: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };

    // Test 1: Check login page only has 2 buttons (removed company)
    try {
      const loginPageResponse = await fetch('http://localhost:3000/app-login');
      const loginPageHtml = await loginPageResponse.text();
      
      const jobSeekerButtonExists = loginPageHtml.includes('Job Seeker');
      const employeeButtonExists = loginPageHtml.includes('Employee');
      const companyButtonExists = loginPageHtml.includes('>Company<');
      
      if (jobSeekerButtonExists && employeeButtonExists && !companyButtonExists) {
        results.loginPageChanges.push({
          name: "Company Button Removed",
          status: "PASS",
          message: "Login page has Job Seeker and Employee buttons only"
        });
        results.summary.passed++;
      } else {
        throw new Error(`Button check failed. JobSeeker: ${jobSeekerButtonExists}, Employee: ${employeeButtonExists}, Company: ${companyButtonExists}`);
      }
    } catch (error) {
      results.loginPageChanges.push({
        name: "Company Button Removed",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    // Test 2: Check account types in database
    try {
      const { data: accountTypes } = await supabase
        .from('account_type')
        .select('*')
        .order('account_type_id');
      
      const hasCorrectTypes = accountTypes.length >= 2 && 
                             accountTypes.find(t => t.account_type_id === 1 && t.account_type_name === 'Company') &&
                             accountTypes.find(t => t.account_type_id === 2 && t.account_type_name === 'Job Seeker');
      
      if (hasCorrectTypes) {
        results.apiChanges.push({
          name: "Database Account Types",
          status: "PASS",
          message: "Company (1) and Job Seeker (2) types exist"
        });
        results.summary.passed++;
      } else {
        throw new Error('Account types not properly configured');
      }
    } catch (error) {
      results.apiChanges.push({
        name: "Database Account Types",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    // Test 3: Check if test accounts exist and can be used
    try {
      const { data: jobSeekerAccount } = await supabase
        .from('account')
        .select('account_id, account_type_id')
        .eq('account_email', 'jobseeker@test.com')
        .single();

      const { data: companyAccount } = await supabase
        .from('account')
        .select('account_id, account_type_id')
        .eq('account_email', 'company@test.com')
        .single();

      if (jobSeekerAccount?.account_type_id === 2 && companyAccount?.account_type_id === 1) {
        results.authChanges.push({
          name: "Test Accounts Setup",
          status: "PASS",
          message: "Job seeker and company test accounts have correct types"
        });
        results.summary.passed++;
      } else {
        throw new Error('Test accounts not properly configured');
      }
    } catch (error) {
      results.authChanges.push({
        name: "Test Accounts Setup",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    results.summary.total = results.summary.passed + results.summary.failed;
    
    return NextResponse.json({
      success: true,
      testResults: results,
      overallStatus: results.summary.failed === 0 ? 'ALL FIXES VERIFIED' : 'SOME ISSUES FOUND',
      instructions: {
        jobSeekerLogin: {
          url: 'http://localhost:3000/app-login',
          credentials: { username: 'jobseeker@test.com', password: 'testpass123', type: 'job-seeker' },
          expectedRedirect: '/app-profile/jobseeker'
        },
        employeeLogin: {
          url: 'http://localhost:3000/app-login', 
          credentials: { username: 'company@test.com', password: 'testpass123', type: 'employee' },
          expectedRedirect: '/app-profile/employee'
        }
      }
    });

  } catch (error) {
    console.error('Login fixes verification error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
