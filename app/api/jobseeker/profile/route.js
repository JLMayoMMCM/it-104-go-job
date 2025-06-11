import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

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

    // Get detailed jobseeker profile
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
        job_seeker (
          job_seeker_id,
          job_seeker_skills,
          job_seeker_experience_level,
          job_seeker_preferred_location
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

    // Get job preferences
    const { data: preferences, error: prefError } = await supabase
      .from('jobseeker_preference')
      .select(`
        job_category (
          job_category_id,
          job_category_name,
          category_field (
            category_field_id,
            category_field_name
          )
        )
      `)
      .eq('person_id', profileData.person.person_id);

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
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
      skills: profileData.job_seeker?.job_seeker_skills,
      experienceLevel: profileData.job_seeker?.job_seeker_experience_level,
      preferredLocation: profileData.job_seeker?.job_seeker_preferred_location
    };

    const transformedPreferences = preferences?.map(pref => ({
      job_category_id: pref.job_category.job_category_id,
      job_category_name: pref.job_category.job_category_name,
      category_field_name: pref.job_category.category_field.category_field_name
    })) || [];

    return NextResponse.json({
      profile,
      preferences: transformedPreferences
    });

  } catch (error) {
    console.error('Jobseeker profile API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

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
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid token'
      }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    
    // Extract profile data
    const profileData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone: formData.get('phone'),
      birth_date: formData.get('birth_date'),
      nationality_id: formData.get('nationality_id'),
      education_level: formData.get('education_level'),
      experience_level: formData.get('experience_level'),
      preferred_job_type: formData.get('preferred_job_type'),
      preferred_location: formData.get('preferred_location'),
      preferred_salary_min: formData.get('preferred_salary_min'),
      preferred_salary_max: formData.get('preferred_salary_max'),
      profile_summary: formData.get('profile_summary'),
      skills: formData.get('skills')
    };

    // Handle resume file upload
    const resumeFile = formData.get('resume');
    let resumeFileName = null;

    if (resumeFile && resumeFile.size > 0) {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
      try {
        await fs.access(uploadsDir);
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(resumeFile.name);
      resumeFileName = `resume_${decoded.account_id || decoded.userId}_${timestamp}${fileExtension}`;
      
      // Save file
      const filePath = path.join(uploadsDir, resumeFileName);
      const fileBuffer = Buffer.from(await resumeFile.arrayBuffer());
      await fs.writeFile(filePath, fileBuffer);
    }

    const accountId = decoded.account_id || decoded.userId;

    // Get current jobseeker data
    const { data: currentJobseeker, error: fetchError } = await supabase
      .from('job_seeker')
      .select('job_seeker_id, person_id')
      .eq('account_id', accountId)
      .single();

    if (fetchError || !currentJobseeker) {
      return NextResponse.json({ error: 'Jobseeker profile not found' }, { status: 404 });
    }

    // Update person table
    const personUpdates = {};
    if (profileData.first_name) personUpdates.first_name = profileData.first_name;
    if (profileData.last_name) personUpdates.last_name = profileData.last_name;
    if (profileData.nationality_id) personUpdates.nationality_id = parseInt(profileData.nationality_id);

    if (Object.keys(personUpdates).length > 0) {
      const { error: personError } = await supabase
        .from('person')
        .update(personUpdates)
        .eq('person_id', currentJobseeker.person_id);

      if (personError) {
        console.error('Error updating person:', personError);
        return NextResponse.json({ error: 'Failed to update personal information' }, { status: 500 });
      }
    }

    // Update account phone if provided
    if (profileData.phone) {
      const { error: accountError } = await supabase
        .from('account')
        .update({ account_phone: profileData.phone })
        .eq('account_id', accountId);

      if (accountError) {
        console.error('Error updating account phone:', accountError);
      }
    }

    // Update job_seeker table
    const jobseekerUpdates = {};
    if (profileData.birth_date) jobseekerUpdates.birth_date = profileData.birth_date;
    if (profileData.education_level) jobseekerUpdates.education_level = profileData.education_level;
    if (profileData.experience_level) jobseekerUpdates.experience_level = profileData.experience_level;
    if (profileData.preferred_job_type) jobseekerUpdates.preferred_job_type = profileData.preferred_job_type;
    if (profileData.preferred_location) jobseekerUpdates.preferred_location = profileData.preferred_location;
    if (profileData.preferred_salary_min) jobseekerUpdates.preferred_salary_min = parseInt(profileData.preferred_salary_min);
    if (profileData.preferred_salary_max) jobseekerUpdates.preferred_salary_max = parseInt(profileData.preferred_salary_max);
    if (profileData.profile_summary) jobseekerUpdates.profile_summary = profileData.profile_summary;
    if (profileData.skills) jobseekerUpdates.skills = profileData.skills;
    if (resumeFileName) jobseekerUpdates.resume_file = resumeFileName;

    if (Object.keys(jobseekerUpdates).length > 0) {
      const { error: jobseekerError } = await supabase
        .from('job_seeker')
        .update(jobseekerUpdates)
        .eq('job_seeker_id', currentJobseeker.job_seeker_id);

      if (jobseekerError) {
        console.error('Error updating jobseeker:', jobseekerError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      resume_uploaded: !!resumeFileName
    });

  } catch (error) {
    console.error('Error updating jobseeker profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
