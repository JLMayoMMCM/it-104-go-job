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
    }    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid token'
      }, { status: 401 });
    }

    const {
      premiseName,
      streetName,
      barangayName,
      cityName
    } = await request.json();    // Get employee's person ID and address ID
    const { data: employee, error: employeeError } = await supabase
      .from('employee')
      .select(`
        person_id,
        person!inner(
          address_id
        )
      `)
      .eq('account_id', decoded.account_id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({
        error: 'Employee profile not found'
      }, { status: 404 });
    }

    const addressId = employee.person?.address_id;

    // Prepare address updates
    const addressUpdates = {};
    if (premiseName !== undefined) addressUpdates.premise_name = premiseName;
    if (streetName !== undefined) addressUpdates.street_name = streetName;
    if (barangayName !== undefined) addressUpdates.barangay_name = barangayName;
    if (cityName !== undefined) addressUpdates.city_name = cityName;

    if (addressId && Object.keys(addressUpdates).length > 0) {
      // Update existing address
      const { error: addressError } = await supabase
        .from('address')
        .update(addressUpdates)
        .eq('address_id', addressId);

      if (addressError) {
        console.error('Error updating address:', addressError);
        return NextResponse.json({ error: 'Failed to update address information' }, { status: 500 });
      }
    } else if (!addressId && Object.keys(addressUpdates).length > 0) {
      // Create new address if none exists
      const { data: newAddress, error: createError } = await supabase
        .from('address')
        .insert([addressUpdates])
        .select('address_id')
        .single();

      if (createError) {
        console.error('Error creating address:', createError);
        return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
      }      // Update person with new address ID
      const { error: personError } = await supabase
        .from('person')
        .update({ address_id: newAddress.address_id })
        .eq('person_id', employee.person_id);

      if (personError) {
        console.error('Error linking address to person:', personError);
        return NextResponse.json({ error: 'Failed to link address' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: 'Address information updated successfully'
    });

  } catch (error) {
    console.error('Employee address update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
