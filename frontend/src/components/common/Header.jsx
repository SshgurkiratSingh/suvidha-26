import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { LogOut, User, Bell } from "lucide-react";
import { motion } from "framer-motion";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-primary text-white shadow-lg sticky top-0 z-40"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center font-bold text-2xl">
              S
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SUVIDHA</h1>
              <p className="text-xs text-white/80">
                {t("smartCityCivicServices")}
              </p>
            </div>
          </div>

          {/* User Info & Actions */}
          {user && (
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-primary-hover rounded-full transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
              </button>

              {/* User Info */}
              <div className="flex items-center gap-3 bg-primary-hover px-4 py-2 rounded-lg">
                <User className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold text-sm">
                    {user.fullName || user.name || "User"}
                  </p>
                  <p className="text-xs text-white/70">
                    {user.role === "admin"
                      ? user.email
                      : user.mobileNumber || user.phone}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-danger hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">{t("logout")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
