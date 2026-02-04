import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { AccessibilityProvider } from "./context/AccessibilityContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <AccessibilityProvider>
            <App />
          </AccessibilityProvider>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
