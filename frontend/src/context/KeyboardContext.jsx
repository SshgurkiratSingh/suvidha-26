import React, { createContext, useState, useContext } from 'react';

const KeyboardContext = createContext();

export const KeyboardProvider = ({ children }) => {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardType, setKeyboardType] = useState("text"); 
  const [activeInput, setActiveInput] = useState(null);

  const openKeyboard = (e, type = "text") => {
    const inputElement = e.target; //
    setActiveInput(inputElement); //
    setKeyboardType(type); //
    setShowKeyboard(true); //

    // KIOSK FIX: Scroll the input into the center of the screen
    // We use a small timeout to allow the keyboard layout to render first
    setTimeout(() => {
      if (inputElement) {
        inputElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' // This moves the field to the middle of the viewport
        });
      }
    }, 300); //
  };

  const closeKeyboard = () => {
    setShowKeyboard(false);
    setActiveInput(null);
  };

  return (
    <KeyboardContext.Provider value={{ 
      showKeyboard, openKeyboard, closeKeyboard, keyboardType, activeInput 
    }}>
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboard = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error("useKeyboard must be used within a KeyboardProvider");
  }
  return context;
};