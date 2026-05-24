import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { ja } from "./resources/ja";
import { en } from "./resources/en";

const resources = {
  ja: { translation: ja },
  en: { translation: en },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: "ja",
  supportedLngs: ["ja", "en"],
  nonExplicitSupportedLngs: true,
  load: "languageOnly",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
