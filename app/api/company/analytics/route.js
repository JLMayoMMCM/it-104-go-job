import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  try {
    // Extract JWT token from cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 30;

    // First get the employee to find the company
    const { data: employeeData, error: employeeError } = await supabase
      .from('account')
      .select(`
        employee (
          employee_id,
          company_id
        )
      `)
      .eq('account_id', userId)
      .single();

    if (employeeError || !employeeData?.employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const companyId = employeeData.employee.company_id;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all jobs for the company
    const { data: jobs, error: jobsError } = await supabase
      .from('job')
      .select('job_id, job_name, job_location, created_at, status')
      .eq('company_id', companyId);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    // Get all applications for the company's jobs
    const jobIds = jobs?.map(job => job.job_id) || [];
    
    let applications = [];
    
    if (jobIds.length > 0) {
      const { data: appData } = await supabase
        .from('job_application')
        .select('application_id, job_id, application_date, application_status')
        .in('job_id', jobIds)
        .gte('application_date', startDate.toISOString())
        .lte('application_date', endDate.toISOString());

      applications = appData || [];
    }

    // Calculate metrics
    const totalJobs = jobs?.length || 0;
    const activeJobs = jobs?.filter(job => job.status === 'active').length || 0;
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.application_status === 'pending').length;
    const acceptedApplications = applications.filter(app => app.application_status === 'accepted').length;

    // Top performing jobs
    const jobPerformance = jobs?.map(job => {
      const jobApplications = applications.filter(app => app.job_id === job.job_id);
      return {
        id: job.job_id,
        title: job.job_name,
        location: job.job_location,
        applications: jobApplications.length,
        status: job.status
      };
    }).sort((a, b) => b.applications - a.applications).slice(0, 5) || [];

    // Application status breakdown
    const statusBreakdown = {
      pending: pendingApplications,
      reviewing: applications.filter(app => app.application_status === 'reviewing').length,
      accepted: acceptedApplications,
      rejected: applications.filter(app => app.application_status === 'rejected').length
    };

    const analytics = {
      overview: {
        totalJobs,
        activeJobs,
        totalApplications,
        applicationsChange: '+0',
        applicationsChangePercent: '+0%',
        conversionRate: totalApplications > 0 ? ((acceptedApplications / totalApplications) * 100).toFixed(1) : '0'
      },
      statusBreakdown,
      topJobs: jobPerformance,
      dailyTrends: [],
      monthlyData: [],
      recentActivity: [],
      companyInfo: {
        name: 'Company Analytics',
        industry: 'Technology'
      }
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics data',
      details: error.message 
    }, { status: 500 });
  }
}
