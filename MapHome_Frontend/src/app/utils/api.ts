const useLocalBackend = (import.meta as any).env?.DEV && (import.meta as any).env?.VITE_USE_LOCAL_BACKEND === "true";
const localUrl = "http://localhost:5000";
const deployedUrl = (import.meta as any).env?.VITE_API_BASE || "https://exe101-project.onrender.com";

export const API_BASE = useLocalBackend ? localUrl : deployedUrl;

const defaultLocalAiUrl = "http://localhost:8000";
const localAiUrl = (import.meta as any).env?.VITE_LOCAL_AI_URL || defaultLocalAiUrl;
const deployedAiUrl = (import.meta as any).env?.VITE_AI_URL || "https://maphome-chatbot.vercel.app";
export const AI_URL = useLocalBackend ? localAiUrl : deployedAiUrl;

let logoutCallback: (() => void) | null = null;
export const registerLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Simplified fetch wrapper replacing axios
const fetchWrapper = async (method: string, url: string, data?: any, config?: any) => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...config?.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  
  let options: RequestInit = {
    method,
    headers,
  };

  // For withCredentials equivalent
  options.credentials = "include";

  if (data) {
    options.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  try {
    let res = await fetch(fullUrl, options);

    // Basic interceptor logic for 401
    if (res.status === 401 && !config?._retry) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "GET",
          credentials: "include"
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem("token", refreshData.token);
          
          // Retry the original request
          headers["Authorization"] = `Bearer ${refreshData.token}`;
          options.headers = headers;
          res = await fetch(fullUrl, options);
        } else {
          throw new Error("Refresh failed");
        }
      } catch (err) {
        console.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("auth");
        if (logoutCallback) logoutCallback();
        return Promise.reject(err);
      }
    }

    const responseData = await res.json().catch(() => null);

    if (!res.ok) {
      return Promise.reject({
        response: {
          status: res.status,
          data: responseData
        },
        message: responseData?.message || res.statusText
      });
    }

    return {
      status: res.status,
      data: responseData
    };
  } catch (error) {
    return Promise.reject(error);
  }
};

const api = {
  get: (url: string, config?: any) => fetchWrapper("GET", url, undefined, config),
  post: (url: string, data?: any, config?: any) => fetchWrapper("POST", url, data, config),
  put: (url: string, data?: any, config?: any) => fetchWrapper("PUT", url, data, config),
  delete: (url: string, config?: any) => fetchWrapper("DELETE", url, undefined, config),
};

export default api;
