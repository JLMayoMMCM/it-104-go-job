import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authorization token required'
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid token'
      }, { status: 401 });
    }

    // Get detailed employee profile using the correct schema
    const { data: employee, error: profileError } = await supabase
      .from('employee')
      .select(`
        employee_id,
        position_name,
        person!inner(
          person_id,
          first_name,
          last_name,
          middle_name,
          date_of_birth,
          gender,
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
        company(
          company_id,
          company_name,
          company_description,
          company_website,
          company_email,
          company_phone,
          address!inner(
            address_id,
            premise_name,
            street_name,
            barangay_name,
            city_name
          )
        ),
        account!inner(
          account_id,
          account_email,
          account_phone,
          account_username
        )
      `)
      .eq('account_id', decoded.account_id)
      .single();

    if (profileError || !employee) {
      console.error('Error fetching employee profile:', profileError);
      return NextResponse.json({
        error: 'Employee profile not found'
      }, { status: 404 });
    }

    // Transform the data to match expected format
    const profile = {
      employee_id: employee.employee_id,
      position_name: employee.position_name,
      first_name: employee.person.first_name,
      last_name: employee.person.last_name,
      middle_name: employee.person.middle_name,
      email: employee.account.account_email,      phone: employee.account.account_phone || employee.person.phone,
      username: employee.account.account_username,
      date_of_birth: employee.person.date_of_birth,
      gender: employee.person.gender,
      nationality: employee.person.nationality?.nationality_name,
      profile_picture: employee.account.account_profile_photo,
      address: {
        premise_name: employee.person.address.premise_name,
        street_name: employee.person.address.street_name,
        barangay_name: employee.person.address.barangay_name,
        city_name: employee.person.address.city_name
      },
      location: `${employee.person.address.city_name}${employee.person.address.barangay_name ? ', ' + employee.person.address.barangay_name : ''}`
    };

    const company = employee.company ? {
      company_id: employee.company.company_id,
      company_name: employee.company.company_name,
      company_description: employee.company.company_description,
      company_website: employee.company.company_website,
      company_email: employee.company.company_email,
      company_phone: employee.company.company_phone,
      address: employee.company.address ? {
        premise_name: employee.company.address.premise_name,
        street_name: employee.company.address.street_name,
        barangay_name: employee.company.address.barangay_name,
        city_name: employee.company.address.city_name
      } : null
    } : null;

    return NextResponse.json({
      profile,
      company
    });

  } catch (error) {
    console.error('Employee profile API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
