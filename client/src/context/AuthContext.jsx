import { createContext, useEffect, useState, useCallback } from "react";
import * as authApi from "../api/auth.api.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // resolving the stored token

  // On boot, if a token exists, confirm it is still valid by loading /me.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .fetchMe()
      .then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await authApi.login(email, password);
    localStorage.setItem("token", token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.assign("/login");
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
