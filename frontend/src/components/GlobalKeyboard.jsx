import React, { useRef, useState, useEffect, useCallback } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import NumericKeypad from "./NumericKeypad";
import { useKeyboard } from "../context/KeyboardContext";
import { X, Trash2, CheckCircle2 } from "lucide-react";

const GlobalKeyboard = () => {
  const { showKeyboard, closeKeyboard, keyboardType, activeInput } = useKeyboard();
  const keyboard = useRef();
  const [height, setHeight] = useState(450); // Default height in px
  const [isResizing, setIsResizing] = useState(false);
  
  // State to force the "Live Entry" mirror to update instantly for the kiosk user
  const [mirrorText, setMirrorText] = useState("");

  // Sync mirror text whenever activeInput changes or keyboard opens
  useEffect(() => {
    if (activeInput) {
      setMirrorText(activeInput.value || "");
    }
  }, [activeInput, showKeyboard]);

  // Resize Logic for the Dark Blue Strip
  const resize = useCallback((e) => {
    if (isResizing) {
      const newHeight = window.innerHeight - e.clientY;
      // Constraints to keep keyboard usable
      if (newHeight > 300 && newHeight < window.innerHeight * 0.8) {
        setHeight(newHeight);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", () => setIsResizing(false));
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", () => setIsResizing(false));
    };
  }, [resize]);

  const updateInput = (value) => {
    if (!activeInput) return;
    
    // KIOSK FEATURE: Force All Caps for standardized Suvidha data entry
    const upperValue = value.toUpperCase();
    setMirrorText(upperValue); 

    const nativeSetter = Object.getOwnPropertyDescriptor(
      activeInput.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
      "value"
    ).set;
    nativeSetter.call(activeInput, upperValue);

    // Trigger events so React state (formData) updates correctly
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    activeInput.dispatchEvent(new Event("change", { bubbles: true }));
    activeInput.focus();
  };

  const clearInput = () => {
    updateInput("");
    setMirrorText("");
    if (keyboard.current) keyboard.current.clearInput();
  };

  if (!showKeyboard) return null;

  return (
    <div 
      style={{ height: `${height}px` }}
      className="fixed bottom-0 left-0 w-full z-[10000] bg-[#f8fafc] border-t-0 flex flex-col select-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
    >
      {/* THE RESIZER BAR (Dark Blue Strip) */}
      <div 
        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
        className="w-full h-3 bg-[#0A3D62] cursor-ns-resize flex items-center justify-center hover:bg-[#0d4d7a] transition-colors"
      >
        <div className="w-12 h-1 bg-white/30 rounded-full" />
      </div>

      <div className="flex-1 flex flex-col max-w-[1200px] mx-auto w-full p-4 overflow-hidden">
        
        {/* HEADER WITH LIVE MIRROR */}
        <div className="flex justify-between items-start mb-4 px-4">
           <div className="flex flex-col gap-1 flex-1">
             <div className="flex items-center gap-2">
               <span className="font-black text-[#0A3D62] tracking-widest text-lg italic uppercase">Suvidha Terminal</span>
               <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active Connection</span>
             </div>
             
             {/* THE MIRROR BAR: Visible even if input is buried */}
             <div className="mt-2 flex items-center gap-2 bg-white border-2 border-[#0A3D62] rounded-xl p-3 shadow-sm mr-8">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter border-r pr-2 mr-1">Live Entry</span>
               <span className="text-xl font-bold text-[#0A3D62] truncate flex-1">
                 {mirrorText || <span className="text-gray-300 italic font-normal text-lg">Waiting for input...</span>}
                 <span className="animate-pulse text-blue-500 ml-0.5">|</span>
               </span>
               <button onClick={clearInput} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                 <Trash2 size={20} />
               </button>
             </div>
           </div>

           <button onClick={closeKeyboard} className="p-3 bg-red-500 text-white rounded-2xl shadow-lg active:scale-95 transition-transform mt-1">
             <X size={28} />
           </button>
        </div>

        {/* KEYBOARD AREA */}
        <div className="flex-1 bg-gray-100/50 rounded-2xl border border-gray-200 p-3 shadow-inner overflow-y-auto">
          {keyboardType === "numeric" ? (
            <div className="h-full flex flex-col items-center">
               <div className="flex-1 w-full flex items-center justify-center">
                  <div className="w-full max-w-md"> 
                    <NumericKeypad 
                      onKeyPress={(v) => updateInput(activeInput.value + v)}
                      onBackspace={() => updateInput(activeInput.value.slice(0, -1))}
                      onClear={clearInput}
                    />
                  </div>
               </div>
              
              <button 
                onClick={closeKeyboard}
                className="mt-4 w-full max-w-md bg-green-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <CheckCircle2 size={24} /> CONFIRM & CLOSE
              </button>
            </div>
          ) : (
            <div className="kiosk-standard-keyboard suvidha-all-caps">
              <Keyboard
                keyboardRef={(r) => (keyboard.current = r)}
                onChange={(input) => updateInput(input)}
                onKeyPress={(button) => {
                  if (button === "{enter}") closeKeyboard();
                }}
                layout={{
                  default: [
                    "1 2 3 4 5 6 7 8 9 0 {backspace}",
                    "Q W E R T Y U I O P",
                    "A S D F G H J K L",
                    "Z X C V B N M / , .",
                    "{space} {enter}" 
                  ]
                }}
                display={{
                  "{backspace}": "DELETE",
                  "{space}": "SPACE BAR",
                  "{enter}": "DONE / ENTER ✔" 
                }}
                theme="hg-theme-default hg-layout-default suvidhaTheme"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalKeyboard;