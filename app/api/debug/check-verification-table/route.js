import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if verification_codes table exists
    const { data: verificationCodes, error: verificationError } = await supabase
      .from('verification_codes')
      .select('*')
      .limit(5);

    console.log('Verification codes check:', { verificationCodes, verificationError });

    // Check verification_codes table structure
    let verificationTableExists = true;
    if (verificationError?.code === '42P01') { // Table doesn't exist
      verificationTableExists = false;
    }

    return NextResponse.json({
      success: true,
      verificationTableExists,
      verificationCodes: verificationCodes || [],
      verificationError: verificationError?.message || null
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
