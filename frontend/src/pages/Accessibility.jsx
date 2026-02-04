import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAccessibility } from "../context/AccessibilityContext";
import {
  Accessibility as AccessibilityIcon,
  Volume2,
  VolumeX,
  Contrast,
  Languages,
  Type,
  CheckCircle2,
} from "lucide-react";

const Accessibility = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    highContrast,
    setHighContrast,
    speechEnabled,
    setSpeechEnabled,
    fontSize,
    setFontSize,
    speak,
  } = useAccessibility();

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (!speechEnabled) {
      const u = new SpeechSynthesisUtterance("Text to speech enabled");
      window.speechSynthesis.speak(u);
    }
  };

  const cycleFontSize = () => {
    if (fontSize === "normal") setFontSize("large");
    else if (fontSize === "large") setFontSize("extra");
    else setFontSize("normal");
    if (speechEnabled) speak("Changing font size");
  };

  const features = [
    {
      id: "speech",
      icon: speechEnabled ? Volume2 : VolumeX,
      title: t("accessibilityFeatureAudio"),
      desc: speechEnabled
        ? "Screen reader is Active"
        : "Enable spoken feedback",
      action: toggleSpeech,
      active: speechEnabled,
    },
    {
      id: "contrast",
      icon: Contrast,
      title: t("accessibilityFeatureContrast"),
      desc: highContrast ? "High Contrast Active" : "Enhance text visibility",
      action: () => setHighContrast(!highContrast),
      active: highContrast,
    },
    {
      id: "font",
      icon: Type,
      title: "Text Size",
      desc: `Current: ${fontSize === "normal" ? "Standard" : fontSize === "large" ? "Large" : "Extra Large"}`,
      action: cycleFontSize,
      active: fontSize !== "normal",
    },
    {
      id: "lang",
      icon: Languages,
      title: t("accessibilityFeatureLanguage"),
      desc: t("accessibilityFeatureLanguageDetail"),
      action: () => navigate("/language"),
      active: false,
    },
  ];

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-primary via-primary-hover to-accent text-white transition-colors duration-300">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-max rounded-full border border-white/30 px-6 py-2 text-sm font-semibold text-white/80 backdrop-blur hover:bg-white/10"
        >
          {t("backToAttract")}
        </button>

        <header className="space-y-4 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-secondary/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-white/80">
            <AccessibilityIcon className="h-5 w-5" />
            {t("accessibilityPageTitle")}
          </div>
          <h1 className="text-4xl font-bold">
            {t("accessibilityPageSubtitle")}
          </h1>
          <p className="text-lg text-white/80">
            {t("accessibilityPageDescription")}
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <p className="text-sm uppercase tracking-[0.4em] text-white/70">
            {t("accessibilityFeaturesTitle")}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {features.map(({ icon: Icon, title, desc, action, active, id }) => (
              <button
                key={id}
                onClick={action}
                className={`text-left rounded-2xl border p-4 transition-all active:scale-95 flex items-start justify-between group ${
                  active
                    ? "bg-white text-primary border-white"
                    : "bg-black/20 border-white/10 hover:bg-white/10 text-white"
                }`}
              >
                <div>
                  <div
                    className={`inline-flex rounded-2xl p-3 mb-3 ${active ? "bg-primary/10 text-primary" : "bg-white/10 text-white"}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-xl font-bold">{title}</p>
                  <p
                    className={`mt-2 text-sm ${active ? "text-primary/70" : "text-white/75"}`}
                  >
                    {desc}
                  </p>
                </div>
                {active && <CheckCircle2 className="text-primary h-6 w-6" />}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-auto flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => navigate("/language")}
            className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold hover:bg-white/20"
          >
            {t("touchToStart")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-full border border-white/20 bg-transparent px-6 py-3 text-base font-semibold hover:bg-white/10"
          >
            {t("backToAttract")}
          </button>
        </div>
      </div>
    </main>
  );
};

export default Accessibility;
