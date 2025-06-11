'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RegistrationTestPage() {
  const [nationalities, setNationalities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    testNationalitiesAPI();
  }, []);

  const testNationalitiesAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing nationalities API...');
      const response = await fetch('/api/nationalities');
      
      if (response.ok) {
        const data = await response.json();
        setNationalities(data);
        setTestResults(prev => ({
          ...prev,
          nationalitiesAPI: {
            status: 'success',
            message: `Loaded ${data.length} nationalities`,
            data: data.slice(0, 5) // Show first 5 for preview
          }
        }));
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      setError(err.message);
      setTestResults(prev => ({
        ...prev,
        nationalitiesAPI: {
          status: 'error',
          message: err.message
        }
      }));
    } finally {
      setLoading(false);
    }
  };
  const testRegistrationAPI = async (userType) => {
    setLoading(true);
    
    // Generate unique test emails to avoid conflicts
    const timestamp = Date.now();
    
    const testData = {
      'job-seeker': {
        email: `test.jobseeker.${timestamp}@example.com`,
        password: 'testpassword123',
        user_type: 'job-seeker',
        first_name: 'Test',
        last_name: 'JobSeeker',
        phone: '09123456789',
        nationality_id: nationalities[0]?.nationality_id || 1,
        city_name: 'Test City',
        premise_name: 'Test House',
        street_name: 'Test Street',
        barangay_name: 'Test Barangay',
        education_level: 'Bachelor\'s Degree',
        experience_level: 'Entry Level',
        profile_summary: 'Test profile summary for job seeker'
      },
      'employee': {
        email: `test.employee.${timestamp}@example.com`,
        password: 'testpassword123',
        user_type: 'employee',
        first_name: 'Test',
        last_name: 'Employee',
        phone: '09123456789',
        nationality_id: nationalities[0]?.nationality_id || 1,
        company_name: `Test Company ${timestamp}`,
        job_title: 'Test Position',
        city_name: 'Test City',
        premise_name: 'Test House',
        street_name: 'Test Street',
        barangay_name: 'Test Barangay',
        company_industry: 'Technology',
        company_description: 'Test company description'
      },
      'company': {
        email: `test.company.${timestamp}@example.com`,
        password: 'testpassword123',
        user_type: 'company',
        company_name: `Test Corporation ${timestamp}`,
        company_email: `contact.${timestamp}@testcorp.com`,
        company_phone: '09123456789',
        city_name: 'Test City',
        premise_name: 'Test Building',
        street_name: 'Test Avenue',
        barangay_name: 'Test District',
        company_industry: 'Technology',
        company_description: 'Test corporation description',
        company_website: 'https://testcorp.example.com'
      }
    };

    try {
      console.log(`Testing ${userType} registration with data:`, testData[userType]);
      
      const response = await fetch('/api/auth/register-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData[userType]),
      });

      const result = await response.json();
      
      console.log(`${userType} registration result:`, result);
      
      setTestResults(prev => ({
        ...prev,
        [`${userType}Registration`]: {
          status: response.ok ? 'success' : 'error',
          message: result.message || result.error,
          statusCode: response.status,
          details: result
        }
      }));
    } catch (err) {
      console.error(`${userType} registration error:`, err);
      setTestResults(prev => ({
        ...prev,
        [`${userType}Registration`]: {
          status: 'error',
          message: err.message,
          details: err
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseTables = async () => {
    setLoading(true);
    
    const tablesToCheck = [
      'nationality', 'address', 'person', 'account', 'account_type',
      'job_seeker', 'employee', 'company'
    ];
    
    const tableResults = {};
    
    for (const table of tablesToCheck) {
      try {
        const response = await fetch('/api/test-connection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sqlQuery: `SELECT * FROM ${table} LIMIT 1` }),
        });
        
        const result = await response.json();
        tableResults[table] = {
          status: response.ok ? 'accessible' : 'error',
          message: result.error || 'Table accessible'
        };
      } catch (err) {
        tableResults[table] = {
          status: 'error',
          message: err.message
        };
      }
    }
    
    setTestResults(prev => ({
      ...prev,
      databaseTables: tableResults
    }));
    
    setLoading(false);  };

  const testEmailVerification = async () => {
    setLoading(true);
    
    try {
      // Test job seeker registration with a unique email
      const timestamp = Date.now();
      const testData = {
        email: `testverification.${timestamp}@example.com`,
        password: 'testpassword123',
        user_type: 'job-seeker',
        first_name: 'Test',
        last_name: 'EmailUser',
        phone: '09123456789',
        nationality_id: nationalities[0]?.nationality_id || 1,
        city_name: 'Test City',
        premise_name: 'Test House'
      };
      
      console.log('Testing email verification with data:', testData);
      
      const response = await fetch('/api/auth/register-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      if (response.ok) {
        const result = await response.json();
        setTestResults(prev => ({
          ...prev,
          emailVerification: {
            status: 'success',
            message: 'Registration successful! Check console for email logs.',
            data: result
          }
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        emailVerification: {
          status: 'error',
          message: err.message
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Registration System Test</h1>
            <Link 
              href="/app-login/register" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Registration
            </Link>
          </div>

          <div className="space-y-6">
            {/* Nationalities API Test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Nationalities API Test</h2>
                <button
                  onClick={testNationalitiesAPI}
                  disabled={loading}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test API'}
                </button>
              </div>
              
              {testResults.nationalitiesAPI && (
                <div className={`p-3 rounded ${
                  testResults.nationalitiesAPI.status === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`font-medium ${
                    testResults.nationalitiesAPI.status === 'success' 
                      ? 'text-green-800' 
                      : 'text-red-800'
                  }`}>
                    {testResults.nationalitiesAPI.message}
                  </p>
                  {testResults.nationalitiesAPI.data && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Sample nationalities:</p>
                      <ul className="text-sm text-gray-700 mt-1">
                        {testResults.nationalitiesAPI.data.map(nat => (
                          <li key={nat.nationality_id}>
                            {nat.nationality_id}: {nat.nationality_name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}            </div>

            {/* Email Verification Test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Email Verification Test</h2>
                <button
                  onClick={testEmailVerification}
                  disabled={loading}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Email Verification'}
                </button>
              </div>
              
              {testResults.emailVerification && (
                <div className={`p-3 rounded ${
                  testResults.emailVerification.status === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`font-medium ${
                    testResults.emailVerification.status === 'success' 
                      ? 'text-green-800' 
                      : 'text-red-800'
                  }`}>
                    {testResults.emailVerification.message}
                  </p>
                  {testResults.emailVerification.data && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Response:</p>
                      <pre className="text-xs text-gray-700 mt-1 bg-gray-100 p-2 rounded">
                        {JSON.stringify(testResults.emailVerification.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This test creates a job seeker account and sends a verification email. 
                  Check the server console for email logs since we're using a test SMTP configuration.
                </p>
              </div>
            </div>

            {/* Registration API Tests */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Registration API Tests</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['job-seeker', 'employee', 'company'].map(userType => (
                  <div key={userType} className="border border-gray-100 rounded p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium capitalize">{userType.replace('-', ' ')}</h3>
                      <button
                        onClick={() => testRegistrationAPI(userType)}
                        disabled={loading || nationalities.length === 0}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Test
                      </button>
                    </div>
                    
                    {testResults[`${userType}Registration`] && (
                      <div className={`p-2 rounded text-xs ${
                        testResults[`${userType}Registration`].status === 'success' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        <p className="font-medium">
                          Status: {testResults[`${userType}Registration`].statusCode || 'N/A'}
                        </p>
                        <p>{testResults[`${userType}Registration`].message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {nationalities.length === 0 && (
                <p className="text-yellow-600 text-sm mt-2">
                  ⚠️ Load nationalities first before testing registrations
                </p>
              )}
            </div>

            {/* Database Tables Test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Database Tables Test</h2>
                <button
                  onClick={testDatabaseTables}
                  disabled={loading}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Tables'}
                </button>
              </div>
              
              {testResults.databaseTables && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(testResults.databaseTables).map(([table, result]) => (
                    <div key={table} className={`p-2 rounded text-xs ${
                      result.status === 'accessible' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className="font-medium">{table}</p>
                      <p className={result.status === 'accessible' ? 'text-green-700' : 'text-red-700'}>
                        {result.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Status */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Current Status</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-700">✅ Fixed Issues:</h3>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    <li>• Nationality dropdown loading</li>
                    <li>• Address fields for all user types</li>
                    <li>• Database schema compliance</li>
                    <li>• Required field validation</li>
                    <li>• Company registration option</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">📝 Features:</h3>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    <li>• Job Seeker registration</li>
                    <li>• Employee registration</li>
                    <li>• Company registration</li>
                    <li>• Address management</li>
                    <li>• Input validation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
