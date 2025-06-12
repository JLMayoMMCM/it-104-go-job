import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: experienceLevels, error } = await supabase
      .from('job_seeker_experience_level')
      .select('job_seeker_experience_level_id, experience_level_name')
      .order('experience_level_name');

    if (error) {
      console.error('Error fetching experience levels:', error);
      return NextResponse.json({
        error: 'Failed to fetch experience levels'
      }, { status: 500 });
    }

    return NextResponse.json(experienceLevels || []);
  } catch (error) {
    console.error('Experience levels API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
