import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET() {
  try {
    // First ensure we have nationality data
    const { data: existingNationalities, error: checkError } = await supabase
      .from('nationality')
      .select('nationality_id, nationality_name')
      .limit(1);

    if (checkError) {
      console.error('Error checking nationalities:', checkError);
      return NextResponse.json({ error: 'Failed to access nationality data' }, { status: 500 });
    }

    // If no nationalities exist, insert the default ones
    if (!existingNationalities || existingNationalities.length === 0) {
      const defaultNationalities = [
        'Filipino', 'American', 'British', 'Chinese', 'Japanese', 'Korean',
        'Indian', 'Canadian', 'Australian', 'German', 'French', 'Italian',
        'Spanish', 'Brazilian', 'Mexican', 'Russian', 'South African', 'Thai',
        'Vietnamese', 'Malaysian', 'Indonesian', 'Singaporean'
      ];

      const { error: insertError } = await supabase
        .from('nationality')
        .insert(defaultNationalities.map(name => ({ nationality_name: name })));

      if (insertError) {
        console.error('Error inserting default nationalities:', insertError);
        // Continue anyway, might be due to existing data
      }
    }

    // Fetch all nationalities
    const { data: nationalities, error } = await supabase
      .from('nationality')
      .select('nationality_id, nationality_name')
      .order('nationality_name', { ascending: true });

    if (error) {
      console.error('Error fetching nationalities:', error);
      return NextResponse.json({ error: 'Failed to fetch nationalities' }, { status: 500 });
    }

    console.log('Fetched nationalities:', nationalities?.length || 0, 'records');
    return NextResponse.json(nationalities || []);
  } catch (error) {
    console.error('Nationalities API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
