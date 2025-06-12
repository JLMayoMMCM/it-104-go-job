const timestamp = Date.now();
const employeeData = {
  email: `employee.test.${timestamp}@example.com`,
  password: 'testpassword123',
  username: `emp_user_${timestamp}`,
  user_type: 'employee',
  first_name: 'John',
  last_name: 'Employee',
  phone: '09123456789',
  birth_date: '1990-05-15',
  nationality_id: 1,
  gender_id: 1,
  job_title: 'Software Developer',
  company_id: '1',
  city_name: 'Manila',
  premise_name: 'Test Residence',
  street_name: 'Test Street',
  barangay_name: 'Test Barangay'
};

console.log('Testing employee registration with data:', employeeData);

fetch('http://localhost:3000/api/auth/register-new', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(employeeData)
}).then(res => res.json()).then(data => {
  console.log('Employee Registration Result:', JSON.stringify(data, null, 2));
  console.log('✅ Check the server console for email logs!');
}).catch(err => console.error('Error:', err));
