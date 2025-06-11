'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);

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
        error: error.message || 'Failed to fetch table data',
        message: 'Table data fetch failed!'
      });
    } finally {
      setTableLoading(false);
    }
  };

  const handleTableChange = (e) => {
    const tableName = e.target.value;
    setSelectedTable(tableName);
    if (tableName) {
      fetchTableData(tableName);
    } else {
      setTableData(null);
    }
  };

  const renderDataTable = (data, title) => {
    if (!data || !data.data || data.data.length === 0) {
      return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No data available</p>
        </div>
      );
    }

    const rows = data.data;
    const columns = Object.keys(rows[0]);

    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-800 mb-3">{title}</h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row[column] !== null ? String(row[column]) : 'NULL'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Showing {rows.length} rows
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Connection</h1>
          <p className="text-gray-600">View and explore database tables and data</p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Connection Status</h2>
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Refresh Connection'}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Testing database connection...</span>
            </div>
          ) : connectionStatus ? (
            <div className={`p-4 rounded-lg ${connectionStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${connectionStatus.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`font-medium ${connectionStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                  {connectionStatus.message}
                </span>
              </div>
              {connectionStatus.data && (
                <div className="text-sm text-gray-600 mt-2">
                  <p><span className="font-medium">Database:</span> {connectionStatus.data.database_version}</p>
                  <p><span className="font-medium">Connection Type:</span> {connectionStatus.data.connection_type}</p>
                  <p><span className="font-medium">Time:</span> {new Date(connectionStatus.data.current_time).toLocaleString()}</p>
                </div>
              )}
              {connectionStatus.error && (
                <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded mt-2">
                  {connectionStatus.error}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Table Explorer */}
        {connectionStatus?.success && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Table Explorer</h2>
            
            <div className="mb-6">
              <label htmlFor="table-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select a table to view:
              </label>
              <select
                id="table-select"
                value={selectedTable}
                onChange={handleTableChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select a table --</option>
                {tables.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </div>

            {selectedTable && (
              <div>
                {tableLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading table data...</span>
                  </div>
                ) : tableData ? (
                  tableData.success ? (
                    renderDataTable(tableData, `${selectedTable} Data`)
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
          </div>
        )}

        {/* Error Display */}
        {error && !connectionStatus?.error && !tableData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <h3 className="font-medium text-red-800 mb-2">Error</h3>
            <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded">
              {error}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/test-connection"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Go to Advanced Test Connection
          </Link>
        </div>
      </div>
    </div>
  );
}


