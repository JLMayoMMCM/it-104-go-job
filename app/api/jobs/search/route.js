import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

// Advanced job search with sophisticated filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const advanced = searchParams.get('advanced') === 'true';
    
    // Basic filters
    const keywords = searchParams.get('keywords') || '';
    const location = searchParams.get('location') || '';
    const jobType = searchParams.get('jobType') || '';
    const categoryField = searchParams.get('categoryField') || '';
    const jobCategory = searchParams.get('jobCategory') || '';
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    
    // Advanced filters
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const companySize = searchParams.get('companySize') || '';
    const workMode = searchParams.get('workMode') || '';
    const benefits = searchParams.get('benefits') ? searchParams.get('benefits').split(',') : [];
    const skills = searchParams.get('skills') ? searchParams.get('skills').split(',') : [];
    const postedWithin = searchParams.get('postedWithin') || '';
    const sortBy = searchParams.get('sortBy') || 'relevance';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build the base query with relevance scoring
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
        job_requirements,
        job_benefits,
        job_quantity,
        job_closing_date,        company (
          company_id,
          company_name,
          company_description,
          company_website
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
      .eq('job_is_active', true);    // Apply basic filters
    if (keywords) {
      // Enhanced keyword search with relevance scoring
      const keywordTerms = keywords.toLowerCase().split(' ').filter(term => term.length > 0);
      
      // Build search conditions for each term
      keywordTerms.forEach(term => {
        query = query.or(`job_name.ilike.%${term}%,job_description.ilike.%${term}%,job_requirements.ilike.%${term}%`);
      });
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

    // Advanced filters
    if (experienceLevel) {
      const experienceMappings = {
        'entry': ['entry', 'junior', 'graduate', 'intern'],
        'mid': ['mid', 'intermediate', 'experienced'],
        'senior': ['senior', 'lead', 'principal'],
        'executive': ['executive', 'director', 'manager', 'head']
      };
      
      const levelTerms = experienceMappings[experienceLevel] || [experienceLevel];
      const levelConditions = levelTerms.map(term => 
        `job_name.ilike.%${term}%,job_description.ilike.%${term}%,job_requirements.ilike.%${term}%`
      ).join(',');
      query = query.or(levelConditions);
    }

    if (companySize) {
      const sizeMapping = {
        'startup': 'small',
        'small': 'small',
        'medium': 'medium',
        'large': 'large'
      };
      // Company size filtering disabled - column doesn't exist
      // query = query.eq('company.company_size', sizeMapping[companySize]);
    }

    if (workMode) {
      const modeTerms = {
        'remote': ['remote', 'work from home', 'telecommute'],
        'hybrid': ['hybrid', 'flexible', 'part remote'],
        'onsite': ['onsite', 'office', 'on-site']
      };
      
      const terms = modeTerms[workMode] || [workMode];
      const modeConditions = terms.map(term => 
        `job_description.ilike.%${term}%,job_benefits.ilike.%${term}%`
      ).join(',');
      query = query.or(modeConditions);
    }

    if (benefits.length > 0) {
      const benefitConditions = benefits.map(benefit => 
        `job_benefits.ilike.%${benefit}%`
      ).join(',');
      query = query.or(benefitConditions);
    }

    if (skills.length > 0) {
      const skillConditions = skills.map(skill => 
        `job_requirements.ilike.%${skill}%,job_description.ilike.%${skill}%`
      ).join(',');
      query = query.or(skillConditions);
    }

    if (postedWithin) {
      const daysAgo = parseInt(postedWithin);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      query = query.gte('job_posted_date', cutoffDate.toISOString());
    }

    // Apply category filters
    if (categoryField || jobCategory) {
      if (categoryField) {
        query = query.eq('job_category_list.job_category.category_field.category_field_name', categoryField);
      }
      if (jobCategory) {
        query = query.eq('job_category_list.job_category.job_category_name', jobCategory);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('job_posted_date', { ascending: false });
        break;
      case 'oldest':
        query = query.order('job_posted_date', { ascending: true });
        break;
      case 'salary_high':
        query = query.order('job_salary', { ascending: false, nullsLast: true });
        break;
      case 'salary_low':
        query = query.order('job_salary', { ascending: true, nullsLast: true });
        break;
      case 'company_rating':
        query = query.order('job_rating', { ascending: false, nullsLast: true });
        break;
      case 'relevance':
      default:
        // For relevance, we'll sort by a combination of factors
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

    // Calculate relevance scores for jobs if doing keyword search
    let scoredJobs = jobs || [];
    if (keywords && advanced) {
      scoredJobs = calculateRelevanceScores(scoredJobs, keywords);
      
      // Re-sort by relevance if relevance sorting is selected
      if (sortBy === 'relevance') {
        scoredJobs.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
      }
    }

    // Transform the data
    const transformedJobs = scoredJobs.map(job => {
      const categories = job.job_category_list?.map(jcl => jcl.job_category.job_category_name) || [];
      const fields = job.job_category_list?.map(jcl => jcl.job_category.category_field.category_field_name) || [];
        return {
        ...job,
        company_name: job.company?.company_name,
        job_type_name: job.job_type?.job_type_name,
        job_categories: categories.join(', '),
        category_fields: [...new Set(fields)].join(', '),
        company_website: job.company?.company_website
      };
    });

    // Get total count for pagination (simplified for performance)
    let countQuery = supabase
      .from('job')
      .select('job_id', { count: 'exact' })
      .eq('job_is_active', true);

    // Apply same basic filters for count
    if (keywords) {
      const keywordTerms = keywords.toLowerCase().split(' ').filter(term => term.length > 0);
      const searchConditions = keywordTerms.map(term => 
        `job_name.ilike.%${term}%,job_description.ilike.%${term}%,company.company_name.ilike.%${term}%`
      ).join(',');
      countQuery = countQuery.or(searchConditions);
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

    const { count } = await countQuery;

    const totalJobs = count || 0;
    const totalPages = Math.ceil(totalJobs / limit);

    return NextResponse.json({
      jobs: transformedJobs,
      totalJobs,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages,
      searchMetadata: {
        advanced,
        filters: {
          keywords,
          location,
          jobType,
          categoryField,
          jobCategory,
          salaryMin,
          salaryMax,
          experienceLevel,
          companySize,
          workMode,
          benefits,
          skills,
          postedWithin,
          sortBy
        }
      }
    });

  } catch (error) {
    console.error('Advanced search API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Calculate relevance scores for search results
function calculateRelevanceScores(jobs, keywords) {
  const keywordTerms = keywords.toLowerCase().split(' ').filter(term => term.length > 0);
  
  return jobs.map(job => {
    let score = 0;
    
    // Score based on title matches (highest weight)
    const titleText = (job.job_name || '').toLowerCase();
    keywordTerms.forEach(term => {
      if (titleText.includes(term)) {
        score += 10;
        if (titleText.startsWith(term)) score += 5; // Bonus for starting with term
      }
    });
    
    // Score based on description matches (medium weight)
    const descText = (job.job_description || '').toLowerCase();
    keywordTerms.forEach(term => {
      const matches = (descText.match(new RegExp(term, 'g')) || []).length;
      score += matches * 2;
    });
    
    // Score based on company name matches (medium weight)
    const companyText = (job.company?.company_name || '').toLowerCase();
    keywordTerms.forEach(term => {
      if (companyText.includes(term)) {
        score += 5;
      }
    });
    
    // Score based on requirements matches (low weight)
    const reqText = (job.job_requirements || '').toLowerCase();
    keywordTerms.forEach(term => {
      const matches = (reqText.match(new RegExp(term, 'g')) || []).length;
      score += matches * 1;
    });
    
    // Bonus for recent posts
    const daysOld = Math.floor((new Date() - new Date(job.job_posted_date)) / (1000 * 60 * 60 * 24));
    if (daysOld <= 7) score += 3;
    else if (daysOld <= 30) score += 1;
    
    // Bonus for higher salaries
    if (job.job_salary) {
      if (job.job_salary >= 100000) score += 2;
      else if (job.job_salary >= 50000) score += 1;
    }
    
    return {
      ...job,
      relevance_score: score
    };
  });
}
