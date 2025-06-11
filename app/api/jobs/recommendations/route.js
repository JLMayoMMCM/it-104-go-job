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

    // Get user's job seeker profile and preferences
    const { data: userData, error: userError } = await supabase
      .from('account')
      .select(`
        account_id,
        person (
          person_id
        ),
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

    // Get user's job preferences
    const { data: preferences, error: prefError } = await supabase
      .from('jobseeker_preference')
      .select('preferred_job_category_id')
      .eq('person_id', userData.person.person_id);

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
    }

    const preferredCategoryIds = preferences?.map(p => p.preferred_job_category_id) || [];

    let recommendedJobs = [];

    if (preferredCategoryIds.length > 0) {
      // Get jobs that match user's preferred categories (Perfect Matches)
      const { data: perfectMatches, error: perfectError } = await supabase
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
        .eq('job_is_active', true)
        .in('job_category_list.job_category_id', preferredCategoryIds)
        .order('job_posted_date', { ascending: false })
        .limit(8);

      if (!perfectError && perfectMatches) {
        recommendedJobs = perfectMatches.map(job => ({
          ...job,
          preference_score: 100 // Perfect match
        }));
      }

      // If we need more jobs, get jobs from same category fields (Similar Field matches)
      if (recommendedJobs.length < 12) {
        // Get category field IDs from user's preferences
        const { data: categoryFields, error: fieldError } = await supabase
          .from('job_category')
          .select('category_field_id')
          .in('job_category_id', preferredCategoryIds);

        if (!fieldError && categoryFields) {
          const fieldIds = [...new Set(categoryFields.map(cf => cf.category_field_id))];
          
          // Get categories from these fields (excluding already matched categories)
          const { data: relatedCategories, error: relatedError } = await supabase
            .from('job_category')
            .select('job_category_id')
            .in('category_field_id', fieldIds)
            .not('job_category_id', 'in', `(${preferredCategoryIds.join(',')})`);

          if (!relatedError && relatedCategories) {
            const relatedCategoryIds = relatedCategories.map(rc => rc.job_category_id);
            
            const { data: similarJobs, error: similarError } = await supabase
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
              .eq('job_is_active', true)
              .in('job_category_list.job_category_id', relatedCategoryIds)
              .order('job_posted_date', { ascending: false })
              .limit(12 - recommendedJobs.length);

            if (!similarError && similarJobs) {
              const similarJobsWithScore = similarJobs.map(job => ({
                ...job,
                preference_score: 50 // Similar field
              }));
              
              recommendedJobs = [...recommendedJobs, ...similarJobsWithScore];
            }
          }
        }
      }
    }

    // If we still don't have enough jobs or user has no preferences, add popular/recent jobs
    if (recommendedJobs.length < 12) {
      const { data: popularJobs, error: popularError } = await supabase
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
        .eq('job_is_active', true)
        .order('job_posted_date', { ascending: false })
        .limit(12 - recommendedJobs.length);

      if (!popularError && popularJobs) {
        // Filter out jobs already in recommendations
        const existingJobIds = recommendedJobs.map(job => job.job_id);
        const newJobs = popularJobs
          .filter(job => !existingJobIds.includes(job.job_id))
          .map(job => ({
            ...job,
            preference_score: 0 // No specific match
          }));
        
        recommendedJobs = [...recommendedJobs, ...newJobs];
      }
    }

    // Transform the data to include category and field information
    const transformedJobs = recommendedJobs.map(job => {
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

    return NextResponse.json({
      jobs: transformedJobs.slice(0, 12) // Limit to 12 recommendations
    });

  } catch (error) {
    console.error('Job recommendations API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
