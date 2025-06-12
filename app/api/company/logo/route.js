import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    // Extract JWT token from cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('logo');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
    }

    // First get the employee to find the company
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, company_id')
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `company-logo-${employee.company_id}-${timestamp}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName);

    const logoUrl = urlData.publicUrl;

    // Update the company with the new logo URL
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', employee.company_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating company logo:', updateError);
      return NextResponse.json({ error: 'Failed to update company logo' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl
    });

  } catch (error) {
    console.error('Logo upload API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // Extract JWT token from cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // First get the employee to find the company
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, company_id, companies(logo_url)')
      .eq('user_id', userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Extract filename from URL if logo exists
    if (employee.companies?.logo_url) {
      const urlParts = employee.companies.logo_url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('company-logos')
        .remove([fileName]);

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
        // Continue anyway to clear the database reference
      }
    }

    // Update the company to remove the logo URL
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        logo_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', employee.company_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error removing company logo:', updateError);
      return NextResponse.json({ error: 'Failed to remove company logo' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Logo removed successfully'
    });

  } catch (error) {
    console.error('Logo delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
