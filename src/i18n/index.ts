import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// resources フォルダ内のすべての .json ファイルを動的にインポート
const modules = import.meta.glob<{ default: any }>("./resources/*.json", { eager: true });

const resources: Record<string, { translation: any }> = {};
const supportedLngs: string[] = [];

for (const path in modules) {
  const match = path.match(/\/([^/]+)\.json$/);
  if (match) {
    const lang = match[1];
    const module = modules[path];
    const translation = module.default;
    if (translation) {
      resources[lang] = { translation };
      supportedLngs.push(lang);
    }
  }
}

void i18n.use(initReactI18next).init({
  resources,
  lng: "ja",
  supportedLngs,
  nonExplicitSupportedLngs: true,
  load: "languageOnly",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
