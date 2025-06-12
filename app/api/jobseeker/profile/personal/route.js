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
    const personalData = await request.json();

    // Get the person_id for this account
    const { data: jobseeker, error: jobseekerError } = await supabase
      .from('job_seeker')
      .select('person_id')
      .eq('account_id', accountId)
      .single();

    if (jobseekerError || !jobseeker) {
      return NextResponse.json({ error: 'Job seeker profile not found' }, { status: 404 });
    }

    // Validate required fields
    if (!personalData.firstName && !personalData.lastName && !personalData.middleName && 
        !personalData.dateOfBirth && !personalData.nationalityId) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
    }

    // Prepare update data
    const updateData = {};
    if (personalData.firstName) updateData.first_name = personalData.firstName;
    if (personalData.lastName) updateData.last_name = personalData.lastName;
    if (personalData.middleName) updateData.middle_name = personalData.middleName;
    if (personalData.dateOfBirth) updateData.date_of_birth = personalData.dateOfBirth;
    if (personalData.nationalityId) updateData.nationality_id = parseInt(personalData.nationalityId);

    // Validate nationality_id if provided
    if (personalData.nationalityId) {
      const { data: nationality } = await supabase
        .from('nationality')
        .select('nationality_id')
        .eq('nationality_id', parseInt(personalData.nationalityId))
        .single();

      if (!nationality) {
        return NextResponse.json({ error: 'Invalid nationality selected' }, { status: 400 });
      }
    }

    // Update person table
    const { error: updateError } = await supabase
      .from('person')
      .update(updateData)
      .eq('person_id', jobseeker.person_id);

    if (updateError) {
      console.error('Error updating personal information:', updateError);
      return NextResponse.json({ error: 'Failed to update personal information' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Personal information updated successfully'
    });

  } catch (error) {
    console.error('Personal information update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
