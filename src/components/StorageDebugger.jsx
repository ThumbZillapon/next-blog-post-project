import { useState } from 'react';
import { checkAvatarsBucket } from '@/utils/supabaseStorage';
import { supabase } from '@/lib/supabase';
import { checkEnvironment } from '@/utils/environmentCheck';

export default function StorageDebugger() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      console.log('🔍 Running detailed storage diagnostics...');
      
      // Check environment variables
      const envCheck = checkEnvironment();
      console.log('🔑 Environment check:', envCheck);
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 User auth status:', { 
        user: !!user, 
        userId: user?.id,
        userEmail: user?.email,
        error: authError?.message 
      });
      
      // Check buckets with detailed error info
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      console.log('📦 Buckets list:', { 
        buckets, 
        error: listError,
        errorMessage: listError?.message,
        errorDetails: listError?.details,
        errorHint: listError?.hint
      });
      
      // Check specific bucket
      const bucketExists = await checkAvatarsBucket();
      console.log('✅ Bucket check result:', bucketExists);
      
      // Try to access storage directly
      const { data: testData, error: testError } = await supabase.storage.from('avatars').list();
      console.log('🧪 Direct bucket access test:', { testData, testError });
      
      setDebugInfo({
        environment: envCheck,
        authenticated: !!user,
        authError: authError?.message,
        userId: user?.id,
        userEmail: user?.email,
        bucketsCount: buckets?.length || 0,
        bucketNames: buckets?.map(b => b.name) || [],
        avatarsBucketExists: bucketExists,
        listError: listError?.message,
        listErrorDetails: listError?.details,
        listErrorHint: listError?.hint,
        directAccessTest: {
          success: !testError,
          error: testError?.message,
          data: testData
        }
      });
      
    } catch (error) {
      console.error('❌ Diagnostic error:', error);
      setDebugInfo({
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Storage Debugger</h3>
      
      <button 
        onClick={runDiagnostics}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run Diagnostics'}
      </button>
      
      {debugInfo && (
        <div className="mt-4 p-4 bg-white rounded border">
          <h4 className="font-semibold mb-2">Debug Results:</h4>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Run Diagnostics"</li>
          <li>Check the browser console for detailed logs</li>
          <li>Look at the debug results above</li>
          <li>Make sure you're logged in to the app</li>
        </ol>
        
        {debugInfo && debugInfo.bucketsCount === 0 && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
            <p className="font-semibold text-yellow-800">⚠️ No buckets found!</p>
            <p className="text-yellow-700">This could mean:</p>
            <ul className="list-disc list-inside text-yellow-700 mt-2">
              <li>You're connected to the wrong Supabase project</li>
              <li>The bucket wasn't created successfully</li>
              <li>There are permission issues</li>
              <li>Environment variables are incorrect</li>
            </ul>
            <p className="text-yellow-700 mt-2">Check the detailed debug info above for more clues.</p>
          </div>
        )}
        
        {debugInfo && debugInfo.environment && debugInfo.environment.hasIssues && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded">
            <p className="font-semibold text-red-800">❌ Environment Issues Found!</p>
            <ul className="list-disc list-inside text-red-700 mt-2">
              {debugInfo.environment.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
            <div className="mt-2">
              <p className="font-semibold text-red-800">Recommendations:</p>
              <ul className="list-disc list-inside text-red-700">
                {debugInfo.environment.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
