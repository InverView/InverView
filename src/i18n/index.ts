import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// resources フォルダ内のすべての .ts ファイルを動的にインポート
const modules = import.meta.glob<{ [key: string]: any }>("./resources/*.ts", { eager: true });

const resources: Record<string, { translation: any }> = {};
const supportedLngs: string[] = [];

for (const path in modules) {
  const match = path.match(/\/([^/]+)\.ts$/);
  if (match) {
    const lang = match[1];
    const module = modules[path];
    const translation = module[lang];
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
