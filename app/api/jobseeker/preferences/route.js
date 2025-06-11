import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Helper function to extract user from token
async function getUserFromToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details from database
    const { data: account, error } = await supabase
      .from('account')
      .select(`
        account_id,
        account_email,
        account_username,
        account_type (account_type_name),
        person (
          person_id,
          first_name,
          last_name
        )
      `)
      .eq('account_id', decoded.accountId)
      .single();

    if (error || !account) {
      return null;
    }

    return account;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user || user.account_type.account_type_name !== 'Job Seeker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const personId = user.person.person_id;

    // Get field preferences
    const { data: fieldPreferences, error: fieldError } = await supabase
      .from('jobseeker_field_preference')
      .select('preferred_job_field_id')
      .eq('person_id', personId);

    if (fieldError) {
      console.error('Error fetching field preferences:', fieldError);
      return NextResponse.json({ error: 'Failed to fetch field preferences' }, { status: 500 });
    }

    // Get category preferences
    const { data: categoryPreferences, error: categoryError } = await supabase
      .from('jobseeker_preference')
      .select('preferred_job_category_id')
      .eq('person_id', personId);

    if (categoryError) {
      console.error('Error fetching category preferences:', categoryError);
      return NextResponse.json({ error: 'Failed to fetch category preferences' }, { status: 500 });
    }

    return NextResponse.json({
      field_preferences: fieldPreferences?.map(fp => fp.preferred_job_field_id) || [],
      category_preferences: categoryPreferences?.map(cp => cp.preferred_job_category_id) || []
    });

  } catch (error) {
    console.error('Preferences API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user || user.account_type.account_type_name !== 'Job Seeker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const personId = user.person.person_id;
    const { field_preferences, category_preferences } = await request.json();

    // Start a transaction by handling both operations
    
    // Delete existing field preferences
    const { error: deleteFieldError } = await supabase
      .from('jobseeker_field_preference')
      .delete()
      .eq('person_id', personId);

    if (deleteFieldError) {
      console.error('Error deleting field preferences:', deleteFieldError);
      return NextResponse.json({ error: 'Failed to update field preferences' }, { status: 500 });
    }

    // Delete existing category preferences
    const { error: deleteCategoryError } = await supabase
      .from('jobseeker_preference')
      .delete()
      .eq('person_id', personId);

    if (deleteCategoryError) {
      console.error('Error deleting category preferences:', deleteCategoryError);
      return NextResponse.json({ error: 'Failed to update category preferences' }, { status: 500 });
    }

    // Insert new field preferences
    if (field_preferences && field_preferences.length > 0) {
      const fieldData = field_preferences.map(fieldId => ({
        person_id: personId,
        preferred_job_field_id: fieldId
      }));

      const { error: insertFieldError } = await supabase
        .from('jobseeker_field_preference')
        .insert(fieldData);

      if (insertFieldError) {
        console.error('Error inserting field preferences:', insertFieldError);
        return NextResponse.json({ error: 'Failed to save field preferences' }, { status: 500 });
      }
    }

    // Insert new category preferences
    if (category_preferences && category_preferences.length > 0) {
      const categoryData = category_preferences.map(categoryId => ({
        person_id: personId,
        preferred_job_category_id: categoryId
      }));

      const { error: insertCategoryError } = await supabase
        .from('jobseeker_preference')
        .insert(categoryData);

      if (insertCategoryError) {
        console.error('Error inserting category preferences:', insertCategoryError);
        return NextResponse.json({ error: 'Failed to save category preferences' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      message: 'Preferences updated successfully',
      field_preferences: field_preferences || [],
      category_preferences: category_preferences || []
    });

  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
