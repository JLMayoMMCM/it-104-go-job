import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, verification_code } = body;

    if (!email || !verification_code) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
    }

    // Find account with matching email
    const { data: account, error: accountError } = await supabase
      .from('account')
      .select('account_id, account_email, account_is_verified')
      .eq('account_email', email)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (account.account_is_verified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    // Check verification code
    const { data: verificationRecord, error: verificationError } = await supabase
      .from('verification_codes')
      .select('code, expires_at')
      .eq('account_id', account.account_id)
      .single();

    if (verificationError || !verificationRecord) {
      return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 404 });
    }

    // Check if code has expired
    if (new Date(verificationRecord.expires_at) < new Date()) {
      // Clean up expired code
      await supabase
        .from('verification_codes')
        .delete()
        .eq('account_id', account.account_id);
      
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }

    if (verificationRecord.code !== verification_code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Update account as verified
    const { error: updateError } = await supabase
      .from('account')
      .update({
        account_is_verified: true
      })
      .eq('account_id', account.account_id);

    if (updateError) {
      console.error('Account verification update error:', updateError);
      return NextResponse.json({ error: 'Failed to verify account' }, { status: 500 });
    }

    // Clean up verification code after successful verification
    const { error: deleteError } = await supabase
      .from('verification_codes')
      .delete()
      .eq('account_id', account.account_id);

    if (deleteError) {
      console.error('Failed to clean up verification code:', deleteError);
      // Don't fail the request if cleanup fails
    }

    return NextResponse.json({
      message: 'Email verified successfully! You can now sign in.'
    });

  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
