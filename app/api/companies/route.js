import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all companies for selection
    const { data: companies, error } = await supabase
      .from('company')
      .select(`
        company_id,
        company_name,
        company_email,
        company_description,
        address:address_id (
          city_name,
          barangay_name
        )
      `)
      .order('company_name');

    if (error) {
      console.error('Error fetching companies:', error);
      return NextResponse.json({
        error: 'Failed to fetch companies'
      }, { status: 500 });
    }

    // Transform the data for better display
    const transformedCompanies = companies.map(company => ({
      company_id: company.company_id,
      company_name: company.company_name,
      company_email: company.company_email,
      company_description: company.company_description,
      location: company.address ? 
        `${company.address.city_name}${company.address.barangay_name ? ', ' + company.address.barangay_name : ''}` 
        : 'Location not specified'
    }));

    return NextResponse.json(transformedCompanies);
    
  } catch (error) {
    console.error('Companies API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
