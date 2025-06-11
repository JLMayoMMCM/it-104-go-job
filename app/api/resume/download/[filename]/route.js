import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { filename } = params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify the user owns this resume or has permission to view it
    const { data: jobseekerData, error: jobseekerError } = await supabase
      .from('job_seeker')
      .select('resume_file')
      .eq('account_id', decoded.account_id || decoded.userId)
      .single();

    if (jobseekerError || !jobseekerData || jobseekerData.resume_file !== filename) {
      return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 404 });
    }

    // Check if file exists
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'resumes', filename);
    
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read and return the file
    const fileBuffer = await fs.readFile(filePath);
    const fileExtension = path.extname(filename).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (fileExtension === '.pdf') {
      contentType = 'application/pdf';
    } else if (fileExtension === '.doc') {
      contentType = 'application/msword';
    } else if (fileExtension === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
