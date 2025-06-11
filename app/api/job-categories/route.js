import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: jobCategories, error } = await supabase
      .from('job_category')
      .select(`
        job_category_id,
        job_category_name,
        category_field_id,
        category_field (
          category_field_name
        )
      `)
      .order('job_category_name');

    if (error) {
      console.error('Error fetching job categories:', error);
      return NextResponse.json({
        error: 'Failed to fetch job categories'
      }, { status: 500 });
    }

    // Flatten the category_field structure
    const flattenedCategories = jobCategories?.map(category => ({
      job_category_id: category.job_category_id,
      job_category_name: category.job_category_name,
      category_field_id: category.category_field_id,
      category_field_name: category.category_field?.category_field_name
    })) || [];

    return NextResponse.json(flattenedCategories);
  } catch (error) {
    console.error('Job categories API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
