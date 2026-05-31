import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api";

export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
  role: "admin" | "landlord" | "user";
  phone?: string;
  fullName?: string;
  avatar?: string;
  createdAt?: string;
  favorites?: any[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    usernameOrEmail: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string; role?: string }>;
  googleLogin: (tokens: {
    accessToken?: string;
    idToken?: string;
    role?: string;
  }) => Promise<{ success: boolean; message?: string; role?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  toggleFavorite: (
    propertyId: string,
  ) => Promise<{
    success: boolean;
    action?: "added" | "removed";
    message?: string;
  }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAuth = await AsyncStorage.getItem("auth");
        const token = await AsyncStorage.getItem("token");
        if (storedAuth && token) {
          setUser(JSON.parse(storedAuth));
        }

        // Background verify profile to keep active profile info synced
        if (token) {
          const res = await api.get("/api/user/me");
          if (res.status === 200) {
            setUser(res.data);
            await AsyncStorage.setItem("auth", JSON.stringify(res.data));
          }
        }
      } catch (e: any) {
        // If the token is invalid or expired the API may return 401 — treat that as a normal unauthenticated state
        if (e?.response?.status === 401) {
          console.warn(
            "Auth token invalid or expired (401). Clearing stored auth.",
          );
        } else {
          console.error("Failed to initialize auth", e);
        }
        try {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("auth");
        } catch (clearErr) {
          console.warn("Error clearing auth storage", clearErr);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const res = await api.post("/api/auth/login", {
        usernameOrEmail,
        password,
      });
      const payload = res.data;
      if (payload.token) {
        await AsyncStorage.setItem("token", payload.token);
      }
      if (payload.user) {
        setUser(payload.user);
        await AsyncStorage.setItem("auth", JSON.stringify(payload.user));
      }
      return { success: true, role: payload.user?.role };
    } catch (err: any) {
      return {
        success: false,
        message:
          err.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại.",
      };
    }
  };

  const googleLogin = async (tokens: {
    accessToken?: string;
    idToken?: string;
    role?: string;
  }) => {
    try {
      const res = await api.post("/api/auth/google", tokens);
      const payload = res.data;
      if (payload.token) {
        await AsyncStorage.setItem("token", payload.token);
      }
      if (payload.user) {
        setUser(payload.user);
        await AsyncStorage.setItem("auth", JSON.stringify(payload.user));
      }
      return { success: true, role: payload.user?.role };
    } catch (err: any) {
      return {
        success: false,
        message:
          err.response?.data?.message ||
          "Đăng nhập Google thất bại. Vui lòng thử lại.",
      };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post("/api/auth/register", data);
      const payload = res.data;
      if (payload.token) {
        await AsyncStorage.setItem("token", payload.token);
      }
      if (payload.user) {
        setUser(payload.user);
        await AsyncStorage.setItem("auth", JSON.stringify(payload.user));
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message:
          err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout").catch(() => {});
    } catch (e) {}
    setUser(null);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("auth");
  };

  const updateUser = async (userData: User) => {
    setUser(userData);
    await AsyncStorage.setItem("auth", JSON.stringify(userData));
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      return { success: false, message: "Vui lòng đăng nhập để thực hiện." };
    }
    try {
      const res = await api.post("/api/user/me/favorites/toggle", {
        propertyId,
      });
      const updatedUser = { ...user, favorites: res.data.favorites };
      setUser(updatedUser);
      await AsyncStorage.setItem("auth", JSON.stringify(updatedUser));
      return { success: true, action: res.data.action };
    } catch (err: any) {
      console.error("Toggle favorite failed:", err);
      return {
        success: false,
        message:
          err.response?.data?.message ||
          "Không thể cập nhật danh sách yêu thích.",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        register,
        logout,
        updateUser,
        toggleFavorite,
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
