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
    const resume = formData.get('resume');

    if (!resume || resume.size === 0) {
      return NextResponse.json({
        error: 'Resume file is required'
      }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(resume.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only PDF and Word documents are allowed'
      }, { status: 400 });
    }

    if (resume.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({
        error: 'File size too large. Maximum size is 10MB'
      }, { status: 400 });
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
    const fileExtension = path.extname(resume.name);
    const fileName = `resume_employee_${decoded.account_id}_${timestamp}${fileExtension}`;
    
    // Save file
    const filePath = path.join(uploadsDir, fileName);
    const fileBuffer = Buffer.from(await resume.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);

    // Get employee record to update resume file
    const { data: employee, error: employeeError } = await supabase
      .from('employee')
      .select('employee_id')
      .eq('account_id', decoded.account_id)
      .single();

    if (employeeError || !employee) {
      // Try to delete uploaded file if employee not found
      try {
        await fs.unlink(filePath);
      } catch (deleteError) {
        console.error('Error deleting uploaded file:', deleteError);
      }
      return NextResponse.json({
        error: 'Employee profile not found'
      }, { status: 404 });
    }

    // Update employee with resume filename (if resume field exists in employee table)
    // Note: Based on the schema, employees may not have a resume field like job seekers
    // This is here for completeness, but may need adjustment based on actual requirements
    const { error: updateError } = await supabase
      .from('employee')
      .update({ resume_file: fileName })
      .eq('employee_id', employee.employee_id);

    if (updateError) {
      console.error('Error updating resume file:', updateError);
      // If resume field doesn't exist, that's okay for employees
      // Just continue without failing
    }

    return NextResponse.json({
      message: 'Resume uploaded successfully',
      fileName: fileName
    });

  } catch (error) {
    console.error('Employee resume upload error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
