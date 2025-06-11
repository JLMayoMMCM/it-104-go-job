import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Create a test account for login testing
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    const testUsername = 'testuser';
    
    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('account')
      .select('account_id')
      .eq('account_email', testEmail)
      .single();

    if (!existingAccount) {
      // Create test account
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      const accountNumber = 'ACC' + Date.now();
      
      const { data: newAccount, error: accountError } = await supabase
        .from('account')
        .insert([{
          account_email: testEmail,
          account_username: testUsername,
          account_password: hashedPassword,
          account_number: accountNumber,
          account_type_id: 2, // Job Seeker
          account_is_verified: true // Make it verified for testing
        }])
        .select('account_id')
        .single();

      if (accountError) {
        throw accountError;
      }

      return NextResponse.json({
        success: true,
        message: 'Test account created',
        testCredentials: {
          username: testUsername,
          email: testEmail,
          password: testPassword,
          accountId: newAccount.account_id
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Test account already exists',
        testCredentials: {
          username: testUsername,
          email: testEmail,
          password: testPassword,
          accountId: existingAccount.account_id
        }
      });
    }

  } catch (error) {
    console.error('Create test account error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
