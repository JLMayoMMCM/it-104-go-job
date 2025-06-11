import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Remove a saved job
export async function DELETE(request, { params }) {
  try {
    const jobId = params.id;
    
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

    // Remove the saved job
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('job_seeker_id', userData.job_seeker.job_seeker_id);

    if (error) {
      console.error('Error removing saved job:', error);
      return NextResponse.json({
        error: 'Failed to remove saved job'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Job removed from saved list successfully'
    });

  } catch (error) {
    console.error('Remove saved job error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
