import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const results = {
      tests: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };

    // Test login as job-seeker
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
          name: "Job Seeker Login Flow",
          status: "PASS",
          message: "Successfully logged in as job-seeker, should redirect to /app-dashboard",
          userType: "job-seeker",
          expectedRedirect: "/app-dashboard"
        });
        results.summary.passed++;
      } else {
        throw new Error(loginData.error || 'Login failed');
      }
    } catch (error) {
      results.tests.push({
        name: "Job Seeker Login Flow",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    // Test login as employee
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
          name: "Employee Login Flow",
          status: "PASS",
          message: "Successfully logged in as employee, should redirect to /app-dashboard",
          userType: "employee",
          expectedRedirect: "/app-dashboard"
        });
        results.summary.passed++;
      } else {
        throw new Error(loginData.error || 'Login failed');
      }
    } catch (error) {
      results.tests.push({
        name: "Employee Login Flow",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    // Test dashboard accessibility
    try {
      const dashboardResponse = await fetch('http://localhost:3000/app-dashboard');
      if (dashboardResponse.ok) {
        results.tests.push({
          name: "Dashboard Accessibility",
          status: "PASS",
          message: "Dashboard page is accessible"
        });
        results.summary.passed++;
      } else {
        throw new Error('Dashboard page not accessible');
      }
    } catch (error) {
      results.tests.push({
        name: "Dashboard Accessibility",
        status: "FAIL",
        message: error.message
      });
      results.summary.failed++;
    }

    results.summary.total = results.summary.passed + results.summary.failed;
    
    return NextResponse.json({
      success: true,
      testResults: results,
      loginFlowStatus: results.summary.failed === 0 ? 'ALL LOGIN FLOWS WORKING' : 'SOME ISSUES DETECTED',
      instructions: {
        jobSeeker: "Login with userType='job-seeker' → Redirects to /app-dashboard → Shows job seeker specific content",
        employee: "Login with userType='employee' → Redirects to /app-dashboard → Shows employee specific content"
      }
    });

  } catch (error) {
    console.error('Login flow test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
