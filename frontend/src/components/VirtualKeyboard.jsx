import React, { useRef } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import { useKeyboard } from "../context/KeyboardContext";

const VirtualKeyboard = () => {
  const { showKeyboard, closeKeyboard, layout, inputTarget } = useKeyboard();
  const keyboard = useRef();

  if (!showKeyboard) return null;

  const onChange = (input) => {
    if (inputTarget) {
      // This updates the actual input value programmatically
      inputTarget.value = input;
      // Manually trigger a change event so React state updates
      const event = new Event('input', { bubbles: true });
      inputTarget.dispatchEvent(event);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 9999, background: "#ececec", padding: "10px" }}>
      <button onClick={closeKeyboard} style={{ float: "right", margin: "5px" }}>Close ✖</button>
      <Keyboard
        keyboardRef={(r) => (keyboard.current = r)}
        layoutName={layout}
        onChange={onChange}
        inputName="default"
      />
    </div>
  );
};

export default VirtualKeyboard;