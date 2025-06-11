import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Check if user has applied for a job
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json({
        error: 'Job ID is required'
      }, { status: 400 });
    }

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

    // Get user's job seeker ID
    const { data: userData, error: userError } = await supabase
      .from('account')
      .select(`
        account_id,
        job_seeker (
          job_seeker_id
        )
      `)
      .eq('account_id', userId)
      .single();

    if (userError || !userData?.job_seeker) {
      return NextResponse.json({
        error: 'Job seeker profile not found'
      }, { status: 404 });
    }

    // Check if user has applied for this job
    const { data: application, error } = await supabase
      .from('job_requests')
      .select('request_id')
      .eq('job_id', jobId)
      .eq('job_seeker_id', userData.job_seeker.job_seeker_id)
      .single();

    return NextResponse.json({
      hasApplied: !!application && !error
    });

  } catch (error) {
    console.error('Check job application error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
