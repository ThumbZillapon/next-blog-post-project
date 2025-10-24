import { useState } from 'react';
import { databaseDiagnostic } from '../utils/databaseDiagnostic';
import { Button } from '@/components/ui/button';

export default function DiagnosticPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const diagnosticResults = await databaseDiagnostic.runFullDiagnostic();
      setResults(diagnosticResults);
    } catch (error) {
      console.error('Diagnostic failed:', error);
      setResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Database Diagnostic</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Run Diagnostic</h2>
          <p className="text-gray-600 mb-4">
            This will test your Supabase connection, authentication, and database tables.
          </p>
          <Button 
            onClick={runDiagnostic} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Running...' : 'Run Diagnostic'}
          </Button>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Common Issues & Solutions</h3>
          <ul className="text-yellow-700 space-y-2">
            <li><strong>RLS Policies:</strong> Check if Row Level Security is blocking user operations</li>
            <li><strong>Missing Tables:</strong> Ensure required tables (users, posts, categories) exist</li>
            <li><strong>Database Triggers:</strong> Check for triggers that might be causing errors</li>
            <li><strong>Permissions:</strong> Verify that the anon key has proper permissions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
