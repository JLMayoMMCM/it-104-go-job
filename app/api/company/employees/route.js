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
      .select('id, company_id')
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get all employees in the same company
    const { data: employees, error } = await supabase
      .from('employees')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        job_title,
        department,
        hire_date,
        salary,
        user_id,
        users (
          id,
          email,
          created_at
        )
      `)
      .eq('company_id', employee.company_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching company employees:', error);
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }

    return NextResponse.json({
      employees: employees || []
    });

  } catch (error) {
    console.error('Company employees API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
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
      first_name,
      last_name,
      email,
      phone,
      job_title,
      department,
      salary
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

    // Create a new user account for the employee
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: 'TempPassword123!', // Temporary password - should be changed on first login
      email_confirm: true,
      user_metadata: {
        user_type: 'employee'
      }
    });

    if (userError) {
      console.error('Error creating user account:', userError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // Insert user record
    const { data: insertedUser, error: insertUserError } = await supabase
      .from('users')
      .insert([{
        id: newUser.user.id,
        email,
        user_type: 'employee'
      }])
      .select()
      .single();

    if (insertUserError) {
      console.error('Error inserting user record:', insertUserError);
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
    }

    // Create the employee record
    const { data: newEmployee, error: createError } = await supabase
      .from('employees')
      .insert([{
        user_id: newUser.user.id,
        company_id: employee.company_id,
        first_name,
        last_name,
        email,
        phone,
        job_title,
        department,
        salary,
        hire_date: new Date().toISOString().split('T')[0]
      }])
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        job_title,
        department,
        hire_date,
        salary,
        user_id,
        users (
          id,
          email,
          created_at
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating employee:', createError);
      return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Employee created successfully',
      employee: newEmployee
    });

  } catch (error) {
    console.error('Company employees create API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
