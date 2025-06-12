import { supabase } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

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

    // Parse form data
    const formData = await request.formData();
    const resumeFile = formData.get('resume');

    if (!resumeFile) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json({ error: 'Resume must be a PDF or Word document' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (resumeFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Resume file size must be less than 10MB' }, { status: 400 });
    }

    // Get the job seeker record
    const { data: jobseeker, error: jobseekerError } = await supabase
      .from('job_seeker')
      .select('job_seeker_id, person_id')
      .eq('account_id', accountId)
      .single();

    if (jobseekerError || !jobseeker) {
      return NextResponse.json({ error: 'Job seeker profile not found' }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = resumeFile.name.split('.').pop();
    const fileName = `resume_${accountId}_${timestamp}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    const fileBuffer = Buffer.from(await resumeFile.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);

    // Update job_seeker record with resume filename
    const { error: updateError } = await supabase
      .from('job_seeker')
      .update({ 
        job_seeker_resume: fileName,
        resume_updated_at: new Date().toISOString()
      })
      .eq('job_seeker_id', jobseeker.job_seeker_id);

    if (updateError) {
      console.error('Error updating resume record:', updateError);
      // Try to delete the uploaded file if database update fails
      try {
        await fs.unlink(filePath);
      } catch (deleteError) {
        console.error('Error deleting uploaded file:', deleteError);
      }
      return NextResponse.json({ error: 'Failed to update resume record' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Resume uploaded successfully',
      fileName: fileName
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
