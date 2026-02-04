import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accessibility,
  Type,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  X,
} from "lucide-react";
import { useAccessibility } from "../../context/AccessibilityContext";

const AccessibilityWidget = ({ variant = "sidebar" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    speechEnabled,
    setSpeechEnabled,
    speak,
  } = useAccessibility();

  // ... handlers ...

  const cycleFontSize = () => {
    if (fontSize === "normal") setFontSize("large");
    else if (fontSize === "large") setFontSize("extra");
    else setFontSize("normal");

    if (speechEnabled) speak("Changing font size");
  };

  const toggleContrast = () => {
    setHighContrast(!highContrast);
    if (speechEnabled)
      speak(highContrast ? "High contrast disabled" : "High contrast enabled");
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (!speechEnabled) {
      const u = new SpeechSynthesisUtterance("Text to speech enabled");
      window.speechSynthesis.speak(u);
    }
  };

  if (variant === "header") {
    return (
      <div className="relative z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3 rounded-full transition-colors ${
            highContrast
              ? "bg-yellow-400 text-black border-2 border-black"
              : "bg-white/10 hover:bg-white/20 text-white"
          }`}
          title="Accessibility Settings"
        >
          <Accessibility size={24} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-72 bg-white rounded-2xl shadow-xl p-4 flex flex-col gap-3 border border-gray-100 z-50"
              >
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                  <span className="font-bold text-gray-700">
                    Display Settings
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-2">
                  {/* Font Size Toggle */}
                  <button
                    onClick={cycleFontSize}
                    className="flex items-center gap-3 w-full p-3 hover:bg-blue-50 rounded-xl transition-colors text-left"
                  >
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <Type size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">Text Size</div>
                      <div className="text-xs text-gray-500">
                        {fontSize === "normal"
                          ? "Standard"
                          : fontSize === "large"
                            ? "Large"
                            : "Extra Large"}
                      </div>
                    </div>
                  </button>

                  {/* Contrast Toggle */}
                  <button
                    onClick={toggleContrast}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors text-left ${highContrast ? "bg-black text-white" : "hover:bg-gray-100"}`}
                  >
                    <div
                      className={`${highContrast ? "bg-gray-800 text-yellow-400" : "bg-gray-100 text-gray-600"} p-2 rounded-lg`}
                    >
                      {highContrast ? <Sun size={20} /> : <Moon size={20} />}
                    </div>
                    <div>
                      <div
                        className={`font-bold ${highContrast ? "text-white" : "text-gray-800"}`}
                      >
                        High Contrast
                      </div>
                      <div
                        className={`text-xs ${highContrast ? "text-gray-300" : "text-gray-500"}`}
                      >
                        {highContrast ? "On" : "Off"}
                      </div>
                    </div>
                  </button>

                  {/* Speech Toggle */}
                  <button
                    onClick={toggleSpeech}
                    className="flex items-center gap-3 w-full p-3 hover:bg-green-50 rounded-xl transition-colors text-left"
                  >
                    <div
                      className={`p-2 rounded-lg transition-colors ${speechEnabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                    >
                      {speechEnabled ? (
                        <Volume2 size={20} />
                      ) : (
                        <VolumeX size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">
                        Screen Reader
                      </div>
                      <div className="text-xs text-gray-500">
                        {speechEnabled ? "Enabled" : "Disabled"}
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-row-reverse items-center gap-0 print:hidden translate-x-[2px]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="bg-white rounded-l-2xl shadow-2xl p-4 flex flex-col gap-3 min-w-[250px] border-y border-l border-gray-200 mr-2"
          >
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
              <span className="font-bold text-gray-700">Display Settings</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Font Size Toggle */}
            <button
              onClick={cycleFontSize}
              className="flex items-center gap-3 w-full p-3 hover:bg-blue-50 rounded-xl transition-colors text-left"
            >
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <Type size={20} />
              </div>
              <div>
                <div className="font-bold text-gray-800">Text Size</div>
                <div className="text-xs text-gray-500">
                  {fontSize === "normal"
                    ? "Standard"
                    : fontSize === "large"
                      ? "Large"
                      : "Extra Large"}
                </div>
              </div>
            </button>

            {/* Contrast Toggle */}
            <button
              onClick={toggleContrast}
              className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors text-left ${highContrast ? "bg-black text-white" : "hover:bg-gray-100"}`}
            >
              <div
                className={`${highContrast ? "bg-gray-800 text-yellow-400" : "bg-gray-100 text-gray-600"} p-2 rounded-lg`}
              >
                {highContrast ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div>
                <div
                  className={`font-bold ${highContrast ? "text-white" : "text-gray-800"}`}
                >
                  High Contrast
                </div>
                <div
                  className={`text-xs ${highContrast ? "text-gray-300" : "text-gray-500"}`}
                >
                  {highContrast ? "On" : "Off"}
                </div>
              </div>
            </button>

            {/* Speech Toggle */}
            <button
              onClick={toggleSpeech}
              className="flex items-center gap-3 w-full p-3 hover:bg-green-50 rounded-xl transition-colors text-left"
            >
              <div
                className={`p-2 rounded-lg transition-colors ${speechEnabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
              >
                {speechEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </div>
              <div>
                <div className="font-bold text-gray-800">Screen Reader</div>
                <div className="text-xs text-gray-500">
                  {speechEnabled ? "Enabled" : "Disabled"}
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, x: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-l-2xl shadow-xl flex items-center justify-center transition-all border-y-2 border-l-2 border-r-0 ${
          isOpen
            ? "bg-blue-600 text-white border-blue-600"
            : highContrast
              ? "bg-yellow-400 text-black border-black"
              : "bg-white text-blue-600 border-blue-100"
        }`}
      >
        {isOpen ? <X size={28} /> : <Accessibility size={32} />}
      </motion.button>
    </div>
  );
};

export default AccessibilityWidget;
