import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Create a new saved search
export async function POST(request) {
  try {
    // Get user from token (using cookie-based auth)
    const cookieHeader = request.headers.get('cookie');
    let token = null;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const tokenCookie = cookies.find(c => c.startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
      }
    }

    if (!token) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

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

    // Create saved search
    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .insert({
        job_seeker_id: userData.job_seeker.job_seeker_id,
        name: name,
        filters: filters,
        result_count: resultCount || 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating saved search:', error);
      return NextResponse.json({
        error: 'Failed to save search'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Search saved successfully',
      search: savedSearch
    });

  } catch (error) {
    console.error('Saved searches API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Get user's saved searches
export async function GET(request) {
  try {
    // Get user from token (using cookie-based auth)
    const cookieHeader = request.headers.get('cookie');
    let token = null;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const tokenCookie = cookies.find(c => c.startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
      }
    }

    if (!token) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

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

    // Get saved searches
    const { data: searches, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('job_seeker_id', userData.job_seeker.job_seeker_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved searches:', error);
      return NextResponse.json({
        error: 'Failed to fetch saved searches'
      }, { status: 500 });
    }

    return NextResponse.json({
      searches: searches || []
    });

  } catch (error) {
    console.error('Saved searches API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
