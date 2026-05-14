import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ja: {
    translation: {
      appName: "InverView",
      watch: {
        titleSuffix: "を視聴中",
        descriptionFallback: "Invidious クライアントで動画を視聴できます。",
      },
      player: {
        enterFullscreen: "全画面表示",
        exitFullscreen: "全画面を終了",
      },
    },
  },
  en: {
    translation: {
      appName: "InverView",
      watch: {
        titleSuffix: "is now playing",
        descriptionFallback: "Watch videos in the Invidious client.",
      },
      player: {
        enterFullscreen: "Enter fullscreen",
        exitFullscreen: "Exit fullscreen",
      },
    },
  },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: "ja",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
