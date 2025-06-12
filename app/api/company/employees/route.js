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

    // First get the employee to find the company using correct table names
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

    // Get all employees in the same company using correct table structure
    const { data: employees, error } = await supabase
      .from('employee')
      .select(`
        employee_id,
        position_name,
        person:person_id (
          person_id,
          first_name,
          last_name
        ),
        account:account_id (
          account_id,
          account_email,
          account_phone,
          account_username
        )
      `)
      .eq('company_id', employee.company_id)
      .order('person_id', { ascending: true });

    if (error) {
      console.error('Error fetching company employees:', error);
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }

    // Transform the data to match expected format
    const transformedEmployees = employees.map(emp => ({
      id: emp.employee_id,
      first_name: emp.person?.first_name,
      last_name: emp.person?.last_name,
      email: emp.account?.account_email,
      phone: emp.account?.account_phone,
      job_title: emp.position_name,
      username: emp.account?.account_username
    }));

    return NextResponse.json({
      employees: transformedEmployees || []
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
