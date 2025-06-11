import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  try {
    // Extract JWT token from cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // First get the employee to find the company
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select(`
        id,
        company_id,
        companies (
          id,
          name,
          industry,
          description,
          website,
          company_size,
          address,
          phone,
          email,
          logo_url,
          created_at
        )
      `)
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee or company not found' }, { status: 404 });
    }

    return NextResponse.json({
      company: employee.companies
    });

  } catch (error) {
    console.error('Company profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // Extract JWT token from cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const body = await request.json();
    const {
      name,
      industry,
      description,
      website,
      company_size,
      address,
      phone,
      email,
      logo_url
    } = body;

    // First get the employee to find the company
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, company_id')
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Update the company information
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        name,
        industry,
        description,
        website,
        company_size,
        address,
        phone,
        email,
        logo_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', employee.company_id)
      .select()
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
