import React from "react";
import { useLanguage } from "../../context/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-white py-8 mt-auto z-10 relative">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="font-bold text-2xl tracking-wider">SUVIDHA</p>
            <p className="text-base text-white/80">Smart City Civic Services</p>
          </div>

          <div className="text-center">
            <p className="text-base font-medium text-white/90">
              © 2026 SUVIDHA. All rights reserved.
            </p>
            <p className="text-sm text-white/60 mt-2 uppercase tracking-widest font-bold">
              Powered by Digital India Initiative
            </p>
          </div>

          <div className="flex gap-8">
            <a
              href="#"
              className="text-lg font-medium hover:text-accent transition-colors px-2 py-2"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-lg font-medium hover:text-accent transition-colors px-2 py-2"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-lg font-medium hover:text-accent transition-colors px-2 py-2"
            >
              Help
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
