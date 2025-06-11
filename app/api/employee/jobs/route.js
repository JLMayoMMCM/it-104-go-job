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

    // Get jobs posted by the employee's company
    const { data: jobs, error: jobsError } = await supabase
      .from('job')
      .select(`
        job_id,
        job_name,
        job_description,
        job_location,
        job_salary,
        job_time,
        job_quantity,
        job_posted_date,
        job_closing_date,
        job_is_active,
        job_type (
          job_type_id,
          job_type_name
        )
      `)
      .eq('company_id', employeeData.employee.company_id)
      .order('job_posted_date', { ascending: false });

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json({
        error: 'Failed to fetch jobs'
      }, { status: 500 });
    }

    // Get application counts for each job
    const jobIds = jobs.map(job => job.job_id);
    
    const { data: applicationCounts, error: countError } = await supabase
      .from('job_requests')
      .select('job_id')
      .in('job_id', jobIds);

    if (countError) {
      console.error('Error fetching application counts:', countError);
    }

    // Count applications per job
    const countsByJob = {};
    if (applicationCounts) {
      applicationCounts.forEach(app => {
        countsByJob[app.job_id] = (countsByJob[app.job_id] || 0) + 1;
      });
    }

    // Transform the data
    const transformedJobs = jobs.map(job => ({
      ...job,
      job_type_name: job.job_type?.job_type_name,
      application_count: countsByJob[job.job_id] || 0
    }));

    return NextResponse.json({
      jobs: transformedJobs
    });

  } catch (error) {
    console.error('Employee jobs API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
