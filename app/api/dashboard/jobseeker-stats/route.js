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

    // Get jobseeker ID
    const { data: jobseeker, error: jobseekerError } = await supabase
      .from('jobseekers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (jobseekerError || !jobseeker) {
      return NextResponse.json({ error: 'Jobseeker not found' }, { status: 404 });
    }

    // Get saved jobs count
    const { count: savedJobsCount } = await supabase
      .from('saved_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('jobseeker_id', jobseeker.id);

    // Get applied jobs count
    const { count: appliedJobsCount } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('jobseeker_id', jobseeker.id);

    // Get recommended jobs count (simplified - all active jobs matching preferences)
    const { data: jobseekerPrefs } = await supabase
      .from('jobseekers')
      .select('preferred_job_type, preferred_location')
      .eq('id', jobseeker.id)
      .single();

    let recommendedQuery = supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    if (jobseekerPrefs?.preferred_job_type) {
      recommendedQuery = recommendedQuery.eq('job_type', jobseekerPrefs.preferred_job_type);
    }

    if (jobseekerPrefs?.preferred_location) {
      recommendedQuery = recommendedQuery.ilike('location', `%${jobseekerPrefs.preferred_location}%`);
    }

    const { count: recommendedJobsCount } = await recommendedQuery;

    // Get recent activity
    const recentActivity = [];

    // Recent applications
    const { data: recentApplications } = await supabase
      .from('job_applications')
      .select(`
        id,
        applied_at,
        status,
        jobs (
          id,
          title,
          companies (
            name
          )
        )
      `)
      .eq('jobseeker_id', jobseeker.id)
      .order('applied_at', { ascending: false })
      .limit(3);

    if (recentApplications) {
      recentApplications.forEach(app => {
        recentActivity.push({
          icon: '📝',
          title: `Applied to ${app.jobs.title}`,
          description: `At ${app.jobs.companies.name}`,
          time: new Date(app.applied_at).toLocaleDateString()
        });
      });
    }

    // Recent saved jobs
    const { data: recentSavedJobs } = await supabase
      .from('saved_jobs')
      .select(`
        id,
        saved_at,
        jobs (
          id,
          title,
          companies (
            name
          )
        )
      `)
      .eq('jobseeker_id', jobseeker.id)
      .order('saved_at', { ascending: false })
      .limit(2);

    if (recentSavedJobs) {
      recentSavedJobs.forEach(saved => {
        recentActivity.push({
          icon: '💾',
          title: `Saved ${saved.jobs.title}`,
          description: `At ${saved.jobs.companies.name}`,
          time: new Date(saved.saved_at).toLocaleDateString()
        });
      });
    }

    // Sort activity by most recent
    recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));

    const stats = {
      recommendedJobs: recommendedJobsCount || 0,
      savedJobs: savedJobsCount || 0,
      appliedJobs: appliedJobsCount || 0,
      profileViews: Math.floor(Math.random() * 50) + 10 // Placeholder for now
    };

    return NextResponse.json({
      stats,
      recentActivity: recentActivity.slice(0, 5)
    });

  } catch (error) {
    console.error('Jobseeker stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
