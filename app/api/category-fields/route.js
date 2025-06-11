import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: categoryFields, error } = await supabase
      .from('category_field')
      .select('category_field_id, category_field_name')
      .order('category_field_name');

    if (error) {
      console.error('Error fetching category fields:', error);
      return NextResponse.json({
        error: 'Failed to fetch category fields'
      }, { status: 500 });
    }

    return NextResponse.json(categoryFields || []);
  } catch (error) {
    console.error('Category fields API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
