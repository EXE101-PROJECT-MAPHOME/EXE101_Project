import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAjntNiT1tJQ6e6oFU0dKZheHX3Z0UclUg",
  authDomain: "maphome-auth.firebaseapp.com",
  projectId: "maphome-auth",
  storageBucket: "maphome-auth.firebasestorage.app",
  messagingSenderId: "547200419613",
  appId: "1:547200419613:web:d2c4fd5d7b7ce23bfd43f4",
  measurementId: "G-WTZL7QW6BK"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
