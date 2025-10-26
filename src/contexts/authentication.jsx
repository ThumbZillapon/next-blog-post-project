/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const AuthContext = React.createContext();

function AuthProvider(props) {
  const [state, setState] = useState({
    loading: null,
    getUserLoading: null,
    error: null,
    user: null,
  });

  // Track if we've already fetched user data to prevent unnecessary re-fetches
  const [userFetched, setUserFetched] = useState(false);

  // Debug state changes
  useEffect(() => {
    console.log('Auth state changed:', { 
      loading: state.loading, 
      getUserLoading: state.getUserLoading, 
      isAuthenticated: Boolean(state.user),
      userRole: state.user?.role,
      userFetched
    });
  }, [state, userFetched]);

  const navigate = useNavigate();

  // Fetch user details using Supabase
  const fetchUser = async () => {
    try {
      setState((prevState) => ({ ...prevState, getUserLoading: true }));
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }

      if (!user) {
        setState((prevState) => ({
          ...prevState,
          user: null,
          getUserLoading: false,
        }));
        return null;
      }

      // Fetch user role from the users table
      console.log('Fetching user data from users table for user ID:', user.id);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, name, username, profile_pic')
        .eq('id', user.id)
        .single();

      console.log('Users table query result:', { userData, userError });

      let userWithRole;
      if (userError) {
        console.warn('Could not fetch user data from users table:', userError);
        // Fallback to auth user data if users table query fails
        userWithRole = {
          ...user,
          role: user?.user_metadata?.role || 'user',
          name: user?.user_metadata?.name || user?.email?.split('@')[0],
          username: user?.user_metadata?.username || user?.email?.split('@')[0],
          profilePic: user?.user_metadata?.profilePic || null,
        };
        console.log('Using fallback user data:', userWithRole);
      } else {
        userWithRole = {
          ...user,
          role: userData?.role || 'user',
          name: userData?.name || user?.user_metadata?.name || user?.email?.split('@')[0],
          username: userData?.username || user?.user_metadata?.username || user?.email?.split('@')[0],
          profilePic: userData?.profile_pic || user?.user_metadata?.profilePic || null,
        };
        console.log('Using users table data:', userWithRole);
      }
      
      setState((prevState) => ({
        ...prevState,
        user: userWithRole,
        getUserLoading: false,
      }));

      setUserFetched(true);
      console.log('User fetched with role:', userWithRole?.role);
      return userWithRole;
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        error: error.message,
        user: null,
        getUserLoading: false,
      }));
      return null;
    }
  };

  useEffect(() => {
    if (!userFetched) {
      console.log('Auth: Fetching user on mount');
      fetchUser(); // Load user on initial app load
    } else {
      console.log('Auth: User already fetched, skipping');
    }
  }, [userFetched]);

  // Login user
  const login = async (data) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'https://placeholder.supabase.co' ||
          supabaseUrl === '' ||
          supabaseKey === '' ||
          supabaseKey === 'your_anon_key_here') {
        console.error('Supabase configuration error:', {
          hasUrl: !!supabaseUrl,
          urlValue: supabaseUrl?.substring(0, 20) + '...',
          hasKey: !!supabaseKey,
          keyValue: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'missing'
        });
        throw new Error('Supabase is not properly configured. In Vercel, go to Settings > Environment Variables and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings.');
      }
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      setState((prevState) => ({ ...prevState, loading: false, error: null }));
      
      // Fetch user data to get role information from users table
      const userWithRole = await fetchUser();
      
      // Redirect based on user role from users table
      const userRole = userWithRole?.role || 'user';
      
      if (userRole === 'admin') {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = "Login failed";
      const message = error?.message || "";
      
      // Log the full error for debugging
      console.error('Full error object:', error);
      
      if (message.includes('Database error granting user') || message.includes('Supabase is not properly configured')) {
        errorMessage = message; // Use the actual error message
      } else if (message.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password.";
      } else if (message.includes('Email not confirmed')) {
        errorMessage = "Please check your email and confirm your account.";
      } else if (message.includes('over email rate limit')) {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (message.includes('Auth API is unreachable')) {
        errorMessage = "Auth service unreachable. Check network or Supabase URL.";
      } else if (message.includes('permission denied')) {
        errorMessage = "Permission denied: Check your database RLS policies and user permissions.";
      } else if (message.includes('relation') && message.includes('does not exist')) {
        errorMessage = "Database table missing: Please ensure all required tables exist in your Supabase database.";
      } else if (message) {
        errorMessage = message;
      }
      
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return { error: errorMessage };
    }
  };

  // Register user
  const register = async (data) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'https://placeholder.supabase.co' ||
          supabaseUrl === '' ||
          supabaseKey === '' ||
          supabaseKey === 'your_anon_key_here') {
        console.error('Supabase configuration error:', {
          hasUrl: !!supabaseUrl,
          urlValue: supabaseUrl?.substring(0, 20) + '...',
          hasKey: !!supabaseKey,
          keyValue: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'missing'
        });
        throw new Error('Supabase is not properly configured. In Vercel, go to Settings > Environment Variables and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings.');
      }

      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            username: data.username,
            role: 'user', // Set default role as 'user'
          },
          emailRedirectTo: `${siteUrl}/login`,
        }
      });

      if (authError) {
        throw authError;
      }

      // If email confirmation is required, the user may be null until confirmed
      if (!authData?.user) {
        setState((prevState) => ({ ...prevState, loading: false, error: null }));
        navigate("/sign-up/success");
        return;
      }

      // Ensure the user record in the users table has the correct role
      try {
        await supabase
          .from('users')
          .update({ role: 'user' })
          .eq('id', authData.user.id);
      } catch (updateError) {
        console.warn('Could not update user role in users table:', updateError);
        // This is not critical for registration, so we continue
      }

      setState((prevState) => ({ ...prevState, loading: false, error: null }));
      navigate("/sign-up/success");
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = "An error occurred during registration";
      const message = error?.message || error?.error_description || "";
      
      // Log the full error for debugging
      console.error('Full error object:', error);
      
      if (message) {
        errorMessage = message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      // Handle specific Supabase errors
      if (message.includes('Database error saving new user') || message.includes('Supabase is not properly configured')) {
        errorMessage = message; // Use the actual error message
      } else if (message.includes('User already registered')) {
        errorMessage = "An account with this email already exists.";
      } else if (message.includes('Password should be at least')) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (message.includes('Invalid email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (message.includes('duplicate key value')) {
        errorMessage = "Username or email already exists. Please try a different username or email.";
      } else if (message.includes('permission denied')) {
        errorMessage = "Permission denied: Check your database RLS policies and user permissions.";
      } else if (message.includes('relation') && message.includes('does not exist')) {
        errorMessage = "Database table missing: Please ensure all required tables exist in your Supabase database.";
      }
      
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return { error: errorMessage };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setState({ user: null, error: null, loading: null });
      setUserFetched(false);
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setState({ user: null, error: null, loading: null });
      setUserFetched(false);
      navigate("/");
    }
  };

  const isAuthenticated = Boolean(state.user);

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        logout,
        register,
        isAuthenticated,
        fetchUser,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

// Hook for consuming AuthContext
const useAuth = () => React.useContext(AuthContext);

export { AuthProvider, useAuth };
