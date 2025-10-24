import { supabase } from '@/lib/supabase';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔑 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlValid: supabaseUrl && !supabaseUrl.includes('placeholder'),
      keyValid: supabaseKey && !supabaseKey.includes('placeholder')
    });
    
    // Test 2: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Auth check:', { 
      authenticated: !!user, 
      userId: user?.id,
      error: authError?.message 
    });
    
    // Test 3: Check storage access
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    console.log('📦 Storage check:', { 
      bucketsCount: buckets?.length || 0,
      bucketNames: buckets?.map(b => b.name) || [],
      error: storageError?.message 
    });
    
    // Test 4: Check specific bucket
    if (buckets) {
      const avatarsBucket = buckets.find(b => b.name === 'avatars');
      console.log('🎯 Avatars bucket check:', {
        exists: !!avatarsBucket,
        public: avatarsBucket?.public,
        id: avatarsBucket?.id
      });
    }
    
    return {
      success: !authError && !storageError,
      user: !!user,
      bucketsCount: buckets?.length || 0,
      avatarsExists: buckets?.some(b => b.name === 'avatars') || false
    };
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
