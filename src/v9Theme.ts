import { type Theme, webLightTheme, webDarkTheme } from "@fluentui/react-components";

// color.csv から抽出された主要なトークンを定義
// 全てのトークンを網羅すると巨大になるため、UIの整合性に重要なものを優先

export const customV9LightTheme: Theme = {
  ...webLightTheme,
  colorNeutralForeground1: "#242424",
  colorNeutralBackground1: "#ffffff",
  colorNeutralBackground2: "#fafafa",
  colorNeutralBackground3: "#f5f5f5",
  colorBrandForeground1: "#0f6cbd",
  colorBrandBackground: "#0f6cbd",
  // 他のトークンも必要に応じて追加
};

export const customV9DarkTheme: Theme = {
  ...webDarkTheme,
  colorNeutralForeground1: "#ffffff",
  colorNeutralBackground1: "#292929",
  colorNeutralBackground2: "#1f1f1f",
  colorNeutralBackground3: "#141414",
  colorBrandForeground1: "#479ef5",
  colorBrandBackground: "#115ea3",
};
