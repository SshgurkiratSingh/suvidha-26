import { createContext, useState, useContext, useEffect } from "react";
import { authAPI, adminAuthAPI } from "../components/services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [citizenToken, setCitizenToken] = useState(
    localStorage.getItem("citizenToken") || null
  );
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("adminToken") || null
  );

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    if (citizenToken) {
      localStorage.setItem("citizenToken", citizenToken);
    } else {
      localStorage.removeItem("citizenToken");
    }
  }, [citizenToken]);

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem("adminToken", adminToken);
    } else {
      localStorage.removeItem("adminToken");
    }
  }, [adminToken]);

  const sendOTP = async (mobileNumber) => {
    try {
      const result = await authAPI.requestOTP(mobileNumber);
      return { success: true, message: result.message || "OTP sent" };
    } catch (error) {
      return { success: false, message: error.message || "Failed to send OTP" };
    }
  };

  const verifyOTP = async (mobileNumber, otp) => {
    try {
      const result = await authAPI.verifyOTP(mobileNumber, otp);
      const citizen = result.citizen;
      const normalizedUser = {
        id: citizen.id,
        fullName: citizen.fullName,
        mobileNumber: citizen.mobileNumber,
        email: citizen.email,
        role: "citizen",
      };

      setUser(normalizedUser);
      setCitizenToken(result.token);
      setAdminToken(null);
      return { success: true, user: normalizedUser };
    } catch (error) {
      return { success: false, message: error.message || "Invalid OTP" };
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const result = await adminAuthAPI.login(email, password);
      const admin = result.admin;
      const normalizedUser = {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: "admin",
      };

      setUser(normalizedUser);
      setAdminToken(result.token);
      setCitizenToken(null);
      return { success: true, user: normalizedUser };
    } catch (error) {
      return { success: false, message: error.message || "Login failed" };
    }
  };

  // Refresh user data
  const refreshUser = (updatedData) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (user?.role === "admin") {
        await adminAuthAPI.logout();
      } else if (user?.role === "citizen") {
        await authAPI.logout();
      }
    } catch (error) {
      // ignore logout errors
    } finally {
      setUser(null);
      setCitizenToken(null);
      setAdminToken(null);
    }
  };

  const value = {
    user,
    sendOTP,
    verifyOTP,
    adminLogin,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    citizenToken,
    adminToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
