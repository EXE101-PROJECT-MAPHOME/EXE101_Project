import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import api from "@/app/utils/api";
import { toast } from "sonner";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "landlord" | "user";
  phone?: string;
  fullName?: string;
  avatar?: string; // user profile picture URL
  verificationLevel?: number;
  createdAt?: string;

  // Personalized settings
  searchPreferences?: {
    districts: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
  privacySettings?: {
    showPhoneBeforeBooking: boolean;
  };
  security?: {
    twoFactorEnabled: boolean;
    loginHistory: {
      device: string;
      ip: string;
      browser: string;
      os: string;
      lastLogin: string;
    }[];
  };
}

interface AuthContextType {
  user: User | null;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; role?: string; message?: string }>;
  googleLogin: (
    tokens: { idToken?: string; accessToken?: string; role?: string },
  ) => Promise<{ success: boolean; role?: string; message?: string }>;
  register: (
    data: RegisterData,
  ) => Promise<{ success: boolean; message?: string }>;

  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  fullName: string;
  phone: string;
  role: "landlord" | "user" | "admin";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Note: mock demo accounts removed — prefer backend authentication.

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("auth");
    return stored ? JSON.parse(stored) : null;
  });

  // Check for token on mount and fetch profile
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token && !user) {
        try {
          const res = await api.get("/api/auth/me");
          if (res.status === 200) {
            setUser(res.data);
            localStorage.setItem("auth", JSON.stringify(res.data));
          } else {
            // Token expired or invalid
            localStorage.removeItem("token");
            localStorage.removeItem("auth");
            setUser(null);
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          // If 401, interceptor already handles it, but we should clear local state too
          localStorage.removeItem("token");
          localStorage.removeItem("auth");
          setUser(null);
        }
      }
    };
    checkAuth();
  }, [user]);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post("/api/auth/login", { usernameOrEmail: username, password });
      const payload = res.data;
      
      if (payload.user) {
        setUser(payload.user);
        localStorage.setItem("auth", JSON.stringify(payload.user));
      }
      if (payload.token) {
        localStorage.setItem("token", payload.token);
      }
      return { success: true, role: payload.user?.role };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || "Lỗi kết nối máy chủ" };
    }
  };

  const googleLogin = async (tokens: {
    idToken?: string;
    accessToken?: string;
    role?: string;
  }) => {
    try {
      const res = await api.post("/api/auth/google", tokens);
      const payload = res.data;
      
      if (payload.user) {
        setUser(payload.user);
        localStorage.setItem("auth", JSON.stringify(payload.user));
      }
      if (payload.token) {
        localStorage.setItem("token", payload.token);
      }
      return { success: true, role: payload.user?.role };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || "Lỗi kết nối máy chủ" };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await api.post("/api/auth/register", {
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword || data.password,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
      });

      if (res.status === 200 || res.status === 201) {
        const payload = res.data;
        if (payload.user) {
          setUser(payload.user);
          localStorage.setItem("auth", JSON.stringify(payload.user));
        }
        if (payload.token) {
          localStorage.setItem("token", payload.token);
        }
        return { success: true };
      }
      return { success: false, message: "Đăng ký thất bại" };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || "Lỗi kết nối máy chủ" };
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser(null);
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
    toast.success("Đăng xuất thành công!");
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem("auth", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        googleLogin,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
