import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../context/NotificationContext";
import { Phone, KeyRound } from "lucide-react";
import { validatePhone } from "../utils/helpers";

const Login = () => {
  const navigate = useNavigate();
  const { sendOTP, verifyOTP } = useAuth();
  const { t } = useLanguage();
  const { success, error } = useNotification();

  const [step, setStep] = useState("phone"); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!validatePhone(phoneNumber)) {
      error(t("invalidPhone"));
      return;
    }

    setLoading(true);
    const result = await sendOTP(phoneNumber);
    setLoading(false);

    if (result.success) {
      success(t("otpSentTo") + " " + phoneNumber);
      setStep("otp");
    } else {
      error(result.message);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      error(t("invalidOTP"));
      return;
    }

    setLoading(true);
    const result = await verifyOTP(phoneNumber, otp);
    setLoading(false);

    if (result.success) {
      success("Login successful!");
      navigate("/dashboard");
    } else {
      error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-hover to-accent flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-bold text-white">S</span>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">SUVIDHA</h1>
          <p className="text-gray-600">{t("smartCityCivicServices")}</p>
        </div>

        {/* Phone Number Step */}
        {step === "phone" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {t("enterPhoneNumber")}
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("phoneNumberPlaceholder")}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  className="gov-input pl-12"
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Demo OTP: 123456</p>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || phoneNumber.length !== 10}
              className="w-full gov-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("pleaseWait") : t("sendOTP")}
            </button>
          </motion.div>
        )}

        {/* OTP Step */}
        {step === "otp" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t("enterOTP")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("otpSentTo")} +91 {phoneNumber}
            </p>

            <div className="mb-6">
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="gov-input pl-12 text-center text-2xl tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Demo OTP: 123456
              </p>
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full gov-button-primary disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loading ? t("pleaseWait") : t("verifyOTP")}
            </button>

            <button
              onClick={() => setStep("phone")}
              className="w-full text-primary font-semibold hover:underline"
            >
              {t("back")}
            </button>
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/admin/login")}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Admin Login
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
