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
    const jobId = searchParams.get('jobId');
    const days = parseInt(searchParams.get('days')) || 30;

    // First get the employee to find the company
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, company_id')
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query for jobs
    let jobQuery = supabase
      .from('job')
      .select(`
        job_id,
        job_name,
        job_posted_date,
        job_closing_date,
        job_is_active,
        job_quantity,
        job_salary
      `)
      .eq('company_id', employee.company_id);

    if (jobId && jobId !== 'all') {
      jobQuery = jobQuery.eq('job_id', jobId);
    }

    const { data: jobs, error: jobsError } = await jobQuery;

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        performance: {},
        message: 'No jobs found'
      });
    }

    const jobIds = jobs.map(job => job.job_id);

    // Get applications data
    const { data: applications, error: appError } = await supabase
      .from('job_requests')
      .select(`
        request_id,
        job_id,
        request_date,
        request_status,
        jobseekers (
          first_name,
          last_name,
          email,
          experience_level
        )
      `)
      .in('job_id', jobIds)
      .gte('request_date', startDate.toISOString())
      .lte('request_date', endDate.toISOString());

    if (appError) {
      console.error('Error fetching applications:', appError);
    }

    // Simulate view tracking (in a real app, you'd have actual view tracking)
    const { data: allApplications, error: allAppError } = await supabase
      .from('job_requests')
      .select('request_id, job_id')
      .in('job_id', jobIds);

    if (allAppError) {
      console.error('Error fetching all applications:', allAppError);
    }

    // Calculate performance metrics for each job
    const jobPerformance = {};

    jobs.forEach(job => {
      const jobApplications = applications?.filter(app => app.job_id === job.job_id) || [];
      const totalApplications = allApplications?.filter(app => app.job_id === job.job_id).length || 0;
      
      // Simulate views (typically 10-15 views per application in real scenarios)
      const estimatedViews = Math.max(jobApplications.length * 12, totalApplications * 8);
      
      // Calculate metrics
      const acceptedApps = jobApplications.filter(app => app.request_status === 'accepted').length;
      const rejectedApps = jobApplications.filter(app => app.request_status === 'rejected').length;
      const pendingApps = jobApplications.filter(app => app.request_status === 'pending').length;
      const reviewingApps = jobApplications.filter(app => app.request_status === 'reviewing').length;

      // Calculate conversion rates
      const applicationRate = estimatedViews > 0 ? (jobApplications.length / estimatedViews * 100) : 0;
      const acceptanceRate = jobApplications.length > 0 ? (acceptedApps / jobApplications.length * 100) : 0;
      const responseRate = jobApplications.length > 0 ? ((acceptedApps + rejectedApps) / jobApplications.length * 100) : 0;

      // Calculate time-to-hire (simulated)
      const avgTimeToHire = acceptedApps > 0 ? Math.floor(Math.random() * 14) + 7 : 0; // 7-21 days

      // Calculate quality score based on candidate experience levels
      const experienceLevels = jobApplications.map(app => app.jobseekers?.experience_level).filter(Boolean);
      const qualityScore = calculateQualityScore(experienceLevels);

      // Daily application trends (last 7 days)
      const dailyTrends = [];
      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date();
        dayDate.setDate(dayDate.getDate() - i);
        const dayStart = new Date(dayDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 59, 59, 999);

        const dayApplications = jobApplications.filter(app => {
          const appDate = new Date(app.request_date);
          return appDate >= dayStart && appDate <= dayEnd;
        }).length;

        dailyTrends.push({
          date: dayDate.toISOString().split('T')[0],
          applications: dayApplications,
          dayName: dayDate.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }

      jobPerformance[job.job_id] = {
        job_name: job.job_name,
        job_posted_date: job.job_posted_date,
        job_closing_date: job.job_closing_date,
        job_is_active: job.job_is_active,
        job_salary: job.job_salary,
        metrics: {
          total_views: estimatedViews,
          total_applications: jobApplications.length,
          total_applications_all_time: totalApplications,
          pending_applications: pendingApps,
          reviewing_applications: reviewingApps,
          accepted_applications: acceptedApps,
          rejected_applications: rejectedApps,
          application_rate: Math.round(applicationRate * 100) / 100,
          acceptance_rate: Math.round(acceptanceRate * 100) / 100,
          response_rate: Math.round(responseRate * 100) / 100,
          avg_time_to_hire_days: avgTimeToHire,
          quality_score: qualityScore
        },
        trends: {
          daily_applications: dailyTrends
        },
        top_candidates: jobApplications
          .filter(app => app.request_status === 'accepted' || app.request_status === 'reviewing')
          .slice(0, 5)
          .map(app => ({
            name: app.jobseekers ? `${app.jobseekers.first_name} ${app.jobseekers.last_name}` : 'Unknown',
            email: app.jobseekers?.email || 'Unknown',
            experience_level: app.jobseekers?.experience_level || 'Unknown',
            application_date: app.request_date,
            status: app.request_status
          }))
      };
    });

    // Calculate overall company metrics
    const totalViews = Object.values(jobPerformance).reduce((sum, job) => sum + job.metrics.total_views, 0);
    const totalApplications = Object.values(jobPerformance).reduce((sum, job) => sum + job.metrics.total_applications, 0);
    const totalAccepted = Object.values(jobPerformance).reduce((sum, job) => sum + job.metrics.accepted_applications, 0);

    const overallMetrics = {
      total_views: totalViews,
      total_applications: totalApplications,
      total_jobs: jobs.length,
      active_jobs: jobs.filter(job => job.job_is_active).length,
      overall_application_rate: totalViews > 0 ? (totalApplications / totalViews * 100) : 0,
      overall_acceptance_rate: totalApplications > 0 ? (totalAccepted / totalApplications * 100) : 0,
      avg_applications_per_job: jobs.length > 0 ? (totalApplications / jobs.length) : 0
    };

    return NextResponse.json({
      overall: overallMetrics,
      jobs: jobPerformance,
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        days: days
      }
    });

  } catch (error) {
    console.error('Job performance API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateQualityScore(experienceLevels) {
  if (experienceLevels.length === 0) return 0;
  
  const scoreMap = {
    'entry': 1,
    'junior': 1.5,
    'mid': 2,
    'intermediate': 2,
    'senior': 3,
    'lead': 3.5,
    'principal': 4,
    'executive': 4,
    'director': 4.5
  };

  const totalScore = experienceLevels.reduce((sum, level) => {
    return sum + (scoreMap[level?.toLowerCase()] || 1);
  }, 0);

  const averageScore = totalScore / experienceLevels.length;
  return Math.round((averageScore / 4.5) * 100); // Convert to percentage (4.5 is max score)
}
