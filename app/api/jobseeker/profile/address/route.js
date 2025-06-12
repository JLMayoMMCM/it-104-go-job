import { supabase } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function PUT(request) {
  try {
    // Get user from token
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

    const accountId = decoded.account_id || decoded.userId;
    const addressData = await request.json();

    // Get the person_id and current address_id for this account
    const { data: person, error: personError } = await supabase
      .from('job_seeker')
      .select(`
        person_id,
        person (
          address_id
        )
      `)
      .eq('account_id', accountId)
      .single();

    if (personError || !person) {
      return NextResponse.json({ error: 'Job seeker profile not found' }, { status: 404 });
    }

    // Validate that at least city is provided if any address field is provided
    const hasAddressData = addressData.premiseName || addressData.streetName || 
                          addressData.barangayName || addressData.cityName;
    
    if (hasAddressData && !addressData.cityName) {
      return NextResponse.json({ error: 'City name is required' }, { status: 400 });
    }

    if (!hasAddressData) {
      return NextResponse.json({ error: 'At least one address field is required' }, { status: 400 });
    }

    // Prepare address data
    const addressUpdateData = {
      premise_name: addressData.premiseName || null,
      street_name: addressData.streetName || null,
      barangay_name: addressData.barangayName || null,
      city_name: addressData.cityName
    };

    let addressId = person.person.address_id;

    if (addressId) {
      // Update existing address
      const { error: updateError } = await supabase
        .from('address')
        .update(addressUpdateData)
        .eq('address_id', addressId);

      if (updateError) {
        console.error('Error updating address:', updateError);
        return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
      }
    } else {
      // Create new address
      const { data: newAddress, error: createError } = await supabase
        .from('address')
        .insert([addressUpdateData])
        .select('address_id')
        .single();

      if (createError) {
        console.error('Error creating address:', createError);
        return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
      }

      addressId = newAddress.address_id;

      // Update person with new address_id
      const { error: personUpdateError } = await supabase
        .from('person')
        .update({ address_id: addressId })
        .eq('person_id', person.person_id);

      if (personUpdateError) {
        console.error('Error linking address to person:', personUpdateError);
        return NextResponse.json({ error: 'Failed to link address to profile' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      message: 'Address information updated successfully'
    });

  } catch (error) {
    console.error('Address update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
