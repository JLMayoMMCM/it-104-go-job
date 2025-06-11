import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { username, password, userType } = await request.json();

    if (!username || !password || !userType) {
      return NextResponse.json({
        error: 'Username, password, and user type are required'
      }, { status: 400 });
    }    // Find user account
    const { data: account, error: accountError } = await supabase
      .from('account')
      .select(`
        account_id,
        account_username,
        account_email,
        account_password,
        account_is_verified,
        account_type_id
      `)
      .or(`account_username.eq.${username},account_email.eq.${username}`)
      .single();    if (accountError || !account) {
      return NextResponse.json({
        error: 'Invalid username or password'
      }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, account.account_password);
    if (!isValidPassword) {
      return NextResponse.json({
        error: 'Invalid username or password'
      }, { status: 401 });
    }

    // Check if account is verified
    if (!account.account_is_verified) {
      return NextResponse.json({
        requiresVerification: true,
        email: account.account_email
      }, { status: 200 });
    }    // Validate user type matches account type based on account_type_id
    // Account type 1 = Company (employees/company users)
    // Account type 2 = Job Seeker (individual job seekers)
    let expectedAccountTypeId;
    
    if (userType === 'employee') {
      expectedAccountTypeId = 1; // Company account type
    } else if (userType === 'job-seeker') {
      expectedAccountTypeId = 2; // Job Seeker account type
    } else {
      return NextResponse.json({
        error: 'Invalid user type selected'
      }, { status: 400 });
    }
    
    if (account.account_type_id !== expectedAccountTypeId) {
      const accountTypeName = account.account_type_id === 1 ? 'Employee' : 'Job Seeker';
      return NextResponse.json({
        error: `This account is registered as ${accountTypeName}. Please select the correct account type.`
      }, { status: 401 });
    }    // Get user profile based on account type
    let userProfile = null;
    let redirectUrl = '/app-dashboard'; // Default redirect
    
    if (userType === 'job-seeker') {
      const { data: jobSeeker } = await supabase
        .from('job_seeker')
        .select(`
          job_seeker_id,
          person!inner(
            person_id,
            first_name,
            last_name,
            middle_name
          )
        `)
        .eq('account_id', account.account_id)
        .single();
        userProfile = jobSeeker;
      redirectUrl = '/app-dashboard/jobseeker'; // Jobseeker dashboard
    } else if (userType === 'employee') {
      // For company accounts (account_type_id = 1), check for employee profile
      const { data: employee } = await supabase
        .from('employee')
        .select(`
          employee_id,
          position_name,
          person!inner(
            person_id,
            first_name,
            last_name,
            middle_name
          ),
          company(
            company_id,
            company_name
          )
        `)
        .eq('account_id', account.account_id)
        .single();
        userProfile = employee;
      redirectUrl = '/app-dashboard/employee'; // Employee dashboard
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        account_id: account.account_id,
        username: account.account_username,
        email: account.account_email,
        user_type: userType,
        account_type_id: account.account_type_id,
        profile: userProfile
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Login successful',
      token,
      redirectUrl, // Include redirect URL
      user: {
        account_id: account.account_id,
        username: account.account_username,
        email: account.account_email,
        user_type: userType,
        account_type_id: account.account_type_id,
        profile: userProfile
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
