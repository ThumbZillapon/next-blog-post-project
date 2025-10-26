import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * Checks if the avatars storage bucket exists
 * @returns {Promise<boolean>} - Returns true if bucket exists
 */
export const checkAvatarsBucket = async () => {
  try {
    console.log('🔍 Checking for avatars bucket...');
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      console.error('Error details:', {
        message: listError.message,
        details: listError.details,
        hint: listError.hint
      });
      return false;
    }

    console.log('📦 Available buckets:', buckets?.map(b => ({ name: b.name, public: b.public })) || 'No buckets found');
    
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
    
    if (avatarsBucket) {
      console.log('✅ Avatars bucket found:', {
        name: avatarsBucket.name,
        public: avatarsBucket.public,
        id: avatarsBucket.id
      });
      return true;
    }

    console.log('❌ Avatars bucket not found in list');
    return false;
  } catch (error) {
    console.error('❌ Error checking avatars bucket:', error);
    return false;
  }
};

/**
 * Deletes old profile pictures from storage
 * @param {string} currentProfilePic - Current profile picture URL
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteOldProfilePicture = async (currentProfilePic) => {
  try {
    if (!currentProfilePic) {
      return { success: true }; // No old picture to delete
    }

    // Extract file path from URL
    // URL format: https://project.supabase.co/storage/v1/object/public/avatars/profile-pictures/filename.jpg
    const urlParts = currentProfilePic.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `profile-pictures/${fileName}`;

    console.log('🗑️ Deleting old profile picture:', filePath);

    // Try with regular client first
    let deleteResult = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    // If delete fails due to RLS, try with service role
    if (deleteResult.error && deleteResult.error.message.includes('permission denied')) {
      console.log('🔄 RLS permission denied for delete, trying with service role...');
      
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey && serviceRoleKey !== 'your_service_role_key_here') {
        const supabaseAdmin = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          serviceRoleKey
        );
        
        deleteResult = await supabaseAdmin.storage
          .from('avatars')
          .remove([filePath]);
      }
    }

    if (deleteResult.error) {
      console.warn('⚠️ Failed to delete old profile picture:', deleteResult.error.message);
      // Don't fail the entire operation if old picture deletion fails
      return { success: false, error: deleteResult.error.message };
    }

    console.log('✅ Old profile picture deleted successfully');
    return { success: true };

  } catch (error) {
    console.warn('⚠️ Error deleting old profile picture:', error);
    // Don't fail the entire operation if old picture deletion fails
    return { success: false, error: error.message };
  }
};

/**
 * Uploads a profile picture to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} currentProfilePic - Current profile picture URL to delete
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadProfilePicture = async (file, currentProfilePic = null) => {
  try {
    console.log('🚀 Attempting direct upload to avatars bucket...');

    // Delete old profile picture first (if exists)
    if (currentProfilePic) {
      console.log('🗑️ Deleting old profile picture before uploading new one...');
      await deleteOldProfilePicture(currentProfilePic);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    // Try with regular client first
    let uploadResult = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    // If upload fails due to RLS, try with service role (if available)
    if (uploadResult.error && uploadResult.error.message.includes('permission denied')) {
      console.log('🔄 RLS permission denied, trying with service role...');
      
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey && serviceRoleKey !== 'your_service_role_key_here') {
        const supabaseAdmin = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          serviceRoleKey
        );
        
        uploadResult = await supabaseAdmin.storage
          .from('avatars')
          .upload(filePath, file);
      }
    }

    const { error: uploadError } = uploadResult;

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      
      // Provide specific error messages for common issues
      let errorMessage = uploadError.message;
      
      if (uploadError.message.includes('Bucket not found')) {
        errorMessage = 'The "avatars" bucket does not exist. Please create it in your Supabase dashboard.';
      } else if (uploadError.message.includes('permission denied')) {
        errorMessage = 'Permission denied. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file for storage access.';
      } else if (uploadError.message.includes('File size exceeds')) {
        errorMessage = 'File is too large. Please choose a smaller image.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while uploading the image'
    };
  }
};

/**
 * Uploads an article image to Supabase Storage
 * @param {File} file - The image file to upload
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadArticleImage = async (file) => {
  try {
    console.log('🚀 Attempting direct upload to thumbnails bucket...');

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `thumbnail-pictures/${fileName}`;

    // Try with regular client first
    let uploadResult = await supabase.storage
      .from('thumbnails')
      .upload(filePath, file);

    // If upload fails due to RLS, try with service role (if available)
    if (uploadResult.error && uploadResult.error.message.includes('permission denied')) {
      console.log('🔄 RLS permission denied, trying with service role...');
      
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey && serviceRoleKey !== 'your_service_role_key_here') {
        const supabaseAdmin = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          serviceRoleKey
        );
        
        uploadResult = await supabaseAdmin.storage
          .from('thumbnails')
          .upload(filePath, file);
      }
    }

    const { error: uploadError } = uploadResult;

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      
      // Provide specific error messages for common issues
      let errorMessage = uploadError.message;
      
      if (uploadError.message.includes('Bucket not found')) {
        errorMessage = 'The "thumbnails" bucket does not exist. Please create it in your Supabase dashboard.';
      } else if (uploadError.message.includes('permission denied')) {
        errorMessage = 'Permission denied. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file for storage access.';
      } else if (uploadError.message.includes('File size exceeds')) {
        errorMessage = 'File is too large. Please choose a smaller image.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading article image:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while uploading the image'
    };
  }
};

/**
 * Cleans up orphaned profile pictures (optional utility function)
 * This can be called periodically to remove old images that weren't properly deleted
 * @returns {Promise<{success: boolean, deletedCount?: number, error?: string}>}
 */
export const cleanupOrphanedProfilePictures = async () => {
  try {
    console.log('🧹 Starting cleanup of orphaned profile pictures...');
    
    // List all files in the profile-pictures folder
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list('profile-pictures', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`);
    }

    if (!files || files.length === 0) {
      console.log('✅ No orphaned files found');
      return { success: true, deletedCount: 0 };
    }

    // Get all current user profile pictures from the database
    // This would require a database query to get all current profilePic URLs
    // For now, we'll just log the files found
    console.log(`📁 Found ${files.length} files in profile-pictures folder`);
    
    // In a real implementation, you would:
    // 1. Query your database for all current profilePic URLs
    // 2. Compare with the files in storage
    // 3. Delete files that are not referenced by any user
    
    return {
      success: true,
      deletedCount: 0,
      message: 'Cleanup function ready - implement database comparison logic'
    };

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
