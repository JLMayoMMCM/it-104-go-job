import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Delete a saved search
export async function DELETE(request, { params }) {
  try {
    const searchId = params.id;
    
    if (!searchId) {
      return NextResponse.json({
        error: 'Search ID is required'
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

    // Delete the saved search
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', searchId)
      .eq('job_seeker_id', userData.job_seeker.job_seeker_id);

    if (error) {
      console.error('Error deleting saved search:', error);
      return NextResponse.json({
        error: 'Failed to delete saved search'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Saved search deleted successfully'
    });

  } catch (error) {
    console.error('Delete saved search error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Update a saved search
export async function PUT(request, { params }) {
  try {
    const searchId = params.id;
    
    if (!searchId) {
      return NextResponse.json({
        error: 'Search ID is required'
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

    // Get request body
    const { name, filters, resultCount } = await request.json();

    if (!name || !filters) {
      return NextResponse.json({
        error: 'Search name and filters are required'
      }, { status: 400 });
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

    // Update the saved search
    const { data: updatedSearch, error } = await supabase
      .from('saved_searches')
      .update({
        name: name,
        filters: filters,
        result_count: resultCount || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', searchId)
      .eq('job_seeker_id', userData.job_seeker.job_seeker_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating saved search:', error);
      return NextResponse.json({
        error: 'Failed to update saved search'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Saved search updated successfully',
      search: updatedSearch
    });

  } catch (error) {
    console.error('Update saved search error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
