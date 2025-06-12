import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authorization token required'
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid token'
      }, { status: 401 });
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 30;
    const jobId = searchParams.get('jobId');

    // Get employee's company ID
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
      return NextResponse.json({
        error: 'Employee profile not found'
      }, { status: 404 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build base query for jobs
    let jobQuery = supabase
      .from('job')
      .select('job_id, job_name')
      .eq('company_id', employeeData.employee.company_id);

    if (jobId && jobId !== 'all') {
      jobQuery = jobQuery.eq('job_id', jobId);
    }

    const { data: jobs, error: jobsError } = await jobQuery;

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json({
        error: 'Failed to fetch jobs'
      }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        totalViews: 0,
        totalApplications: 0,
        applicationRate: 0,
        hiringRate: 0,
        viewsChange: 0,
        applicationsChange: 0,
        statusBreakdown: [],
        topJobs: [],
        recentActivity: []
      });
    }

    const jobIds = jobs.map(job => job.job_id);

    // Get application statistics
    const { data: applications, error: appError } = await supabase
      .from('job_requests')
      .select(`
        request_id,
        job_id,
        request_date,
        request_status
      `)
      .in('job_id', jobIds)
      .gte('request_date', startDate.toISOString())
      .lte('request_date', endDate.toISOString());

    if (appError) {
      console.error('Error fetching applications:', appError);
    }

    // Get previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevEndDate = new Date(startDate);

    const { data: prevApplications, error: prevAppError } = await supabase
      .from('job_requests')
      .select('request_id, job_id')
      .in('job_id', jobIds)
      .gte('request_date', prevStartDate.toISOString())
      .lte('request_date', prevEndDate.toISOString());

    if (prevAppError) {
      console.error('Error fetching previous applications:', prevAppError);
    }

    // Calculate metrics
    const currentApplications = applications || [];
    const previousApplications = prevApplications || [];
    
    // For views, we'll simulate data since we don't have view tracking yet
    // In a real implementation, you'd have a views table
    const totalViews = currentApplications.length * 5; // Simulate 5 views per application
    const totalApplications = currentApplications.length;
    const applicationRate = totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;
    
    const acceptedApplications = currentApplications.filter(app => app.request_status === 'accepted').length;
    const hiringRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0;

    // Calculate changes
    const viewsChange = previousApplications.length * 5; // Simulated
    const applicationsChange = totalApplications - previousApplications.length;

    // Status breakdown
    const statusCounts = {};
    currentApplications.forEach(app => {
      statusCounts[app.request_status] = (statusCounts[app.request_status] || 0) + 1;
    });

    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    // Top performing jobs
    const jobPerformance = {};
    currentApplications.forEach(app => {
      if (!jobPerformance[app.job_id]) {
        jobPerformance[app.job_id] = {
          applications: 0,
          views: 0
        };
      }
      jobPerformance[app.job_id].applications++;
      jobPerformance[app.job_id].views += 5; // Simulated
    });

    const topJobs = jobs
      .map(job => {
        const performance = jobPerformance[job.job_id] || { applications: 0, views: 0 };
        return {
          job_id: job.job_id,
          job_name: job.job_name,
          applications: performance.applications,
          views: performance.views,
          applicationRate: performance.views > 0 ? (performance.applications / performance.views) * 100 : 0
        };
      })
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5);

    // Recent activity
    const recentActivity = currentApplications
      .sort((a, b) => new Date(b.request_date) - new Date(a.request_date))
      .slice(0, 10)
      .map(app => {
        const job = jobs.find(j => j.job_id === app.job_id);
        return {
          icon: getActivityIcon(app.request_status),
          title: `New application for ${job?.job_name || 'Job'}`,
          description: `Status: ${app.request_status}`,
          time: new Date(app.request_date).toLocaleDateString()
        };
      });

    return NextResponse.json({
      totalViews,
      totalApplications,
      applicationRate,
      hiringRate,
      viewsChange,
      applicationsChange,
      statusBreakdown,
      topJobs,
      recentActivity
    });

  } catch (error) {
    console.error('Employee analytics API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

function getActivityIcon(status) {
  switch (status) {
    case 'pending': return '⏳';
    case 'reviewing': return '👀';
    case 'accepted': return '✅';
    case 'rejected': return '❌';
    default: return '📝';
  }
}
