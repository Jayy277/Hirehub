import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [loading, setLoading] = useState(true);

  // Setup global axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
  }, [token, role]);

  // Load user data on startup if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get("http://localhost:5000/api/auth/me");
        if (response.data.success) {
          setUser(response.data.data);
          setRole(response.data.role);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error("Error loading user:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      if (response.data.success) {
        const { token: jwtToken, role: userRole, user: userData } = response.data;
        setToken(jwtToken);
        setRole(userRole);
        setUser(userData);
        return { success: true, role: userRole };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed. Please check your credentials.",
      };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
        role,
      });
      return response.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed.",
      };
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  const refreshProfile = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/me");
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
