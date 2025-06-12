import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit')) || 50;

    // Build query for notifications
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({
        error: 'Failed to fetch notifications'
      }, { status: 500 });
    }

    return NextResponse.json({
      notifications: notifications || []
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request) {
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

    const {
      title,
      message,
      type,
      priority = 'normal',
      related_id,
      action_url
    } = await request.json();

    if (!title || !message || !type) {
      return NextResponse.json({
        error: 'Title, message, and type are required'
      }, { status: 400 });
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type,
        priority,
        related_id,
        action_url,
        is_read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({
        error: 'Failed to create notification'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    console.error('Create notification API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
