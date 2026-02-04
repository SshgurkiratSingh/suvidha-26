import React, { createContext, useContext, useState, useEffect } from "react";

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  return useContext(AccessibilityContext);
};

export const AccessibilityProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState("normal"); // normal, large, extra
  const [highContrast, setHighContrast] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);

  // Apply classes to HTML/Body
  useEffect(() => {
    const root = document.documentElement;

    // Font Size
    root.classList.remove("text-base", "text-lg", "text-xl");
    if (fontSize === "large") root.style.fontSize = "110%";
    else if (fontSize === "extra") root.style.fontSize = "125%";
    else root.style.fontSize = "100%";

    // High Contrast
    if (highContrast) document.body.classList.add("high-contrast");
    else document.body.classList.remove("high-contrast");
  }, [fontSize, highContrast]);

  // Simple Text to Speech helper
  const speak = (text) => {
    if (!speechEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const value = {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    speechEnabled,
    setSpeechEnabled,
    speak,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};
