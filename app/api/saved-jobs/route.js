import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Save a job
export async function POST(request) {
  try {
    const { jobId } = await request.json();
    
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
      .select('job_id')
      .eq('job_id', jobId)
      .eq('job_is_active', true)
      .single();

    if (jobError || !job) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 });
    }

    // Save the job
    const { data: savedJob, error } = await supabase
      .from('saved_jobs')
      .insert({
        job_id: jobId,
        job_seeker_id: userData.job_seeker.job_seeker_id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          error: 'Job is already saved'
        }, { status: 409 });
      }
      
      console.error('Error saving job:', error);
      return NextResponse.json({
        error: 'Failed to save job'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Job saved successfully',
      savedJob
    });

  } catch (error) {
    console.error('Save job error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Get saved jobs for current user
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

    // Get saved jobs
    const { data: savedJobs, error } = await supabase
      .from('saved_jobs')
      .select(`
        saved_job_id,
        saved_date,
        job (
          job_id,
          job_name,
          job_description,
          job_location,
          job_salary,
          job_time,
          job_rating,
          job_posted_date,
          company (
            company_id,
            company_name
          ),
          job_type (
            job_type_id,
            job_type_name
          ),
          job_category_list (
            job_category (
              job_category_id,
              job_category_name,
              category_field (
                category_field_id,
                category_field_name
              )
            )
          )
        )
      `)
      .eq('job_seeker_id', userData.job_seeker.job_seeker_id)
      .order('saved_date', { ascending: false });

    if (error) {
      console.error('Error fetching saved jobs:', error);
      return NextResponse.json({
        error: 'Failed to fetch saved jobs'
      }, { status: 500 });
    }

    // Transform the data
    const transformedJobs = savedJobs.map(savedJob => {
      const job = savedJob.job;
      const categories = job.job_category_list?.map(jcl => jcl.job_category.job_category_name) || [];
      const fields = job.job_category_list?.map(jcl => jcl.job_category.category_field.category_field_name) || [];
      
      return {
        saved_job_id: savedJob.saved_job_id,
        saved_date: savedJob.saved_date,
        ...job,
        company_name: job.company?.company_name,
        job_type_name: job.job_type?.job_type_name,
        job_categories: categories.join(', '),
        category_fields: [...new Set(fields)].join(', ')
      };
    });

    return NextResponse.json({
      savedJobs: transformedJobs
    });

  } catch (error) {
    console.error('Get saved jobs error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
