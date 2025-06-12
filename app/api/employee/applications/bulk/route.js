import { supabase } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Bulk update applications
export async function PUT(request) {
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
    const { applicationIds, action, notes } = await request.json();

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json({
        error: 'Application IDs are required'
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({
        error: 'Action is required'
      }, { status: 400 });
    }

    // Get employee information
    const { data: employee, error: employeeError } = await supabase
      .from('employee')
      .select('company_id')
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Verify all applications belong to the company
    const { data: applications, error: verifyError } = await supabase
      .from('job_applications')
      .select(`
        id,
        job_id,
        jobs (
          company_id
        )
      `)
      .in('id', applicationIds);

    if (verifyError) {
      console.error('Error verifying applications:', verifyError);
      return NextResponse.json({ error: 'Failed to verify applications' }, { status: 500 });
    }

    // Check if all applications belong to the company
    const invalidApplications = applications.filter(app => app.jobs.company_id !== employee.company_id);
    if (invalidApplications.length > 0) {
      return NextResponse.json({
        error: 'Some applications do not belong to your company'
      }, { status: 403 });
    }

    // Determine the status based on action
    let newStatus;
    switch (action) {
      case 'accept':
        newStatus = 'accepted';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'mark-reviewed':
        newStatus = 'reviewed';
        break;
      case 'archive':
        newStatus = 'archived';
        break;
      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 });
    }

    // Perform bulk update
    const { data: updatedApplications, error: updateError } = await supabase
      .from('job_applications')
      .update({
        status: newStatus,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .in('id', applicationIds)
      .select();

    if (updateError) {
      console.error('Error updating applications:', updateError);
      return NextResponse.json({ error: 'Failed to update applications' }, { status: 500 });
    }

    // Create notifications for affected job seekers
    const notifications = [];
    for (const app of applications) {
      // Get jobseeker info for notification
      const { data: jobseeker, error: jobseekerError } = await supabase
        .from('job_applications')
        .select(`
          jobseekers (
            user_id
          ),
          jobs (
            title
          )
        `)
        .eq('id', app.id)
        .single();

      if (!jobseekerError && jobseeker) {
        notifications.push({
          user_id: jobseeker.jobseekers.user_id,
          type: 'job-applications',
          title: `Application Status Updated`,
          message: `Your application for "${jobseeker.jobs.title}" has been ${newStatus}`,
          priority: action === 'accept' ? 'high' : 'normal',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    // Insert notifications in bulk
    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
        // Don't fail the whole operation if notifications fail
      }
    }

    return NextResponse.json({
      message: `Successfully updated ${updatedApplications.length} applications`,
      updatedCount: updatedApplications.length,
      action: action,
      newStatus: newStatus
    });

  } catch (error) {
    console.error('Bulk applications API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Get bulk actions summary
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

    // Get employee information
    const { data: employee, error: employeeError } = await supabase
      .from('employee')
      .select('company_id')
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get statistics for bulk actions
    const { data: statusCounts, error: statusError } = await supabase
      .from('job_applications')
      .select(`
        status,
        jobs!inner (
          company_id
        )
      `)
      .eq('jobs.company_id', employee.company_id);

    if (statusError) {
      console.error('Error fetching status counts:', statusError);
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }

    // Calculate status distribution
    const statusDistribution = {};
    statusCounts.forEach(app => {
      statusDistribution[app.status] = (statusDistribution[app.status] || 0) + 1;
    });

    // Get recent bulk actions (simulated - you might want to track this in a separate table)
    const recentActions = [
      {
        action: 'bulk_accept',
        count: 5,
        performed_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        performed_by: 'Current User'
      },
      {
        action: 'bulk_reject',
        count: 3,
        performed_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        performed_by: 'Current User'
      }
    ];

    return NextResponse.json({
      statusDistribution,
      totalApplications: statusCounts.length,
      recentActions,
      availableActions: [
        { id: 'accept', label: 'Accept Applications', description: 'Mark selected applications as accepted' },
        { id: 'reject', label: 'Reject Applications', description: 'Mark selected applications as rejected' },
        { id: 'mark-reviewed', label: 'Mark as Reviewed', description: 'Mark selected applications as reviewed' },
        { id: 'archive', label: 'Archive Applications', description: 'Archive selected applications' }
      ]
    });

  } catch (error) {
    console.error('Bulk actions summary API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
