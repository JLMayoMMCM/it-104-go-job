import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const jobType = searchParams.get('jobType') || '';
    const category = searchParams.get('category') || '';
    const field = searchParams.get('field') || '';
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build the query
    let query = supabase
      .from('job')
      .select(`
        job_id,
        job_name,
        job_description,
        job_location,
        job_salary,
        job_time,
        job_rating,
        job_posted_date,
        job_is_active,
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
      `)
      .eq('job_is_active', true);

    // Apply filters
    if (search) {
      query = query.or(`job_name.ilike.%${search}%,job_description.ilike.%${search}%,company.company_name.ilike.%${search}%`);
    }

    if (location) {
      query = query.ilike('job_location', `%${location}%`);
    }

    if (jobType) {
      query = query.eq('job_type.job_type_name', jobType);
    }

    if (salaryMin) {
      query = query.gte('job_salary', parseFloat(salaryMin));
    }

    if (salaryMax) {
      query = query.lte('job_salary', parseFloat(salaryMax));
    }

    // Apply sorting
    switch (sortBy) {
      case 'salary_high':
        query = query.order('job_salary', { ascending: false });
        break;
      case 'salary_low':
        query = query.order('job_salary', { ascending: true });
        break;
      case 'rating':
        query = query.order('job_rating', { ascending: false });
        break;
      case 'oldest':
        query = query.order('job_posted_date', { ascending: true });
        break;
      default: // newest
        query = query.order('job_posted_date', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(from, to);

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json({
        error: 'Failed to fetch jobs'
      }, { status: 500 });
    }

    // Transform the data to include category and field information
    const transformedJobs = jobs.map(job => {
      const categories = job.job_category_list?.map(jcl => jcl.job_category.job_category_name) || [];
      const fields = job.job_category_list?.map(jcl => jcl.job_category.category_field.category_field_name) || [];
      
      return {
        ...job,
        company_name: job.company?.company_name,
        job_type_name: job.job_type?.job_type_name,
        job_categories: categories.join(', '),
        category_fields: [...new Set(fields)].join(', ') // Remove duplicates
      };
    });

    // Get total count for pagination
    let countQuery = supabase
      .from('job')
      .select('job_id', { count: 'exact' })
      .eq('job_is_active', true);

    // Apply same filters for count
    if (search) {
      countQuery = countQuery.or(`job_name.ilike.%${search}%,job_description.ilike.%${search}%`);
    }
    if (location) {
      countQuery = countQuery.ilike('job_location', `%${location}%`);
    }
    if (salaryMin) {
      countQuery = countQuery.gte('job_salary', parseFloat(salaryMin));
    }
    if (salaryMax) {
      countQuery = countQuery.lte('job_salary', parseFloat(salaryMax));
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting job count:', countError);
    }

    return NextResponse.json({
      jobs: transformedJobs,
      totalJobs: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > page * limit
    });

  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
