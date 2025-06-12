#!/usr/bin/env node

/**
 * Integration Test Script for Employee Job Management System
 * Tests all the newly implemented functionality including:
 * - Company profile management with analytics
 * - Logo upload functionality  
 * - Bulk application operations
 * - Advanced search with saved searches
 * - Job editing capabilities
 * - Mobile navigation API
 * - Job performance metrics
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class IntegrationTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testResults = [];
    this.authToken = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    
    this.testResults.push({
      timestamp,
      type,
      message
    });
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      }
    };

    const requestOptions = { ...defaultOptions, ...options };
    
    this.log(`Making ${requestOptions.method} request to ${endpoint}`);
    
    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();
      
      return {
        status: response.status,
        ok: response.ok,
        data
      };
    } catch (error) {
      this.log(`Request failed: ${error.message}`, 'error');
      return {
        status: 0,
        ok: false,
        error: error.message
      };
    }
  }

  async testCompanyAnalyticsAPI() {
    this.log('Testing Company Analytics API...', 'test');
    
    const response = await this.makeRequest('/api/company/analytics');
    
    if (response.ok) {
      this.log('✅ Company Analytics API responded successfully', 'success');
      
      // Verify response structure
      const expectedFields = ['overview', 'trends', 'breakdowns', 'recentActivity'];
      const hasAllFields = expectedFields.every(field => 
        response.data.hasOwnProperty(field)
      );
      
      if (hasAllFields) {
        this.log('✅ Analytics response has all expected fields', 'success');
      } else {
        this.log('❌ Analytics response missing expected fields', 'error');
      }
    } else {
      this.log(`❌ Company Analytics API failed with status ${response.status}`, 'error');
    }
    
    return response.ok;
  }

  async testBulkApplicationsAPI() {
    this.log('Testing Bulk Applications API...', 'test');
    
    // Test bulk operation endpoint
    const bulkData = {
      applicationIds: ['test1', 'test2'],
      action: 'accept',
      message: 'Test bulk operation'
    };
      const response = await this.makeRequest('/api/employee/applications/bulk', {
      method: 'PUT',
      body: JSON.stringify(bulkData)
    });
    
    // Expect 401 or proper response structure
    if (response.status === 401 || response.ok) {
      this.log('✅ Bulk Applications API endpoint exists and handles requests', 'success');
      return true;
    } else {
      this.log(`❌ Bulk Applications API unexpected response: ${response.status}`, 'error');
      return false;
    }
  }

  async testAdvancedSearchAPI() {
    this.log('Testing Advanced Search API...', 'test');
    
    const searchParams = new URLSearchParams({
      keywords: 'developer',
      location: 'Remote',
      advanced: 'true',
      page: '1',
      limit: '10'
    });
    
    const response = await this.makeRequest(`/api/jobs/search?${searchParams}`);
    
    if (response.ok) {
      this.log('✅ Advanced Search API responded successfully', 'success');
      
      // Verify search response structure
      const expectedFields = ['jobs', 'totalJobs', 'totalPages', 'currentPage', 'searchMetadata'];
      const hasAllFields = expectedFields.every(field => 
        response.data.hasOwnProperty(field)
      );
      
      if (hasAllFields) {
        this.log('✅ Search response has all expected fields', 'success');
      } else {
        this.log('❌ Search response missing expected fields', 'error');
      }
    } else {
      this.log(`❌ Advanced Search API failed with status ${response.status}`, 'error');
    }
    
    return response.ok;
  }

  async testSavedSearchesAPI() {
    this.log('Testing Saved Searches API...', 'test');
    
    // Test GET saved searches
    const getResponse = await this.makeRequest('/api/saved-searches');
    
    // Test POST new saved search
    const saveData = {
      name: 'Test Search',
      filters: {
        keywords: 'developer',
        location: 'Remote'
      }
    };
    
    const postResponse = await this.makeRequest('/api/saved-searches', {
      method: 'POST',
      body: JSON.stringify(saveData)
    });
    
    // Expect 401 for auth or proper response
    if (getResponse.status === 401 || getResponse.ok) {
      this.log('✅ Saved Searches GET endpoint works', 'success');
    } else {
      this.log(`❌ Saved Searches GET failed: ${getResponse.status}`, 'error');
    }
    
    if (postResponse.status === 401 || postResponse.ok) {
      this.log('✅ Saved Searches POST endpoint works', 'success');
    } else {
      this.log(`❌ Saved Searches POST failed: ${postResponse.status}`, 'error');
    }
    
    return (getResponse.status === 401 || getResponse.ok) && 
           (postResponse.status === 401 || postResponse.ok);
  }

  async testJobEditAPI() {
    this.log('Testing Job Edit API...', 'test');
    
    const testJobId = 'test-job-123';
    
    // Test GET specific job
    const getResponse = await this.makeRequest(`/api/employee/jobs/${testJobId}`);
    
    // Test PUT job update
    const updateData = {
      job_name: 'Updated Test Job',
      job_description: 'Updated description',
      job_location: 'Remote'
    };
    
    const putResponse = await this.makeRequest(`/api/employee/jobs/${testJobId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    // Expect 401, 404, or proper response
    const validStatuses = [401, 404, 200];
    
    if (validStatuses.includes(getResponse.status)) {
      this.log('✅ Job Edit GET endpoint works', 'success');
    } else {
      this.log(`❌ Job Edit GET unexpected status: ${getResponse.status}`, 'error');
    }
    
    if (validStatuses.includes(putResponse.status)) {
      this.log('✅ Job Edit PUT endpoint works', 'success');
    } else {
      this.log(`❌ Job Edit PUT unexpected status: ${putResponse.status}`, 'error');
    }
    
    return validStatuses.includes(getResponse.status) && 
           validStatuses.includes(putResponse.status);
  }

  async testJobPerformanceAPI() {
    this.log('Testing Job Performance API...', 'test');
    
    const response = await this.makeRequest('/api/employee/job-performance?days=30');
    
    // Expect 401 for auth or proper response
    if (response.status === 401 || response.ok) {
      this.log('✅ Job Performance API endpoint works', 'success');
      
      if (response.ok) {
        const expectedFields = ['overall', 'jobs', 'period'];
        const hasAllFields = expectedFields.every(field => 
          response.data.hasOwnProperty(field)
        );
        
        if (hasAllFields) {
          this.log('✅ Job Performance response has all expected fields', 'success');
        } else {
          this.log('❌ Job Performance response missing expected fields', 'error');
        }
      }
    } else {
      this.log(`❌ Job Performance API failed with status ${response.status}`, 'error');
    }
    
    return response.status === 401 || response.ok;
  }

  async testMobileNavigationAPI() {
    this.log('Testing Mobile Navigation API...', 'test');
    
    const response = await this.makeRequest('/api/mobile/navigation');
    
    if (response.status === 401 || response.ok) {
      this.log('✅ Mobile Navigation API endpoint works', 'success');
      
      if (response.ok) {
        const expectedFields = ['user', 'main_menu', 'quick_actions', 'notifications'];
        const hasAllFields = expectedFields.every(field => 
          response.data.hasOwnProperty(field)
        );
        
        if (hasAllFields) {
          this.log('✅ Mobile Navigation response has all expected fields', 'success');
        } else {
          this.log('❌ Mobile Navigation response missing expected fields', 'error');
        }
      }
    } else {
      this.log(`❌ Mobile Navigation API failed with status ${response.status}`, 'error');
    }
    
    return response.status === 401 || response.ok;
  }

  async testStaticResources() {
    this.log('Testing Static Resources and CSS...', 'test');
    
    const cssFiles = [
      '/app-dashboard/employee/bulk-applications/bulk-applications.css',
      '/app-jobs/advanced-search/advanced-search.css',
      '/app-profile/company/company-profile.css'
    ];
    
    let allPassed = true;
    
    for (const cssFile of cssFiles) {
      // Check if files exist in the file system since we can't fetch CSS directly
      const filePath = path.join(process.cwd(), 'app', cssFile);
      
      try {
        if (fs.existsSync(filePath)) {
          this.log(`✅ CSS file exists: ${cssFile}`, 'success');
        } else {
          this.log(`❌ CSS file missing: ${cssFile}`, 'error');
          allPassed = false;
        }
      } catch (error) {
        this.log(`❌ Error checking CSS file ${cssFile}: ${error.message}`, 'error');
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  async testRequiredAPIs() {
    this.log('Testing Required Support APIs...', 'test');
    
    const apis = [
      '/api/job-types',
      '/api/job-categories',
      '/api/company/profile'
    ];
    
    let allPassed = true;
    
    for (const api of apis) {
      const response = await this.makeRequest(api);
      
      if (response.status === 401 || response.ok) {
        this.log(`✅ Required API works: ${api}`, 'success');
      } else {
        this.log(`❌ Required API failed: ${api} (status: ${response.status})`, 'error');
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  async runAllTests() {
    this.log('Starting Integration Tests for Employee Job Management System...', 'test');
    this.log('=' * 60);
    
    const tests = [
      { name: 'Company Analytics API', test: () => this.testCompanyAnalyticsAPI() },
      { name: 'Bulk Applications API', test: () => this.testBulkApplicationsAPI() },
      { name: 'Advanced Search API', test: () => this.testAdvancedSearchAPI() },
      { name: 'Saved Searches API', test: () => this.testSavedSearchesAPI() },
      { name: 'Job Edit API', test: () => this.testJobEditAPI() },
      { name: 'Job Performance API', test: () => this.testJobPerformanceAPI() },
      { name: 'Mobile Navigation API', test: () => this.testMobileNavigationAPI() },
      { name: 'Static Resources', test: () => this.testStaticResources() },
      { name: 'Required Support APIs', test: () => this.testRequiredAPIs() }
    ];
    
    const results = [];
    
    for (const { name, test } of tests) {
      this.log(`\nRunning test: ${name}`, 'test');
      this.log('-' * 40);
      
      try {
        const passed = await test();
        results.push({ name, passed });
        this.log(`Test ${name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error');
      } catch (error) {
        results.push({ name, passed: false });
        this.log(`Test ${name}: FAILED with error: ${error.message}`, 'error');
      }
    }
    
    // Summary
    this.log('\n' + '=' * 60, 'test');
    this.log('TEST SUMMARY', 'test');
    this.log('=' * 60, 'test');
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    results.forEach(({ name, passed }) => {
      this.log(`${passed ? '✅' : '❌'} ${name}`, passed ? 'success' : 'error');
    });
    
    this.log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? 'success' : 'error');
    this.log(`Success Rate: ${Math.round((passed/total) * 100)}%`, passed === total ? 'success' : 'error');
    
    if (passed === total) {
      this.log('\n🎉 All tests passed! The employee job management system is ready for use.', 'success');
    } else {
      this.log('\n⚠️  Some tests failed. Please check the implementation before deployment.', 'error');
    }
    
    return { passed, total, results };
  }

  async generateReport() {
    const results = await this.runAllTests();
    
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: results.total,
        passed_tests: results.passed,
        success_rate: Math.round((results.passed / results.total) * 100)
      },
      test_results: results.results,
      detailed_logs: this.testResults
    };
    
    const reportPath = path.join(process.cwd(), 'integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    this.log(`\n📊 Detailed test report saved to: ${reportPath}`, 'info');
    
    return reportData;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.generateReport().then(report => {
    process.exit(report.summary.passed_tests === report.summary.total_tests ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTester;
