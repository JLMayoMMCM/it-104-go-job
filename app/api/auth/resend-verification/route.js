import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user with matching email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_verified')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.is_verified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user with new verification code
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_code: verificationCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('User verification code update error:', updateError);
      return NextResponse.json({ error: 'Failed to generate new verification code' }, { status: 500 });
    }

    // Update Supabase Auth user metadata
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          verification_code: verificationCode
        }
      }
    );

    if (authUpdateError) {
      console.error('Auth user metadata update error:', authUpdateError);
      // Don't fail the request if this fails
    }

    // Send verification email (placeholder for now)
    console.log(`New verification code for ${email}: ${verificationCode}`);

    // TODO: Implement actual email sending service
    // Example with a service like SendGrid, AWS SES, or Nodemailer
    // await sendVerificationEmail(email, verificationCode);

    return NextResponse.json({
      message: 'Verification code sent successfully! Please check your email.'
    });

  } catch (error) {
    console.error('Resend verification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
