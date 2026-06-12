import { initializeApp, getApps, getApp } from "firebase/app";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (safely check if already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Analytics is only supported on the Web platform for standard Firebase JS SDK.
// On Android/iOS, we bypass it to prevent runtime crashes.
let analytics: any = null;
if (Platform.OS === 'web') {
  try {
    const { getAnalytics } = require('firebase/analytics');
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase Analytics failed to initialize:", error);
  }
}

export { app, analytics };
