import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    // Test if verification_codes table exists
    const { data: verificationCodes, error: verificationError } = await supabase
      .from('verification_codes')
      .select('*')
      .limit(5);

    // Test if account table exists and has verification field
    const { data: accounts, error: accountError } = await supabase
      .from('account')
      .select('account_id, account_email, account_is_verified')
      .limit(5);

    return NextResponse.json({
      success: true,
      verification_codes: {
        exists: !verificationError,
        error: verificationError?.message,
        sample_data: verificationCodes
      },
      account: {
        exists: !accountError,
        error: accountError?.message,
        sample_data: accounts
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { test_email, test_code } = body;

    if (!test_email || !test_code) {
      return NextResponse.json({ error: 'test_email and test_code are required' }, { status: 400 });
    }

    // Create a test verification entry
    const testAccountId = 999999; // Test account ID
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error: insertError } = await supabase
      .from('verification_codes')
      .upsert([{
        account_id: testAccountId,
        code: test_code,
        expires_at: expiresAt.toISOString()
      }], {
        onConflict: 'account_id'
      });

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create test verification code',
        details: insertError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test verification code created successfully',
      test_data: {
        account_id: testAccountId,
        code: test_code,
        expires_at: expiresAt.toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
