import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserProfile(uid, preferredRole = null, email = null) {
    // 1. Try fetching from Firestore
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.role) {
          localStorage.setItem(`educanvas_profile_${uid}`, JSON.stringify(data));
          if (email) localStorage.setItem(`educanvas_email_${email.toLowerCase()}`, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn("Firestore fetchUserProfile warning:", err.message);
    }

    // 2. Check localStorage cache by uid or email
    const cachedByUid = localStorage.getItem(`educanvas_profile_${uid}`);
    if (cachedByUid) {
      try {
        return JSON.parse(cachedByUid);
      } catch {}
    }

    if (email) {
      const cachedByEmail = localStorage.getItem(`educanvas_email_${email.toLowerCase()}`);
      if (cachedByEmail) {
        try {
          return JSON.parse(cachedByEmail);
        } catch {}
      }
    }

    // 3. Fallback profile
    const derivedRole = preferredRole || "teacher";
    const userEmail = email || auth.currentUser?.email || "";
    const fallbackProfile = {
      name: userEmail ? userEmail.split("@")[0] : "User",
      email: userEmail,
      role: derivedRole,
      college: "Global University",
    };

    localStorage.setItem(`educanvas_profile_${uid}`, JSON.stringify(fallbackProfile));
    if (userEmail) {
      localStorage.setItem(`educanvas_email_${userEmail.toLowerCase()}`, JSON.stringify(fallbackProfile));
    }

    return fallbackProfile;
  }

  async function register({ name, email, password, role, college }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile = {
      name,
      email,
      role: role || "student",
      college: college || "Global University",
      createdAt: serverTimestamp(),
    };

    // Cache locally immediately so the user can proceed regardless of Firestore rules status
    localStorage.setItem(`educanvas_profile_${cred.user.uid}`, JSON.stringify(profile));
    localStorage.setItem(`educanvas_email_${email.toLowerCase()}`, JSON.stringify(profile));
    setUserProfile(profile);

    // Attempt to persist in Firestore
    try {
      await setDoc(doc(db, "users", cred.user.uid), profile);
    } catch (firestoreErr) {
      console.warn("Firestore permission issue during registration (using local profile):", firestoreErr.message);
    }

    return cred.user;
  }

  async function login(email, password, preferredRole = null) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchUserProfile(cred.user.uid, preferredRole, email);
    setUserProfile(profile);
    return { user: cred.user, profile };
  }

  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await fetchUserProfile(user.uid, null, user.email);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
