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

    // Get employee and company info
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, company_id')
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get active jobs count
    const { count: activeJobsCount } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', employee.company_id)
      .eq('status', 'active');

    // Get total applications count
    const { count: totalApplicationsCount } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('jobs.company_id', employee.company_id);

    // Get pending applications count
    const { count: pendingApplicationsCount } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('jobs.company_id', employee.company_id)
      .eq('status', 'pending');

    // Get hired candidates this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const { count: hiredCount } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('jobs.company_id', employee.company_id)
      .eq('status', 'accepted')
      .gte('updated_at', thisMonth.toISOString());

    // Get recent activity
    const recentActivity = [];

    // Recent applications
    const { data: recentApplications } = await supabase
      .from('job_applications')
      .select(`
        id,
        applied_at,
        status,
        jobs!inner (
          id,
          title,
          company_id
        ),
        jobseekers (
          first_name,
          last_name
        )
      `)
      .eq('jobs.company_id', employee.company_id)
      .order('applied_at', { ascending: false })
      .limit(3);

    if (recentApplications) {
      recentApplications.forEach(app => {
        recentActivity.push({
          icon: '👤',
          title: `New application from ${app.jobseekers.first_name} ${app.jobseekers.last_name}`,
          description: `For ${app.jobs.title}`,
          time: new Date(app.applied_at).toLocaleDateString()
        });
      });
    }

    // Recent job posts
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        posted_date,
        status
      `)
      .eq('company_id', employee.company_id)
      .order('posted_date', { ascending: false })
      .limit(2);

    if (recentJobs) {
      recentJobs.forEach(job => {
        recentActivity.push({
          icon: '📋',
          title: `Posted ${job.title}`,
          description: `Job status: ${job.status}`,
          time: new Date(job.posted_date).toLocaleDateString()
        });
      });
    }

    // Sort activity by most recent
    recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));

    const stats = {
      activeJobs: activeJobsCount || 0,
      totalApplications: totalApplicationsCount || 0,
      pendingApplications: pendingApplicationsCount || 0,
      hiredCandidates: hiredCount || 0
    };

    return NextResponse.json({
      stats,
      recentActivity: recentActivity.slice(0, 5)
    });

  } catch (error) {
    console.error('Employee stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
