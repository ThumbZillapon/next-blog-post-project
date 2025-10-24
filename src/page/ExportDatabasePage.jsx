import { useState } from 'react';
import { exportDatabase } from '../utils/exportDatabase';
import { Button } from '@/components/ui/button';

export default function ExportDatabasePage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSQL, setExportedSQL] = useState('');
  const [error, setError] = useState('');

  const runExport = async () => {
    setIsExporting(true);
    setError('');
    try {
      const sql = await exportDatabase.exportCompleteDatabase();
      setExportedSQL(sql);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportedSQL);
    alert('SQL copied to clipboard!');
  };

  const downloadSQL = () => {
    const blob = new Blob([exportedSQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database_export.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Export</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Export Database</h2>
          <p className="text-gray-600 mb-4">
            This will generate SQL to recreate your database with the same schema and data.
          </p>
          <Button 
            onClick={runExport} 
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isExporting ? 'Exporting...' : 'Export Database'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {exportedSQL && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Exported SQL</h2>
              <div className="space-x-2">
                <Button 
                  onClick={copyToClipboard}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Copy SQL
                </Button>
                <Button 
                  onClick={downloadSQL}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Download SQL
                </Button>
              </div>
            </div>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
              {exportedSQL}
            </pre>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Use This SQL</h3>
          <ol className="text-blue-700 space-y-2 list-decimal list-inside">
            <li>Copy the generated SQL</li>
            <li>Go to your new Supabase project</li>
            <li>Open the SQL Editor</li>
            <li>Paste and run the SQL</li>
            <li>This will recreate your database with the same structure and data</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
