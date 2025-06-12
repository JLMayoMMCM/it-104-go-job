import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  try {
    // Get JWT token from Authorization header
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

    // Get employee's company information using the correct table and field names
    const { data: employee, error: employeeError } = await supabase
      .from('employee')
      .select(`
        employee_id,
        company_id,
        position_name,
        company:company_id (
          company_id,
          company_name,
          company_description,
          company_website,
          company_email,
          company_phone,
          company_rating,
          company_logo,
          address:address_id (
            address_id,
            premise_name,
            street_name,
            barangay_name,
            city_name
          )
        )
      `)
      .eq('account_id', decoded.account_id)
      .single();

    if (employeeError || !employee) {
      console.error('Employee lookup error:', employeeError);
      return NextResponse.json({ error: 'Employee or company not found' }, { status: 404 });
    }

    if (!employee.company_id) {
      return NextResponse.json({ error: 'Employee is not associated with any company' }, { status: 404 });
    }

    return NextResponse.json({
      company: employee.company
    });

  } catch (error) {
    console.error('Company profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // Get JWT token from Authorization header
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

    const body = await request.json();
    const {
      company_name,
      company_description,
      company_website,
      company_email,
      company_phone
    } = body;

    // First get the employee to find the company
    const { data: employee, error: employeeError } = await supabase
      .from('employee')
      .select('employee_id, company_id')
      .eq('account_id', decoded.account_id)
      .single();

    if (employeeError || !employee) {
      console.error('Employee lookup error:', employeeError);
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (!employee.company_id) {
      return NextResponse.json({ error: 'Employee is not associated with any company' }, { status: 404 });
    }

    // Update the company information using correct table and field names
    const { data: updatedCompany, error: updateError } = await supabase
      .from('company')
      .update({
        company_name,
        company_description,
        company_website,
        company_email,
        company_phone
      })
      .eq('company_id', employee.company_id)
      .select(`
        company_id,
        company_name,
        company_description,
        company_website,
        company_email,
        company_phone,
        company_rating,
        company_logo,
        address:address_id (
          address_id,
          premise_name,
          street_name,
          barangay_name,
          city_name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating company:', updateError);
      return NextResponse.json({ error: 'Failed to update company profile' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Company profile updated successfully',
      company: updatedCompany
    });

  } catch (error) {
    console.error('Company profile update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
