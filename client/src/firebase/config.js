import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCUwZHS4FIl8Ktvh27FfmJad_Gy20A7Ais",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "syllabix-6dca3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "syllabix-6dca3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "syllabix-6dca3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "150132602449",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:150132602449:web:7613cff0c4dfabee646a70",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
