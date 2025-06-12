import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  try {
    // Extract JWT token from cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get user data to determine user type
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        user_type,
        employees (
          id,
          company_id,
          role,
          companies (
            id,
            name,
            logo_url
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build navigation based on user type
    let navigation = {
      user: {
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        type: user.user_type,
        avatar: null // You can add avatar support later
      },
      main_menu: [],
      quick_actions: [],
      notifications: {
        count: 0,
        recent: []
      }
    };

    if (user.user_type === 'employee' && user.employees?.[0]) {
      const employee = user.employees[0];
      const company = employee.companies;

      navigation.user.company = {
        name: company?.name || 'Unknown Company',
        logo: company?.logo_url || null,
        role: employee.role || 'Employee'
      };

      // Employee navigation menu
      navigation.main_menu = [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: '📊',
          path: '/app-dashboard/employee',
          badge: null
        },
        {
          id: 'company-profile',
          title: 'Company Profile',
          icon: '🏢',
          path: '/app-profile/company',
          badge: null
        },
        {
          id: 'job-management',
          title: 'Job Management',
          icon: '💼',
          path: '/app-dashboard/employee/jobs',
          badge: null,
          submenu: [
            {
              id: 'post-job',
              title: 'Post New Job',
              icon: '➕',
              path: '/app-post-job'
            },
            {
              id: 'manage-jobs',
              title: 'Manage Jobs',
              icon: '📋',
              path: '/app-dashboard/employee/jobs'
            }
          ]
        },
        {
          id: 'applications',
          title: 'Applications',
          icon: '📥',
          path: '/app-dashboard/employee/applications',
          badge: null
        },
        {
          id: 'bulk-operations',
          title: 'Bulk Operations',
          icon: '⚡',
          path: '/app-dashboard/employee/bulk-applications',
          badge: null
        },
        {
          id: 'analytics',
          title: 'Analytics',
          icon: '📈',
          path: '/app-dashboard/employee/analytics',
          badge: null
        },
        {
          id: 'notifications',
          title: 'Notifications',
          icon: '🔔',
          path: '/app-notifications',
          badge: null
        }
      ];

      // Employee quick actions
      navigation.quick_actions = [
        {
          id: 'post-job',
          title: 'Post Job',
          icon: '➕',
          path: '/app-post-job',
          color: 'primary'
        },
        {
          id: 'view-applications',
          title: 'Applications',
          icon: '📥',
          path: '/app-dashboard/employee/applications',
          color: 'secondary'
        },
        {
          id: 'bulk-manage',
          title: 'Bulk Manage',
          icon: '⚡',
          path: '/app-dashboard/employee/bulk-applications',
          color: 'accent'
        },
        {
          id: 'advanced-search',
          title: 'Find Talent',
          icon: '🔍',
          path: '/app-jobs/advanced-search',
          color: 'info'
        }
      ];

      // Get notification count
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id, title, message, created_at, is_read')
        .eq('user_id', userId)
        .eq('is_read', false)
        .limit(5)
        .order('created_at', { ascending: false });

      if (!notifError && notifications) {
        navigation.notifications.count = notifications.length;
        navigation.notifications.recent = notifications.map(notif => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          time: notif.created_at,
          is_read: notif.is_read
        }));
      }

      // Get application count for badge
      const { data: applications, error: appError } = await supabase
        .from('job_requests')
        .select('request_id')
        .eq('job.company_id', employee.company_id)
        .eq('request_status', 'pending');

      if (!appError && applications) {
        const appMenuItem = navigation.main_menu.find(item => item.id === 'applications');
        if (appMenuItem && applications.length > 0) {
          appMenuItem.badge = applications.length;
        }
      }

    } else {
      // Job seeker navigation (basic structure)
      navigation.main_menu = [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: '🏠',
          path: '/app-dashboard',
          badge: null
        },
        {
          id: 'job-search',
          title: 'Find Jobs',
          icon: '🔍',
          path: '/app-jobs',
          badge: null
        },
        {
          id: 'applications',
          title: 'My Applications',
          icon: '📄',
          path: '/app-applications',
          badge: null
        },
        {
          id: 'saved-jobs',
          title: 'Saved Jobs',
          icon: '❤️',
          path: '/app-saved-jobs',
          badge: null
        },
        {
          id: 'profile',
          title: 'Profile',
          icon: '👤',
          path: '/app-profile/jobseeker',
          badge: null
        }
      ];

      navigation.quick_actions = [
        {
          id: 'search-jobs',
          title: 'Search Jobs',
          icon: '🔍',
          path: '/app-jobs',
          color: 'primary'
        },
        {
          id: 'advanced-search',
          title: 'Advanced Search',
          icon: '⚡',
          path: '/app-jobs/advanced-search',
          color: 'secondary'
        },
        {
          id: 'my-applications',
          title: 'Applications',
          icon: '📄',
          path: '/app-applications',
          color: 'accent'
        },
        {
          id: 'update-profile',
          title: 'Update Profile',
          icon: '✏️',
          path: '/app-profile/jobseeker/edit',
          color: 'info'
        }
      ];
    }

    return NextResponse.json(navigation);

  } catch (error) {
    console.error('Mobile navigation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
