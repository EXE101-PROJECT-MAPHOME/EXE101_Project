import axios from "axios";

const useLocalBackend = (import.meta as any).env?.VITE_USE_LOCAL_BACKEND === "true";
const localUrl = "http://localhost:5000";
const deployedUrl = (import.meta as any).env?.VITE_API_BASE || "https://exe101project-maphome-api.up.railway.app";

export const API_BASE = useLocalBackend ? localUrl : deployedUrl;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Crucial for sending/receiving cookies
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle Global Errors & Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to get a new access token using the refresh token cookie
        const res = await axios.get(`${API_BASE}/api/auth/refresh`, {
          withCredentials: true,
        });

        if (res.status === 200) {
          const { token } = res.data;
          localStorage.setItem("token", token);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("auth");
        // Redirect logic can be added here or handled by AuthContext
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
