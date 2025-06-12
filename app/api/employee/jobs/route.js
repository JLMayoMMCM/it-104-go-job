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
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid token'
      }, { status: 401 });
    }    // Get employee's company ID using direct employee table query
    const { data: employeeData, error: employeeError } = await supabase
      .from('employee')
      .select('employee_id, company_id')
      .eq('account_id', decoded.account_id)
      .single();

    if (employeeError || !employeeData) {
      console.error('Employee lookup error:', employeeError);
      return NextResponse.json({
        error: 'Employee profile not found'
      }, { status: 404 });
    }

    if (!employeeData.company_id) {
      return NextResponse.json({
        error: 'Employee is not associated with any company'
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
      .eq('company_id', employeeData.company_id)
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

export async function POST(request) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authorization token required'
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
      try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
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
      .eq('account_id', decoded.account_id)
      .single();

    if (employeeError || !employeeData?.employee) {
      console.error('Employee lookup error:', employeeError);
      console.error('Employee data:', employeeData);
      return NextResponse.json({
        error: 'Employee profile not found'
      }, { status: 404 });
    }    // Validate that employee has a company_id
    if (!employeeData.employee.company_id) {
      console.error('Employee missing company_id:', employeeData.employee);
      return NextResponse.json({
        error: 'Employee is not associated with a company'
      }, { status: 400 });
    }

    const companyId = parseInt(employeeData.employee.company_id);
    if (isNaN(companyId)) {
      console.error('Invalid company_id:', employeeData.employee.company_id);
      return NextResponse.json({
        error: 'Invalid company association'
      }, { status: 400 });
    }    console.log('Employee data found:', employeeData);
    console.log('Company ID:', companyId);

    // Parse the request body
    const {
      job_name,
      job_description,
      job_location,
      job_salary,
      job_time,
      job_quantity,
      job_type_id,
      job_category_ids = [], // Changed to handle multiple categories
      job_field_ids = [], // Added for category fields
      job_experience_level_id, // Added experience level ID
      job_education_level_id, // Added education level ID
      job_requirements,
      job_benefits,
      job_closing_date,
      job_is_active = true    } = await request.json();

    // Validate required fields
    if (!job_name || !job_description || !job_location || !job_quantity) {
      return NextResponse.json({
        error: 'Required fields: job_name, job_description, job_location, job_quantity'
      }, { status: 400 });
    }

    // Validate job_type_id is required (NOT NULL in database)
    if (!job_type_id) {
      return NextResponse.json({
        error: 'job_type_id is required'
      }, { status: 400 });
    }    console.log('About to create job with company_id:', employeeData.company_id);    console.log('Full job data:', {
      company_id: companyId,
      job_name,
      job_description,
      job_location,
      job_quantity: parseInt(job_quantity),
      job_type_id: parseInt(job_type_id),
      job_experience_level_id: job_experience_level_id ? parseInt(job_experience_level_id) : null,
      job_education_level_id: job_education_level_id ? parseInt(job_education_level_id) : null,
      job_salary: job_salary ? parseFloat(job_salary) : null,
      job_time: job_time || null,
      job_requirements: job_requirements || null,
      job_benefits: job_benefits || null,
      job_closing_date: job_closing_date || null,
      job_is_active
    });

    // Create the job
    const { data: newJob, error: createError } = await supabase
      .from('job')
      .insert([{
        company_id: companyId,
        job_name,
        job_description,
        job_location,
        job_quantity: parseInt(job_quantity),
        job_requirements: job_requirements || null,
        job_benefits: job_benefits || null,
        job_type_id: parseInt(job_type_id),
        job_experience_level_id: job_experience_level_id ? parseInt(job_experience_level_id) : null,
        job_education_level_id: job_education_level_id ? parseInt(job_education_level_id) : null,
        job_salary: job_salary ? parseFloat(job_salary) : null,
        job_time: job_time || null,
        job_rating: 0.00,
        job_posted_date: new Date().toISOString(),
        job_hiring_date: null,
        job_closing_date: job_closing_date || null,
        job_is_active      }])
      .select(`
        job_id,
        job_name,
        job_description,
        job_location,
        job_quantity,
        job_requirements,
        job_benefits,
        job_salary,
        job_time,
        job_rating,
        job_posted_date,
        job_hiring_date,
        job_closing_date,
        job_is_active,
        company_id,
        job_type!inner (
          job_type_id,
          job_type_name
        ),
        job_seeker_experience_level (
          job_seeker_experience_level_id,
          experience_level_name
        ),
        job_seeker_education_level (
          job_seeker_education_level_id,
          education_level_name
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating job:', createError);
      return NextResponse.json({
        error: 'Failed to create job'
      }, { status: 500 });
    }    // If categories were provided, create the job category relationships
    if (job_category_ids && job_category_ids.length > 0) {
      const categoryInserts = job_category_ids.map(categoryId => ({
        job_id: newJob.job_id,
        job_category_id: parseInt(categoryId)
      }));

      const { error: categoryError } = await supabase
        .from('job_category_list')
        .insert(categoryInserts);

      if (categoryError) {
        console.error('Error adding job categories:', categoryError);
        // Continue without failing the job creation
      }
    }

    return NextResponse.json({
      message: 'Job created successfully',
      job: {
        ...newJob,
        job_type_name: newJob.job_type?.job_type_name,
        experience_level_name: newJob.job_seeker_experience_level?.experience_level_name,
        education_level_name: newJob.job_seeker_education_level?.education_level_name,
        application_count: 0
      }
    });

  } catch (error) {
    console.error('Employee job creation API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
