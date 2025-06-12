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

    // Parse form data
    const formData = await request.formData();
    const profilePictureFile = formData.get('profilePicture');

    if (!profilePictureFile || profilePictureFile.size === 0) {
      return NextResponse.json({
        error: 'No profile picture file provided'
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(profilePictureFile.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed.'
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (profilePictureFile.size > maxSize) {
      return NextResponse.json({
        error: 'File size too large. Maximum size is 5MB.'
      }, { status: 400 });
    }

    const accountId = decoded.account_id || decoded.userId;

    // Get current jobseeker data
    const { data: currentJobseeker, error: fetchError } = await supabase
      .from('job_seeker')
      .select('job_seeker_id, person_id')
      .eq('account_id', accountId)
      .single();

    if (fetchError || !currentJobseeker) {
      return NextResponse.json({ 
        error: 'Jobseeker profile not found' 
      }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pictures');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(profilePictureFile.name);
    const fileName = `profile_${accountId}_${timestamp}${fileExtension}`;
      // Save file
    const filePath = path.join(uploadsDir, fileName);
    const fileBuffer = Buffer.from(await profilePictureFile.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);

    // Update account table with profile picture filename (not the buffer!)
    const { error: updateError } = await supabase
      .from('account')
      .update({ account_profile_photo: fileName })
      .eq('account_id', accountId);

    if (updateError) {
      console.error('Error updating profile picture:', updateError);
      
      // Clean up uploaded file if database update fails
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
      
      return NextResponse.json({
        error: 'Failed to update profile picture'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Profile picture updated successfully',
      fileName: fileName
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
