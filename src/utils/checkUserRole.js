import { supabase } from "../lib/supabase";

export const checkUserRole = async (userId) => {
  try {
    console.log('Checking user role for ID:', userId);
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('role, name, username, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return { success: false, error: error.message };
    }

    console.log('User role data:', userData);
    return { success: true, data: userData };
  } catch (error) {
    console.error('Exception in checkUserRole:', error);
    return { success: false, error: error.message };
  }
};

// Function to set user role (for testing)
export const setUserRole = async (userId, role) => {
  try {
    console.log('Setting user role:', { userId, role });
    
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error setting user role:', error);
      return { success: false, error: error.message };
    }

    console.log('User role updated:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception in setUserRole:', error);
    return { success: false, error: error.message };
  }
};
