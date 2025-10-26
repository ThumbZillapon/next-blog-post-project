/* eslint-disable react/prop-types */
import { Navigate } from "react-router-dom";
import { LoadingScreen } from "../WebSection";
import { useAuth } from "@/contexts/authentication";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

function ProtectedRoute({
  isLoading,
  isAuthenticated,
  userRole,
  requiredRole,
  children,
}) {
  const { state } = useAuth();
  const [dbRole, setDbRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  
  console.log('ProtectedRoute render:', { 
    isLoading, 
    isAuthenticated, 
    userRole, 
    dbRole,
    requiredRole,
    userId: state.user?.id,
    authMetadataRole: state.user?.user_metadata?.role
  });

  // Fetch role directly from database for admin routes
  useEffect(() => {
    const fetchRoleFromDB = async () => {
      if (requiredRole === "admin" && isAuthenticated && state.user?.id && !dbRole) {
        setRoleLoading(true);
        try {
          console.log('ProtectedRoute: Fetching role from database for user:', state.user.id);
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', state.user.id)
            .single();
          
          if (error) {
            console.error('ProtectedRoute: Error fetching role from DB:', error);
            // If user doesn't exist in users table, try to get role from auth metadata
            const authRole = state.user?.user_metadata?.role || 'user';
            console.log('ProtectedRoute: Using auth metadata role:', authRole);
            setDbRole(authRole);
          } else {
            console.log('ProtectedRoute: Role from DB:', userData?.role);
            setDbRole(userData?.role || 'user');
          }
        } catch (error) {
          console.error('ProtectedRoute: Exception fetching role:', error);
          // Fallback to auth metadata role
          const authRole = state.user?.user_metadata?.role || 'user';
          console.log('ProtectedRoute: Fallback to auth metadata role:', authRole);
          setDbRole(authRole);
        } finally {
          setRoleLoading(false);
        }
      }
    };

    fetchRoleFromDB();
  }, [requiredRole, isAuthenticated, state.user?.id, dbRole]);

  if (isLoading === null || isLoading) {
    // Loading state or no data yet
    console.log('ProtectedRoute: Loading state');
    return (
      <div className="flex flex-col min-h-screen">
        <div className="min-h-screen md:p-8">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Return null while navigate performs the redirection
    console.log('ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // For admin routes, show loading while fetching role from database
  if (requiredRole === "admin" && (roleLoading || dbRole === null)) {
    console.log('ProtectedRoute: Admin role check - fetching role from DB, showing loading');
    return (
      <div className="flex flex-col min-h-screen">
        <div className="min-h-screen md:p-8">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  // For admin routes, check the database role
  if (requiredRole === "admin" && dbRole !== "admin") {
    console.log('ProtectedRoute: Admin role check - dbRole is not admin:', dbRole, 'redirecting to /');
    console.log('ProtectedRoute: User details:', { 
      userId: state.user?.id, 
      userRole: state.user?.role, 
      dbRole, 
      authMetadataRole: state.user?.user_metadata?.role 
    });
    return <Navigate to="/" replace />;
  }

  // For non-admin routes, use the prop role
  if (requiredRole !== "admin" && userRole !== requiredRole) {
    console.log('ProtectedRoute: Role check - userRole is not', requiredRole, ':', userRole, 'redirecting to /');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: Access granted - dbRole:', dbRole, 'userRole:', userRole, 'requiredRole:', requiredRole);

  // User is authenticated and has the correct role
  return children;
}

export default ProtectedRoute;
