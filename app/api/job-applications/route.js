import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Apply for a job
export async function POST(request) {
  try {
    const { jobId, coverLetter } = await request.json();
    
    if (!jobId) {
      return NextResponse.json({
        error: 'Job ID is required'
      }, { status: 400 });
    }

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

    // Get user's job seeker ID
    const { data: userData, error: userError } = await supabase
      .from('account')
      .select(`
        account_id,
        job_seeker (
          job_seeker_id
        )
      `)
      .eq('account_id', userId)
      .single();

    if (userError || !userData?.job_seeker) {
      return NextResponse.json({
        error: 'Job seeker profile not found'
      }, { status: 404 });
    }

    // Check if job exists and is active
    const { data: job, error: jobError } = await supabase
      .from('job')
      .select('job_id, job_closing_date')
      .eq('job_id', jobId)
      .eq('job_is_active', true)
      .single();

    if (jobError || !job) {
      return NextResponse.json({
        error: 'Job not found or no longer active'
      }, { status: 404 });
    }

    // Check if job is still accepting applications
    if (job.job_closing_date && new Date(job.job_closing_date) < new Date()) {
      return NextResponse.json({
        error: 'Application deadline has passed'
      }, { status: 400 });
    }

    // Submit the application
    const { data: application, error } = await supabase
      .from('job_requests')
      .insert({
        job_id: jobId,
        job_seeker_id: userData.job_seeker.job_seeker_id,
        cover_letter: coverLetter || null,
        request_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          error: 'You have already applied for this job'
        }, { status: 409 });
      }
      
      console.error('Error submitting application:', error);
      return NextResponse.json({
        error: 'Failed to submit application'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Application submitted successfully',
      application
    });

  } catch (error) {
    console.error('Submit application error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Get job applications for current user
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

    // Get user's job seeker ID
    const { data: userData, error: userError } = await supabase
      .from('account')
      .select(`
        account_id,
        job_seeker (
          job_seeker_id
        )
      `)
      .eq('account_id', userId)
      .single();

    if (userError || !userData?.job_seeker) {
      return NextResponse.json({
        error: 'Job seeker profile not found'
      }, { status: 404 });
    }

    // Get job applications
    const { data: applications, error } = await supabase
      .from('job_requests')
      .select(`
        request_id,
        request_date,
        request_status,
        cover_letter,
        employee_response,
        response_date,
        job (
          job_id,
          job_name,
          job_description,
          job_location,
          job_salary,
          job_time,
          job_posted_date,
          company (
            company_id,
            company_name
          ),
          job_type (
            job_type_id,
            job_type_name
          )
        )
      `)
      .eq('job_seeker_id', userData.job_seeker.job_seeker_id)
      .order('request_date', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({
        error: 'Failed to fetch applications'
      }, { status: 500 });
    }

    // Transform the data
    const transformedApplications = applications.map(app => ({
      ...app,
      job: {
        ...app.job,
        company_name: app.job.company?.company_name,
        job_type_name: app.job.job_type?.job_type_name
      }
    }));

    return NextResponse.json({
      applications: transformedApplications
    });

  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
