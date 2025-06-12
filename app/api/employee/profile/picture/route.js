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
    const profilePicture = formData.get('profilePicture');

    if (!profilePicture || profilePicture.size === 0) {
      return NextResponse.json({
        error: 'Profile picture file is required'
      }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(profilePicture.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'
      }, { status: 400 });
    }

    if (profilePicture.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({
        error: 'File size too large. Maximum size is 5MB'
      }, { status: 400 });
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
    const fileExtension = path.extname(profilePicture.name);
    const fileName = `profile_employee_${decoded.account_id}_${timestamp}${fileExtension}`;
    
    // Save file
    const filePath = path.join(uploadsDir, fileName);
    const fileBuffer = Buffer.from(await profilePicture.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);

    // Update account with profile picture filename
    const { error: updateError } = await supabase
      .from('account')
      .update({ account_profile_photo: fileName })
      .eq('account_id', decoded.account_id);

    if (updateError) {
      console.error('Error updating profile picture:', updateError);
      // Try to delete uploaded file if database update fails
      try {
        await fs.unlink(filePath);
      } catch (deleteError) {
        console.error('Error deleting uploaded file:', deleteError);
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
    console.error('Employee profile picture update error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
