import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const useLocalBackend = process.env.EXPO_PUBLIC_USE_LOCAL_BACKEND === 'true';

// Default local URL based on platform emulator loopback defaults
const defaultLocalUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
const localUrl = process.env.EXPO_PUBLIC_LOCAL_API_URL || defaultLocalUrl;

const deployedUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://exe101-project.onrender.com';

const API_BASE = useLocalBackend ? localUrl : deployedUrl;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onUnauthorizedCallback: (() => void) | null = null;

export const registerOnUnauthorized = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Request Interceptor: Attach JWT Token from AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching token from AsyncStorage', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Global 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('auth');
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      } catch (e) {
        console.error('Error clearing auth storage', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
