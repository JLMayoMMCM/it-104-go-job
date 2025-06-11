import { supabase, testSupabaseConnection } from '@/app/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test basic connection using Supabase
    const connectionTest = await testSupabaseConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: connectionTest.error,
        message: connectionTest.message
      }, { status: 500 });
    }

    // Get list of tables from the database
    let tables = [];
    try {
      // Query information_schema to get table names
      const { data: tableData, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');

      if (tableError) {
        console.warn('Could not fetch table info using information_schema, trying alternative method:', tableError.message);
        
        // Alternative: try to get tables by testing known table names
        const knownTables = [
          'nationality', 'address', 'person', 'person_resume', 'account_type', 
          'account', 'notifications', 'company', 'job_category', 'category_field',
          'job', 'job_seeker', 'employee', 'application', 'job_skill', 'skill'
        ];
        
        for (const tableName of knownTables) {
          try {
            const { error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!error) {
              tables.push(tableName);
            }
          } catch (e) {
            // Table doesn't exist, skip it
          }
        }
      } else {
        tables = tableData?.map(row => row.table_name) || [];
      }
    } catch (queryError) {
      console.warn('Could not fetch table info, but connection was successful:', queryError.message);
    }

    return NextResponse.json({
      success: true,
      message: connectionTest.message || 'Database connection successful!',
      data: connectionTest.data,
      tableCount: tables.length,
      tables: tables,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error && error.message ? error.message : String(error),
      message: 'Database connection test failed!'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { sqlQuery } = body;

    if (!sqlQuery) {
      return NextResponse.json({
        success: false,
        error: 'No SQL query provided'
      }, { status: 400 });
    }

    // Only allow SELECT queries for safety
    if (!sqlQuery.trim().toLowerCase().startsWith('select')) {
      return NextResponse.json({
        success: false,
        error: 'Only SELECT queries are allowed'
      }, { status: 400 });
    }

    // Parse the query to extract table name and conditions
    const queryLower = sqlQuery.trim().toLowerCase();
    
    // Simple parser for basic SELECT queries
    if (queryLower.includes('select * from ')) {
      const tableMatch = sqlQuery.match(/from\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        
        // Check if there's a LIMIT clause
        const limitMatch = sqlQuery.match(/limit\s+(\d+)/i);
        const limit = limitMatch ? parseInt(limitMatch[1]) : 50;
        
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(limit);

          if (error) {
            throw error;
          }

          return NextResponse.json({
            success: true,
            data: data || [],
            rowCount: data?.length || 0,
            timestamp: new Date().toISOString()
          });
        } catch (supabaseError) {
          throw supabaseError;
        }
      }
    }

    // For more complex queries, we'll need to use RPC or handle them differently
    // For now, return an error for unsupported queries
    return NextResponse.json({
      success: false,
      error: 'Complex queries are not supported yet. Please use simple SELECT * FROM table_name LIMIT n queries.'
    }, { status: 400 });

  } catch (error) {
    console.error('Query Error:', error);
    return NextResponse.json({
      success: false,
      error: error && error.message ? error.message : String(error)
    }, { status: 500 });
  }
}
