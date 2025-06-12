// Test script for profile picture upload API
const fs = require('fs');
const FormData = require('form-data');
const API_BASE = 'http://localhost:3001';

async function testProfilePictureUpload() {
  console.log('🧪 Testing Profile Picture Upload API...\n');

  try {
    // Test with invalid token first to check validation
    console.log('1. Testing authorization validation...');
    
    const form = new FormData();
    // Create a simple test image buffer
    const testImageBuffer = Buffer.from('fake-image-data');
    form.append('profilePicture', testImageBuffer, {
      filename: 'test.jpg',
      contentType: 'image/jpeg'
    });

    const response = await fetch(`${API_BASE}/api/jobseeker/profile/picture`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token'
      },
      body: form
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.status === 401) {
      console.log('✅ Authorization validation working correctly');
    }

    // Test without file
    console.log('\n2. Testing validation without file...');
    const noFileResponse = await fetch(`${API_BASE}/api/jobseeker/profile/picture`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const noFileResult = await noFileResponse.json();
    console.log('No file response status:', noFileResponse.status);
    console.log('No file response:', noFileResult);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testProfilePictureUpload();
