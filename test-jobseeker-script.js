const timestamp = Date.now();
const jobseekerData = {
  email: `jobseeker.test.${timestamp}@example.com`,
  password: 'testpassword123',
  username: `js_user_${timestamp}`,
  user_type: 'job-seeker',
  first_name: 'Jane',
  last_name: 'JobSeeker',
  phone: '09876543210',
  birth_date: '1992-08-10',
  nationality_id: 1,
  gender_id: 2,
  city_name: 'Quezon City',
  premise_name: 'Test House',
  street_name: 'Test Avenue',
  barangay_name: 'Test District'
};

console.log('Testing job seeker registration with data:', jobseekerData);

fetch('http://localhost:3000/api/auth/register-new', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(jobseekerData)
}).then(res => res.json()).then(data => {
  console.log('Job Seeker Registration Result:', JSON.stringify(data, null, 2));
  console.log('✅ Check the server console for standard verification email logs!');
}).catch(err => console.error('Error:', err));
