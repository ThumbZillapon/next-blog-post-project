import { supabase } from '@/lib/supabase';

/**
 * Diagnostic tool to check Supabase Storage setup
 * @returns {Promise<{success: boolean, issues: string[], recommendations: string[]}>}
 */
export const diagnoseStorageSetup = async () => {
  const issues = [];
  const recommendations = [];

  try {
    // Check if we can access storage
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      issues.push(`Cannot access storage: ${listError.message}`);
      recommendations.push('Check your Supabase configuration and API keys');
      return { success: false, issues, recommendations };
    }

    // Check if avatars bucket exists
    const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars');
    
    if (!avatarsBucket) {
      issues.push('The "avatars" bucket does not exist');
      recommendations.push('Create a bucket named "avatars" in your Supabase dashboard');
      recommendations.push('Make sure the bucket is set to public');
    } else {
      // Check if bucket is public
      if (!avatarsBucket.public) {
        issues.push('The "avatars" bucket is not public');
        recommendations.push('Set the bucket to public in your Supabase dashboard');
      }
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      issues.push('User is not authenticated');
      recommendations.push('Make sure you are logged in to the application');
    }

    return {
      success: issues.length === 0,
      issues,
      recommendations
    };

  } catch (error) {
    issues.push(`Unexpected error: ${error.message}`);
    recommendations.push('Check your internet connection and Supabase configuration');
    
    return {
      success: false,
      issues,
      recommendations
    };
  }
};
