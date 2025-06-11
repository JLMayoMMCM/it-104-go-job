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
    let userId;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid token'
      }, { status: 401 });
    }

    // Get detailed employee profile
    const { data: profileData, error: profileError } = await supabase
      .from('account')
      .select(`
        account_id,
        person (
          person_id,
          first_name,
          last_name,
          email,
          date_of_birth,
          phone,
          nationality (
            nationality_name
          ),
          address (
            address_line,
            city,
            province,
            postal_code
          )
        ),
        employee (
          employee_id,
          employee_position,
          employee_department,
          employee_hire_date,
          company (
            company_id,
            company_name,
            company_description,
            company_website,
            company_email,
            company_phone,
            address (
              address_line,
              city,
              province,
              postal_code
            )
          )
        )
      `)
      .eq('account_id', userId)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({
        error: 'Profile not found'
      }, { status: 404 });
    }

    // Transform the data
    const profile = {
      firstName: profileData.person.first_name,
      lastName: profileData.person.last_name,
      email: profileData.person.email,
      phone: profileData.person.phone,
      dateOfBirth: profileData.person.date_of_birth,
      nationality: profileData.person.nationality?.nationality_name,
      location: profileData.person.address ? 
        `${profileData.person.address.city}, ${profileData.person.address.province}` : 
        null,
      address: profileData.person.address,
      position: profileData.employee?.employee_position,
      department: profileData.employee?.employee_department,
      hireDate: profileData.employee?.employee_hire_date,
      employeeId: profileData.employee?.employee_id
    };

    const company = profileData.employee?.company ? {
      company_id: profileData.employee.company.company_id,
      company_name: profileData.employee.company.company_name,
      company_description: profileData.employee.company.company_description,
      company_website: profileData.employee.company.company_website,
      company_email: profileData.employee.company.company_email,
      company_phone: profileData.employee.company.company_phone,
      address: profileData.employee.company.address
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
