import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { publicAPI } from "../services/api";
import { LogOut, User, Bell, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AccessibilityWidget from "./AccessibilityWidget";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [advisories, setAdvisories] = useState([]);

  useEffect(() => {
    const fetchAdvisories = async () => {
      try {
        const data = await publicAPI.getAdvisories();
        const list = Array.isArray(data) ? data : data?.advisories || [];
        // Filter valid ones
        const valid = list.filter((a) => new Date(a.validTill) >= new Date());
        setAdvisories(valid);
      } catch (e) {
        console.error("Failed to load header advisories", e);
      }
    };
    fetchAdvisories();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-primary text-white shadow-lg sticky top-0 z-40"
      >
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center font-bold text-3xl shadow-md border-2 border-white/20">
                S
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  SUVIDHA
                </h1>
                <p className="text-base text-white/90 font-medium">
                  {t("smartCityCivicServices")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Accessibility Widget in Header */}
              <AccessibilityWidget variant="header" />

              {/* User Info & Actions */}
              {user && (
                <div className="flex items-center gap-6">
                  {/* Notifications */}
                  <button
                    className="relative p-3 hover:bg-white/10 rounded-full transition-colors"
                    onClick={() => navigate("/notifications")}
                    title="View notifications"
                  >
                    <Bell className="w-8 h-8" />
                    {/* <span className="absolute top-2 right-2 w-3 h-3 bg-accent rounded-full border border-primary"></span> */}
                  </button>

                  {/* User Info */}
                  <div
                    className="flex items-center gap-4 bg-white/10 px-6 py-3 rounded-xl border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
                    onClick={() => navigate("/profile")}
                  >
                    <div className="bg-white/20 p-2 rounded-full">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">
                        {user.fullName || user.name || "User"}
                      </p>
                      <p className="text-sm text-white/80 font-mono">
                        {user.role === "admin"
                          ? user.email
                          : user.mobileNumber || user.phone}
                      </p>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl transition-colors shadow-lg active:transform active:scale-95"
                  >
                    <LogOut className="w-6 h-6" />
                    <span className="font-bold text-lg">{t("logout")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Advisory Ticker */}
      <AnimatePresence>
        {advisories.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-accent text-primary overflow-hidden border-b-4 border-primary/20"
          >
            <div className="container mx-auto flex items-center py-2 px-4">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded mr-3 flex items-center gap-1 animate-pulse">
                <AlertTriangle size={12} /> ALERT
              </span>
              <div className="flex-1 overflow-hidden relative h-6">
                <div className="absolute whitespace-nowrap animate-marquee">
                  {advisories.map((adv, i) => (
                    <span
                      key={adv.id}
                      className="mr-20 font-bold text-base inline-block"
                    >
                      [{adv.department}] {adv.message}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
