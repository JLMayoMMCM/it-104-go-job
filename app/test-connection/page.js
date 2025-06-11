'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Database structure information derived from SQL schema
const TABLE_METADATA = {
  'nationality': {
    description: 'Stores different nationalities',
    keyFields: ['nationality_id'],
    relationshipDescription: 'Referenced by person table',
    category: 'Reference Data'
  },
  'address': {
    description: 'Stores addresses for employees, job seekers, and companies',
    keyFields: ['address_id'],
    relationshipDescription: 'Referenced by person and company tables',
    category: 'Reference Data'
  },
  'person': {
    description: 'Stores personal information of employees and job seekers',
    keyFields: ['person_id'],
    relationshipDescription: 'References address and nationality; referenced by job_seeker and employee',
    category: 'User Data'
  },
  'person_resume': {
    description: 'Stores resume information for employees and job seekers',
    keyFields: ['person_id'],
    relationshipDescription: 'References person table',
    category: 'User Data'
  },
  'account_type': {
    description: 'Stores different types of accounts (e.g., Employer, Job Seeker)',
    keyFields: ['account_type_id'],
    relationshipDescription: 'Referenced by account table',
    category: 'Reference Data'
  },
  'account': {
    description: 'Stores user account information',
    keyFields: ['account_id'],
    relationshipDescription: 'References account_type; referenced by job_seeker and employee',
    category: 'User Data'
  },
  'notifications': {
    description: 'Stores notifications for users',
    keyFields: ['notification_id'],
    relationshipDescription: 'References account table',
    category: 'Communication'
  },
  'company': {
    description: 'Stores company information',
    keyFields: ['company_id'],
    relationshipDescription: 'References address; referenced by employee and job',
    category: 'Business Data'
  },
  'employee': {
    description: 'Stores employee information',
    keyFields: ['employee_id'],
    relationshipDescription: 'References person, account, and company tables',
    category: 'User Data'
  },
  'job_seeker': {
    description: 'Stores job seeker information',
    keyFields: ['job_seeker_id'],
    relationshipDescription: 'References person and account tables',
    category: 'User Data'
  },
  'job_type': {
    description: 'Stores different types of jobs',
    keyFields: ['job_type_id'],
    relationshipDescription: 'Referenced by job table',
    category: 'Reference Data'
  },
  'category_field': {
    description: 'Broad categories for organizing job categories',
    keyFields: ['category_field_id'],
    relationshipDescription: 'Referenced by job_category table',
    category: 'Reference Data'
  },
  'job_category': {
    description: 'Stores job categories with references to category fields',
    keyFields: ['job_category_id'],
    relationshipDescription: 'References category_field; referenced by job_category_list',
    category: 'Job Data'
  },
  'job': {
    description: 'Stores job information',
    keyFields: ['job_id'],
    relationshipDescription: 'References company and job_type; referenced by job_category_list',
    category: 'Job Data'
  },
  'job_category_list': {
    description: 'Links jobs with their categories',
    keyFields: ['job_id', 'job_category_id'],
    relationshipDescription: 'References job and job_category tables',
    category: 'Job Data'
  },
  'job_requests': {
    description: 'Stores applications from job seekers',
    keyFields: ['request_id'],
    relationshipDescription: 'References job and job_seeker tables',
    category: 'Job Applications'
  },
  'saved_jobs': {
    description: 'Stores jobs saved by job seekers',
    keyFields: ['saved_job_id'],
    relationshipDescription: 'References job and job_seeker tables',
    category: 'User Preferences'
  },
  'company_ratings': {
    description: 'Stores ratings given by job seekers to companies',
    keyFields: ['rating_id'],
    relationshipDescription: 'References company and job_seeker tables',
    category: 'User Feedback'
  },
  'followed_companies': {
    description: 'Stores companies followed by job seekers',
    keyFields: ['follow_id'],
    relationshipDescription: 'References company and job_seeker tables',
    category: 'User Preferences'
  }
};

// Group tables by their categories
const TABLE_CATEGORIES = {
  'Reference Data': 'Tables that store reference data like nationalities, account types, etc.',
  'User Data': 'Tables related to user information and profiles',
  'Business Data': 'Tables related to company information',
  'Job Data': 'Tables related to job listings and categories',
  'Job Applications': 'Tables related to job applications',
  'User Preferences': 'Tables storing user preferences and saved items',
  'User Feedback': 'Tables storing user ratings and reviews',
  'Communication': 'Tables related to notifications and messaging',
  'Other': 'Miscellaneous tables'
};

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customQuery, setCustomQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tables');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/test-connection');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setConnectionStatus(data);
      if (data.tables && data.tables.length > 0) {
        setTables(data.tables);
      }
    } catch (error) {
      setError(error.message || 'An error occurred while testing connection');
      setConnectionStatus({
        success: false,
        error: error.message || 'Failed to connect to API',
        message: 'Database connection test failed!'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName) => {
    if (!tableName) return;
    
    setTableLoading(true);
    setTableData(null);
    setError(null);
    
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sqlQuery: `SELECT * FROM ${tableName} LIMIT 50` }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setTableData(data);
    } catch (error) {
      setError(error.message || 'An error occurred while fetching table data');
      setTableData({
        success: false,
        error: error.message || 'Failed to fetch table data'
      });
    } finally {
      setTableLoading(false);
    }
  };

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) {
      setError('Please enter a SQL query');
      return;
    }
    
    setQueryLoading(true);
    setQueryResult(null);
    setError(null);
    
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sqlQuery: customQuery }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setQueryResult(data);
    } catch (error) {
      setError(error.message || 'An error occurred while executing query');
      setQueryResult({
        success: false,
        error: error.message || 'Failed to execute query'
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleTableChange = (e) => {
    const tableName = e.target.value;
    setSelectedTable(tableName);
    if (tableName) {
      fetchTableData(tableName);
    }
  };

  const getTableMetadata = (tableName) => {
    return TABLE_METADATA[tableName] || {
      description: 'No description available',
      keyFields: [],
      relationshipDescription: 'No relationship information available',
      category: 'Other'
    };
  };

  const getTablesForCategory = (category) => {
    if (category === 'All') return tables;
    return tables.filter(table => 
      (TABLE_METADATA[table]?.category || 'Other') === category
    );
  };

  const tablesByCategory = getTablesForCategory(selectedCategory);

  const renderDataTable = (data, title) => {
    if (!data || !data.data || data.data.length === 0) {
      return <p className="text-gray-600">No data found.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(data.data[0]).map((column, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.data.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {Object.values(row).map((value, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {value === null ? 
                      <span className="text-gray-400 italic">null</span> : 
                      typeof value === 'object' ? 
                        JSON.stringify(value) : 
                        String(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-sm text-gray-600">
          {data.rowCount} rows returned (limited to 50)
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-0">Database Connection Test</h1>
          <div className="flex gap-2">
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Refresh Connection'}
            </button>
            <Link href="/" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100">
              Back to Home
            </Link>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Connection Status</h2>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Testing connection...</span>
            </div>
          ) : connectionStatus ? (
            <div className={`p-4 rounded-lg ${connectionStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${connectionStatus.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`font-semibold ${connectionStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                  {connectionStatus.message}
                </span>
              </div>
              
              {connectionStatus.success && connectionStatus.connectionInfo && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Current Time</h3>
                    <p className="text-sm text-gray-600">{new Date(connectionStatus.connectionInfo.current_time).toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Database Version</h3>
                    <p className="text-sm text-gray-600">{connectionStatus.connectionInfo.database_version}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Tables Found</h3>
                    <p className="text-sm text-gray-600">{connectionStatus.tableCount} tables</p>
                  </div>
                </div>
              )}
              
              {connectionStatus.error && (
                <div className="mt-4">
                  <h3 className="font-medium text-red-700">Error Details</h3>
                  <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded mt-1">
                    {connectionStatus.error}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-600">No connection test performed yet.</div>
          )}
        </div>
        
        {connectionStatus?.success && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
            <div className="border-b border-gray-200 mb-6">
              <ul className="flex flex-wrap -mb-px">
                <li className="mr-2">
                  <button
                    className={`inline-block p-4 border-b-2 rounded-t-lg ${
                      activeTab === 'tables' 
                        ? 'text-blue-600 border-blue-600' 
                        : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('tables')}
                  >
                    Database Tables
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    className={`inline-block p-4 border-b-2 rounded-t-lg ${
                      activeTab === 'query' 
                        ? 'text-blue-600 border-blue-600' 
                        : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('query')}
                  >
                    Custom Query
                  </button>
                </li>
              </ul>
            </div>
            
            {activeTab === 'tables' && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Database Structure</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="categorySelect" className="block text-sm font-medium text-gray-700 mb-2">
                      Filter tables by category:
                    </label>
                    <select
                      id="categorySelect"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Categories</option>
                      {Object.keys(TABLE_CATEGORIES).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {selectedCategory !== 'All' && (
                      <p className="mt-2 text-sm text-gray-600">{TABLE_CATEGORIES[selectedCategory]}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {tablesByCategory.map((table) => {
                      const metadata = getTableMetadata(table);
                      return (
                        <div 
                          key={table} 
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          onClick={() => {
                            setSelectedTable(table);
                            fetchTableData(table);
                          }}
                        >
                          <h3 className="font-semibold text-blue-700 cursor-pointer hover:underline mb-2">{table}</h3>
                          <p className="text-sm text-gray-600 mb-2">{metadata.description}</p>
                          {metadata.keyFields.length > 0 && (
                            <p className="text-xs text-gray-500 mb-1">
                              <span className="font-medium">Key fields:</span> {metadata.keyFields.join(', ')}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Relationships:</span> {metadata.relationshipDescription}
                          </p>
                          <div className="mt-2">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              {metadata.category}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {selectedTable && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Table: <span className="text-blue-600">{selectedTable}</span>
                      </h2>
                      <div className="mt-2 md:mt-0">
                        <button
                          onClick={() => fetchTableData(selectedTable)}
                          disabled={tableLoading}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Refresh Data
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="font-medium text-gray-700 mb-2">Table Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Description:</span> {getTableMetadata(selectedTable).description}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Category:</span> {getTableMetadata(selectedTable).category}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Key Fields:</span> {getTableMetadata(selectedTable).keyFields.join(', ') || 'None'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Relationships:</span> {getTableMetadata(selectedTable).relationshipDescription}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {tableLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading table data...</span>
                      </div>
                    ) : tableData ? (
                      tableData.success ? (
                        renderDataTable(tableData, 'Table Data')
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h3 className="font-medium text-red-800 mb-2">Error Fetching Data</h3>
                          <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded">
                            {tableData.error}
                          </p>
                        </div>
                      )
                    ) : (
                      <p className="text-gray-600">Select a table to view its data.</p>
                    )}
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'query' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Custom SQL Query</h2>
                <div className="mb-4">
                  <textarea
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder="Enter a SQL query (SELECT only)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm h-40"
                  />
                </div>
                
                <div className="mb-6">
                  <button
                    onClick={executeCustomQuery}
                    disabled={queryLoading || !customQuery.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {queryLoading ? 'Executing...' : 'Execute Query'}
                  </button>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Note: Only SELECT queries are allowed for security reasons.</p>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-sm text-gray-700 font-medium">Example queries:</span>
                    {[
                      "SELECT * FROM job_category LIMIT 10",
                      "SELECT n.nationality_name, COUNT(p.person_id) FROM nationality n LEFT JOIN person p ON n.nationality_id = p.nationality_id GROUP BY n.nationality_name",
                      "SELECT c.company_name, j.job_name, j.job_description FROM job j JOIN company c ON j.company_id = c.company_id LIMIT 10",
                      "SELECT cf.category_field_name, COUNT(jc.job_category_id) as category_count FROM category_field cf JOIN job_category jc ON cf.category_field_id = jc.category_field_id GROUP BY cf.category_field_name"
                    ].map((query, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCustomQuery(query)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                      >
                        Example {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
                
                {queryLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Executing query...</span>
                  </div>
                ) : queryResult ? (
                  queryResult.success ? (
                    renderDataTable(queryResult, 'Query Results')
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-800 mb-2">Error Executing Query</h3>
                      <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded">
                        {queryResult.error}
                      </p>
                    </div>
                  )
                ) : null}
              </div>
            )}
          </div>
        )}
        
        {/* General Error Display */}
        {error && !connectionStatus?.error && !tableData?.error && !queryResult?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <h3 className="font-medium text-red-800 mb-2">Error</h3>
            <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
