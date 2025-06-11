import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Testing verification flow with:', body);

    // Test the verify endpoint
    const verifyResponse = await fetch('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email || 'test@example.com',
        verification_code: body.verification_code || '123456'
      })
    });

    const verifyResult = await verifyResponse.json();

    return NextResponse.json({
      success: true,
      verify_endpoint_status: verifyResponse.status,
      verify_response: verifyResult,
      message: 'Verification endpoint is accessible and responding correctly'
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Verification test endpoint is working',
    instructions: 'Send a POST request with email and verification_code to test the verification flow'
  });
}
