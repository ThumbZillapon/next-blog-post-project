export const checkEnvironment = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const issues = [];
  const recommendations = [];
  
  // Check if environment variables exist
  if (!supabaseUrl) {
    issues.push('VITE_SUPABASE_URL is not set');
    recommendations.push('Add VITE_SUPABASE_URL to your .env file');
  }
  
  if (!supabaseKey) {
    issues.push('VITE_SUPABASE_ANON_KEY is not set');
    recommendations.push('Add VITE_SUPABASE_ANON_KEY to your .env file');
  }
  
  // Check if they're placeholder values
  if (supabaseUrl && (supabaseUrl.includes('placeholder') || supabaseUrl === 'your_supabase_project_url_here')) {
    issues.push('VITE_SUPABASE_URL appears to be a placeholder value');
    recommendations.push('Replace with your actual Supabase project URL');
  }
  
  if (supabaseKey && (supabaseKey.includes('placeholder') || supabaseKey === 'your_anon_key_here')) {
    issues.push('VITE_SUPABASE_ANON_KEY appears to be a placeholder value');
    recommendations.push('Replace with your actual Supabase anon key');
  }
  
  // Check URL format
  if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
    issues.push('VITE_SUPABASE_URL does not appear to be a valid Supabase URL');
    recommendations.push('Ensure the URL follows the format: https://your-project.supabase.co');
  }
  
  return {
    hasIssues: issues.length > 0,
    issues,
    recommendations,
    environment: {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlValid: supabaseUrl && !supabaseUrl.includes('placeholder'),
      keyValid: supabaseKey && !supabaseKey.includes('placeholder'),
      urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not set'
    }
  };
};
