import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const jobId = params.id;

    if (!jobId) {
      return NextResponse.json({
        error: 'Job ID is required'
      }, { status: 400 });
    }

    // Fetch detailed job information
    const { data: job, error } = await supabase
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
        job_rating,
        job_posted_date,
        job_hiring_date,
        job_closing_date,
        job_is_active,
        company (
          company_id,
          company_name,
          company_description,
          company_website,
          company_email,
          company_phone,
          address (
            address_line,
            city,
            province,
            postal_code
          )
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
      `)
      .eq('job_id', jobId)
      .eq('job_is_active', true)
      .single();

    if (error) {
      console.error('Error fetching job:', error);
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 });
    }

    if (!job) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 });
    }

    // Transform the data to include category and field information
    const categories = job.job_category_list?.map(jcl => jcl.job_category.job_category_name) || [];
    const fields = job.job_category_list?.map(jcl => jcl.job_category.category_field.category_field_name) || [];
    
    const transformedJob = {
      ...job,
      company_name: job.company?.company_name,
      company_description: job.company?.company_description,
      company_website: job.company?.company_website,
      company_email: job.company?.company_email,
      company_phone: job.company?.company_phone,
      company_address: job.company?.address ? {
        address_line: job.company.address.address_line,
        city: job.company.address.city,
        province: job.company.address.province,
        postal_code: job.company.address.postal_code
      } : null,
      job_type_name: job.job_type?.job_type_name,
      job_categories: categories,
      category_fields: [...new Set(fields)] // Remove duplicates
    };

    return NextResponse.json({ job: transformedJob });

  } catch (error) {
    console.error('Job details API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
