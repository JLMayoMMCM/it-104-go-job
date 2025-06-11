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
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    // First verify user is an employee
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select(`
        id,
        company_id,
        companies (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Build the query for applications
    let query = supabase
      .from('job_applications')
      .select(`
        id,
        job_id,
        status,
        applied_at,
        cover_letter,
        notes,
        jobs (
          id,
          title,
          company_id
        ),
        jobseekers (
          id,
          first_name,
          last_name,
          email,
          phone,
          resume_url,
          profile_summary,
          experience_level,
          preferred_location,
          preferred_salary_min,
          preferred_salary_max,
          skills,
          education_level
        )
      `)
      .eq('jobs.company_id', employee.company_id)
      .order('applied_at', { ascending: false });

    // Apply filters
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('jobs.company_id', employee.company_id);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      applications: applications || [],
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
    console.error('Employee applications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
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
    const { applicationId, status, notes } = body;

    if (!applicationId || !status) {
      return NextResponse.json({ error: 'Application ID and status are required' }, { status: 400 });
    }

    // Verify user is an employee and owns the job
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, company_id')
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Verify the application belongs to the company
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(`
        id,
        job_id,
        jobs (
          company_id
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.jobs.company_id !== employee.company_id) {
      return NextResponse.json({ error: 'Unauthorized to update this application' }, { status: 403 });
    }

    // Update the application status
    const { data: updatedApplication, error: updateError } = await supabase
      .from('job_applications')
      .update({
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Application updated successfully',
      application: updatedApplication
    });

  } catch (error) {
    console.error('Employee applications update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
