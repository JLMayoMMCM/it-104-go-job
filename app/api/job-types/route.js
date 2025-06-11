import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: jobTypes, error } = await supabase
      .from('job_type')
      .select('job_type_id, job_type_name')
      .order('job_type_name');

    if (error) {
      console.error('Error fetching job types:', error);
      return NextResponse.json({
        error: 'Failed to fetch job types'
      }, { status: 500 });
    }

    return NextResponse.json(jobTypes || []);
  } catch (error) {
    console.error('Job types API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
