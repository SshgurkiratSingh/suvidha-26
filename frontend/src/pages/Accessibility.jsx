import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  Accessibility as AccessibilityIcon,
  Volume2,
  Contrast,
  Languages,
  Headphones,
} from "lucide-react";

const Accessibility = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const features = [
    {
      icon: Volume2,
      title: t("accessibilityFeatureAudio"),
      desc: t("accessibilityFeatureAudioDetail"),
    },
    {
      icon: Contrast,
      title: t("accessibilityFeatureContrast"),
      desc: t("accessibilityFeatureContrastDetail"),
    },
    {
      icon: Languages,
      title: t("accessibilityFeatureLanguage"),
      desc: t("accessibilityFeatureLanguageDetail"),
    },
    {
      icon: Headphones,
      title: t("accessibilityFeatureHelp"),
      desc: t("accessibilityFeatureHelpDetail"),
    },
  ];

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-primary via-primary-hover to-accent text-white">
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
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="inline-flex rounded-2xl bg-white/10 p-3">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-xl font-semibold">{title}</p>
                <p className="mt-2 text-sm text-white/75">{desc}</p>
              </div>
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
