import { supabase } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Get a specific job for editing (employee must own the job)
export async function GET(request, { params }) {
  try {
    const { id: jobId } = await params;
    
    // Extract JWT token from cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

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

    // Get the job and verify it belongs to the employee's company
    const { data: job, error: jobError } = await supabase
      .from('job')
      .select(`
        job_id,
        job_name,
        job_description,
        job_location,
        job_salary,
        job_time,
        job_quantity,
        job_requirements,
        job_benefits,
        job_posted_date,
        job_closing_date,
        job_is_active,
        company_id,
        job_type (
          job_type_id,
          job_type_name
        ),
        job_category_list (
          job_category (
            job_category_id,
            job_category_name
          )
        )
      `)
      .eq('job_id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 });
    }

    // Verify the job belongs to the employee's company
    if (job.company_id !== employeeData.employee.company_id) {
      return NextResponse.json({
        error: 'You do not have permission to edit this job'
      }, { status: 403 });
    }

    // Transform the data
    const transformedJob = {
      ...job,
      job_type_name: job.job_type?.job_type_name,
      job_category_id: job.job_category_list?.[0]?.job_category?.job_category_id
    };

    return NextResponse.json({
      job: transformedJob
    });

  } catch (error) {
    console.error('Employee job details API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Update a specific job (employee must own the job)
export async function PUT(request, { params }) {
  try {
    const { id: jobId } = await params;
    
    // Extract JWT token from cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

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

    // Parse request body
    const updateData = await request.json();
    const {
      job_name,
      job_description,
      job_location,
      job_type,
      job_category_id,
      job_salary,
      job_requirements,
      job_benefits,
      job_closing_date,
      job_is_active,
      job_quantity
    } = updateData;

    // Verify the job belongs to the employee's company
    const { data: existingJob, error: existingJobError } = await supabase
      .from('job')
      .select('company_id')
      .eq('job_id', jobId)
      .single();

    if (existingJobError || !existingJob) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 });
    }

    if (existingJob.company_id !== employeeData.employee.company_id) {
      return NextResponse.json({
        error: 'You do not have permission to edit this job'
      }, { status: 403 });
    }

    // Update the job
    const { data: updatedJob, error: updateError } = await supabase
      .from('job')
      .update({
        job_name,
        job_description,
        job_location,
        job_salary: job_salary || null,
        job_requirements: job_requirements || null,
        job_benefits: job_benefits || null,
        job_closing_date: job_closing_date || null,
        job_is_active: job_is_active !== false,
        job_quantity: job_quantity || 1
      })
      .eq('job_id', jobId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating job:', updateError);
      return NextResponse.json({
        error: 'Failed to update job'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Job updated successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('Employee job update API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Delete a specific job (employee must own the job)
export async function DELETE(request, { params }) {
  try {
    const { id: jobId } = await params;
    
    // Extract JWT token from cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

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

    // Verify the job belongs to the employee's company
    const { data: existingJob, error: existingJobError } = await supabase
      .from('job')
      .select('company_id')
      .eq('job_id', jobId)
      .single();

    if (existingJobError || !existingJob) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 });
    }

    if (existingJob.company_id !== employeeData.employee.company_id) {
      return NextResponse.json({
        error: 'You do not have permission to delete this job'
      }, { status: 403 });
    }

    // Instead of deleting, deactivate the job to preserve application history
    const { error: deactivateError } = await supabase
      .from('job')
      .update({ job_is_active: false })
      .eq('job_id', jobId);

    if (deactivateError) {
      console.error('Error deactivating job:', deactivateError);
      return NextResponse.json({
        error: 'Failed to deactivate job'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Job deactivated successfully'
    });

  } catch (error) {
    console.error('Employee job delete API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
