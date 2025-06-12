import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: genders, error } = await supabase
      .from('gender')
      .select('gender_id, gender_name')
      .order('gender_name');

    if (error) {
      console.error('Error fetching genders:', error);
      return NextResponse.json({ error: 'Failed to fetch genders' }, { status: 500 });
    }

    return NextResponse.json(genders);
  } catch (error) {
    console.error('Error in gender API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
