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

  const navigate = useNavigate();

  // Fetch user details using Supabase
  const fetchUser = async () => {
    try {
      setState((prevState) => ({ ...prevState, getUserLoading: true }));
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }
      
      setState((prevState) => ({
        ...prevState,
        user: {
          ...user,
          role: user?.user_metadata?.role || 'user', // Default to 'user' if no role is set
          name: user?.user_metadata?.name || user?.email?.split('@')[0],
          username: user?.user_metadata?.username || user?.email?.split('@')[0],
          profilePic: user?.user_metadata?.profilePic || null,
        },
        getUserLoading: false,
      }));
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        error: error.message,
        user: null,
        getUserLoading: false,
      }));
    }
  };

  useEffect(() => {
    fetchUser(); // Load user on initial app load
  }, []);

  // Login user
  const login = async (data) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY || 
          import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        throw new Error('Database error granting user: Supabase is not properly configured. Please check your environment variables.');
      }
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      setState((prevState) => ({ ...prevState, loading: false, error: null }));
      navigate("/");
      await fetchUser();
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = "Login failed";
      const message = error?.message || "";
      
      // Log the full error for debugging
      console.error('Full error object:', error);
      
      if (message.includes('Database error granting user')) {
        errorMessage = "Database error granting user: This might be due to database triggers, RLS policies, or missing tables. Check your Supabase dashboard.";
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
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY || 
          import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        throw new Error('Database error saving new user: Supabase is not properly configured. Please check your environment variables.');
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
      if (message.includes('Database error saving new user')) {
        errorMessage = "Database error saving new user: This might be due to database triggers, RLS policies, or missing tables. Check your Supabase dashboard.";
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
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setState({ user: null, error: null, loading: null });
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
