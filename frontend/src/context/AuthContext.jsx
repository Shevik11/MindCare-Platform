import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { setUser(null); }
    }
  }, []);

  const setAuthState = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser ?? null);
    if (nextToken) localStorage.setItem("auth_token", nextToken); else localStorage.removeItem("auth_token");
    if (nextUser) localStorage.setItem("auth_user", JSON.stringify(nextUser)); else localStorage.removeItem("auth_user");
  };

  const login = async (credentials) => {
    const response = await axios.post("/api/auth/login", credentials);
    const { token: receivedToken, user: receivedUser } = response.data || {};
    setAuthState(receivedToken, receivedUser);
    return response.data;
  };

  const register = async (payload) => {
    const response = await axios.post("/api/auth/register", payload);
    const { token: receivedToken, user: receivedUser } = response.data || {};
    setAuthState(receivedToken, receivedUser);
    return response.data;
  };

  const logout = () => { setAuthState(null, null); };

  useEffect(() => {
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete axios.defaults.headers.common["Authorization"];
  }, [token]);

  const value = useMemo(() => ({ user, token, isAuthenticated: Boolean(token), login, register, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;


