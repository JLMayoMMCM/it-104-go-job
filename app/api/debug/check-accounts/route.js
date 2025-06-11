import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all accounts with their account types
    const { data: accounts, error: accountsError } = await supabase
      .from('account')
      .select(`
        account_id,
        account_username,
        account_email,
        account_is_verified,
        account_type_id,
        account_type!inner(
          account_type_name
        )
      `)
      .limit(10);

    if (accountsError) {
      throw accountsError;
    }

    // Get account type information
    const { data: accountTypes, error: typesError } = await supabase
      .from('account_type')
      .select('*');

    if (typesError) {
      throw typesError;
    }

    return NextResponse.json({
      success: true,
      accounts: accounts || [],
      accountTypes: accountTypes || [],
      totalAccounts: accounts?.length || 0
    });

  } catch (error) {
    console.error('Check accounts error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
