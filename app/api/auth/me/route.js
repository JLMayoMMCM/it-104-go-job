import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authorization token required'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (jwtError) {
      return NextResponse.json({
        error: 'Invalid token'
      }, { status: 401 });
    }    // Get user data based on user type
    const { data: account, error: accountError } = await supabase
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
      .eq('account_id', decoded.account_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    // Get user profile based on user type from JWT
    let userProfile = null;
    
    if (decoded.user_type === 'job-seeker') {
      const { data: jobSeeker } = await supabase
        .from('job_seeker')
        .select(`
          job_seeker_id,
          person!inner(
            person_id,
            first_name,
            last_name,
            middle_name,
            phone,
            address!inner(
              address_id,
              premise_name,
              street_name,
              barangay_name,
              city_name
            ),
            nationality!inner(
              nationality_id,
              nationality_name
            )
          )
        `)
        .eq('account_id', account.account_id)
        .single();
      
      userProfile = jobSeeker;
    } else if (decoded.user_type === 'employee') {
      const { data: employee } = await supabase
        .from('employee')
        .select(`
          employee_id,
          position_name,
          person!inner(
            person_id,
            first_name,
            last_name,
            middle_name,
            phone,
            address!inner(
              address_id,
              premise_name,
              street_name,
              barangay_name,
              city_name
            ),
            nationality!inner(
              nationality_id,
              nationality_name
            )
          ),
          company!inner(
            company_id,
            company_name,
            company_email,
            company_phone,
            company_website,
            company_description
          )
        `)
        .eq('account_id', account.account_id)
        .single();
      
      userProfile = employee;
    }

    // Prepare user data to match what the dashboard expects
    const userData = {
      user: {
        account_id: account.account_id,
        username: account.account_username,
        email: account.account_email,
        user_type: decoded.user_type,
        is_verified: account.account_is_verified,
        profile: userProfile
      }
    };

    return NextResponse.json(userData);

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
