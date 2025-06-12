import { supabase } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function PUT(request) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const accountId = decoded.account_id || decoded.userId;
    const accountData = await request.json();

    // Validate required fields
    if (!accountData.username && !accountData.email && !accountData.phone) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
    }

    // Check if account exists and is job seeker
    const { data: currentAccount, error: fetchError } = await supabase
      .from('account')
      .select('account_id, account_type_id')
      .eq('account_id', accountId)
      .single();

    if (fetchError || !currentAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (currentAccount.account_type_id !== 2) {
      return NextResponse.json({ error: 'Unauthorized - not a job seeker account' }, { status: 403 });
    }

    // Check for username uniqueness if provided
    if (accountData.username) {
      const { data: existingUsername } = await supabase
        .from('account')
        .select('account_id')
        .eq('account_username', accountData.username)
        .neq('account_id', accountId)
        .single();

      if (existingUsername) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }
    }

    // Check for email uniqueness if provided
    if (accountData.email) {
      const { data: existingEmail } = await supabase
        .from('account')
        .select('account_id')
        .eq('account_email', accountData.email)
        .neq('account_id', accountId)
        .single();

      if (existingEmail) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData = {};
    if (accountData.username) updateData.account_username = accountData.username;
    if (accountData.email) updateData.account_email = accountData.email;
    if (accountData.phone) updateData.account_phone = accountData.phone;

    // Update account
    const { error: updateError } = await supabase
      .from('account')
      .update(updateData)
      .eq('account_id', accountId);

    if (updateError) {
      console.error('Error updating account:', updateError);
      return NextResponse.json({ error: 'Failed to update account information' }, { status: 500 });
    }

    // If email was changed, mark account as unverified
    if (accountData.email) {
      await supabase
        .from('account')
        .update({ account_is_verified: false })
        .eq('account_id', accountId);
    }

    return NextResponse.json({ 
      message: 'Account information updated successfully',
      emailChanged: !!accountData.email
    });

  } catch (error) {
    console.error('Account update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
