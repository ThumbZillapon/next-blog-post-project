import axios from "axios";
import { supabase } from "../lib/supabase";

function jwtInterceptor() {
  axios.interceptors.request.use(async (req) => {
    try {
      // Get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        req.headers = {
          ...req.headers,
          Authorization: `Bearer ${session.access_token}`,
        };
      }
    } catch (error) {
      console.error('JWT Interceptor: Error getting session:', error);
    }

    return req;
  });

  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      console.log('JWT Interceptor: API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        error: error.response?.data
      });
      
      if (
        error.response &&
        error.response.status === 401 &&
        error.response.data?.error?.includes("Unauthorized")
      ) {
        console.log('JWT Interceptor: 401 Unauthorized detected, but not redirecting to avoid breaking admin pages');
        // Temporarily disabled redirect to fix admin page access issues
        // window.localStorage.removeItem("token");
        // window.location.replace("/");
      }
      return Promise.reject(error);
    }
  );
}

export default jwtInterceptor;
