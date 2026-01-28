import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (e) {
      console.error("Profile load failed:", e);
      setProfile(null);
    }
  };

  useEffect(() => {
    let resolved = false;

    const finishUnauthed = () => {
      if (resolved) return;
      resolved = true;
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setAuthError({ type: "auth_required" });
      setIsLoadingAuth(false);
    };

    const finishAuthed = async (session) => {
      if (resolved) return;
      resolved = true;
      setUser(session.user);
      setIsAuthenticated(true);
      setAuthError(null);
      await loadProfile(session.user.id);
      setIsLoadingAuth(false);
    };

    // 1️⃣ try initial session
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data?.session) {
          finishAuthed(data.session);
        } else {
          finishUnauthed();
        }
      })
      .catch((e) => {
        console.error("getSession failed:", e);
        finishUnauthed();
      });

    // 2️⃣ listen auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        finishAuthed(session);
      } else {
        finishUnauthed();
      }
    });

    // 3️⃣ HARD FAIL-SAFE (ANTI-SPINNER)
    setTimeout(() => {
      if (!resolved) {
        console.warn("Auth timeout fallback triggered");
        finishUnauthed();
      }
    }, 1000);

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setAuthError({ type: "auth_required" });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role,
        isAdmin: profile?.role === "admin",
        isAuthenticated,
        isLoadingAuth,
        authError,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
