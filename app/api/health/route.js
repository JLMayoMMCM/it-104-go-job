import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET(request) {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Database connection failed',
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'All systems operational',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });

  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: 'System error',
      error: error.message 
    }, { status: 500 });
  }
}
