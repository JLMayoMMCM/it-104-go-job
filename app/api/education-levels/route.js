import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: educationLevels, error } = await supabase
      .from('job_seeker_education_level')
      .select('job_seeker_education_level_id, education_level_name')
      .order('education_level_name');

    if (error) {
      console.error('Error fetching education levels:', error);
      return NextResponse.json({
        error: 'Failed to fetch education levels'
      }, { status: 500 });
    }

    return NextResponse.json(educationLevels || []);
  } catch (error) {
    console.error('Education levels API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
