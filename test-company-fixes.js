const { supabase } = require('./app/lib/supabase');

async function testCompanyFixes() {
  console.log('🔍 Testing Company Association and Profile Fixes...\n');

  try {
    // Test 1: Check if employee table exists and has correct structure
    console.log('1. Testing employee table structure...');
    const { data: employees, error: empError } = await supabase
      .from('employee')
      .select('employee_id, account_id, company_id, position_name')
      .limit(1);
    
    if (empError) {
      console.error('❌ Employee table error:', empError.message);
    } else {
      console.log('✅ Employee table accessible');
      if (employees.length > 0) {
        console.log('📊 Sample employee:', employees[0]);
      }
    }

    // Test 2: Check if company table exists and has correct structure
    console.log('\n2. Testing company table structure...');
    const { data: companies, error: compError } = await supabase
      .from('company')
      .select('company_id, company_name, company_email')
      .limit(1);
    
    if (compError) {
      console.error('❌ Company table error:', compError.message);
    } else {
      console.log('✅ Company table accessible');
      if (companies.length > 0) {
        console.log('📊 Sample company:', companies[0]);
      }
    }

    // Test 3: Check employee-company relationships
    console.log('\n3. Testing employee-company relationships...');
    const { data: empWithCompany, error: relError } = await supabase
      .from('employee')
      .select(`
        employee_id,
        account_id,
        company_id,
        position_name,
        company:company_id (
          company_id,
          company_name,
          company_email
        )
      `)
      .not('company_id', 'is', null)
      .limit(3);
    
    if (relError) {
      console.error('❌ Employee-company relationship error:', relError.message);
    } else {
      console.log('✅ Employee-company relationships work');
      console.log(`📊 Found ${empWithCompany.length} employees with company associations`);
      empWithCompany.forEach((emp, index) => {
        console.log(`   ${index + 1}. Employee ${emp.employee_id} -> Company: ${emp.company?.company_name || 'No company'}`);
      });
    }

    // Test 4: Check accounts with profile photos
    console.log('\n4. Testing profile picture storage...');
    const { data: accountsWithPhotos, error: photoError } = await supabase
      .from('account')
      .select('account_id, account_username, account_profile_photo')
      .not('account_profile_photo', 'is', null)
      .limit(3);
    
    if (photoError) {
      console.error('❌ Profile photo check error:', photoError.message);
    } else {
      console.log('✅ Profile photo storage accessible');
      console.log(`📊 Found ${accountsWithPhotos.length} accounts with profile photos`);
      accountsWithPhotos.forEach((acc, index) => {
        console.log(`   ${index + 1}. Account ${acc.account_id} (${acc.account_username}): ${acc.account_profile_photo}`);
      });
    }

    console.log('\n🎉 Company association and profile fixes test completed!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

testCompanyFixes();
