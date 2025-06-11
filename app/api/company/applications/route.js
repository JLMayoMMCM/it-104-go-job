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
    const jobId = searchParams.get('jobId');
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
        jobs!inner (
          id,
          title,
          company_id,
          location,
          job_type
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
    if (status) {
      query = query.eq('status', status);
    }

    if (jobId) {
      query = query.eq('job_id', jobId);
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
      console.error('Error fetching company applications:', error);
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
    console.error('Company applications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
