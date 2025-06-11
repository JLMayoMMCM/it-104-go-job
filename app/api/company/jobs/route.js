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
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // First get the employee to find the company
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, company_id')
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Build the query for jobs
    let query = supabase
      .from('jobs')
      .select(`
        id,
        title,
        description,
        location,
        job_type,
        salary_min,
        salary_max,
        status,
        posted_date,
        application_deadline,
        requirements,
        benefits,
        job_categories (
          id,
          name
        ),
        job_applications (
          id,
          status
        )
      `)
      .eq('company_id', employee.company_id)
      .order('posted_date', { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', employee.company_id);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching company jobs:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    // Add application counts to each job
    const jobsWithCounts = jobs?.map(job => ({
      ...job,
      applications_count: job.job_applications?.length || 0,
      pending_applications: job.job_applications?.filter(app => app.status === 'pending').length || 0,
      reviewing_applications: job.job_applications?.filter(app => app.status === 'reviewing').length || 0,
      accepted_applications: job.job_applications?.filter(app => app.status === 'accepted').length || 0,
      rejected_applications: job.job_applications?.filter(app => app.status === 'rejected').length || 0
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      jobs: jobsWithCounts || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error('Company jobs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Extract JWT token from cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const body = await request.json();
    const {
      title,
      description,
      location,
      job_type,
      category_id,
      salary_min,
      salary_max,
      requirements,
      benefits,
      application_deadline,
      status = 'active'
    } = body;

    // First get the employee to find the company
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, company_id')
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Create the job
    const { data: newJob, error: createError } = await supabase
      .from('jobs')
      .insert([{
        title,
        description,
        location,
        job_type,
        category_id,
        salary_min,
        salary_max,
        requirements,
        benefits,
        application_deadline,
        status,
        company_id: employee.company_id,
        posted_by: employee.id,
        posted_date: new Date().toISOString().split('T')[0]
      }])
      .select(`
        id,
        title,
        description,
        location,
        job_type,
        salary_min,
        salary_max,
        status,
        posted_date,
        application_deadline,
        requirements,
        benefits,
        job_categories (
          id,
          name
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating job:', createError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Job created successfully',
      job: newJob
    });

  } catch (error) {
    console.error('Company jobs create API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
