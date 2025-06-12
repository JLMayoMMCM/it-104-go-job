import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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

    const { company_id } = await request.json();

    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }

    // Verify the company exists
    const { data: company, error: companyError } = await supabase
      .from('company')
      .select('company_id, company_name')
      .eq('company_id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Update employee record to associate with company
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employee')
      .update({ company_id: company_id })
      .eq('account_id', decoded.account_id)
      .select(`
        employee_id,
        account_id,
        company_id,
        position_name,
        company:company_id (
          company_id,
          company_name,
          company_email
        )
      `)
      .single();

    if (updateError) {
      console.error('Error associating employee with company:', updateError);
      return NextResponse.json({ error: 'Failed to associate employee with company' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Employee successfully associated with company',
      employee: updatedEmployee,
      company: company
    });

  } catch (error) {
    console.error('Employee company association API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Get employee's current company association
    const { data: employee, error: employeeError } = await supabase
      .from('employee')
      .select(`
        employee_id,
        account_id,
        company_id,
        position_name,
        company:company_id (
          company_id,
          company_name,
          company_email,
          company_description
        )
      `)
      .eq('account_id', decoded.account_id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      employee: employee,
      hasCompanyAssociation: !!employee.company_id,
      company: employee.company
    });

  } catch (error) {
    console.error('Employee company check API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
