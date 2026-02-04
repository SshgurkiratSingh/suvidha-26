import React, { useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Timer } from "lucide-react";

const IdleTimer = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // 60 seconds idle timeout (50s idle + 10s warning)
  const TIMEOUT = 60 * 1000;
  const WARNING_DURATION = 10 * 1000; // 10 seconds

  const onIdle = () => {
    setShowWarning(false);
    handleLogout();
  };

  const onPrompt = () => {
    // Called when the prompt timeout is reached
    setShowWarning(true);
    setCountdown(10);
  };

  // Using the hook
  const { activate } = useIdleTimer({
    onIdle,
    onPrompt,
    timeout: TIMEOUT,
    promptBeforeIdle: WARNING_DURATION,
    throttle: 500,
    disabled: !user || user?.role === "admin", // Disable for admins
  });

  const onActive = () => {
    setShowWarning(false);
    setCountdown(10);
    activate(); // Reset the timer logic specifically
  };

  const handleLogout = () => {
    if (user) {
      logout();
      navigate("/");
    }
  };

  // Timer for the countdown inside the warning modal

  return (
    <AnimatePresence>
      {showWarning && user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border-t-8 border-yellow-500"
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Timer size={64} className="text-yellow-500" />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">
                  {countdown}
                </span>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Are you still there?
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              For your security, your session will end shortly due to
              inactivity.
            </p>

            <button
              onClick={onActive}
              className="w-full bg-blue-600 active:bg-blue-700 text-white text-xl font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              I'm still here
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default IdleTimer;
