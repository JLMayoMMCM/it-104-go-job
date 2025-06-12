import { supabase } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function PUT(request) {
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

    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      nationalityId
    } = await request.json();

    // Get employee's person ID using correct schema
    const { data: employee, error: employeeError } = await supabase
      .from('employee')
      .select('person_id')
      .eq('account_id', decoded.account_id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({
        error: 'Employee profile not found'
      }, { status: 404 });
    }

    // Update person table
    const { error: personUpdateError } = await supabase
      .from('person')
      .update({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        nationality_id: nationalityId
      })
      .eq('person_id', employee.person_id);

    if (personUpdateError) {
      console.error('Person update error:', personUpdateError);
      return NextResponse.json({
        error: 'Failed to update personal information'
      }, { status: 500 });
    }

    // Update account phone if provided
    if (phone) {
      const { error: accountUpdateError } = await supabase
        .from('account')
        .update({
          account_phone: phone
        })
        .eq('account_id', decoded.account_id);

      if (accountUpdateError) {
        console.error('Account phone update error:', accountUpdateError);
        // Don't fail the request if phone update fails
      }
    }    return NextResponse.json({
      message: 'Personal information updated successfully'
    });

  } catch (error) {
    console.error('Personal info update error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
