/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

// Primary brand color palette (match web Tailwind `maphome` 600 / green-600)
const tintColorLight = "#16a34a";
const tintColorDark = "#16a34a";

export const Colors = {
  light: {
    // Basic text / background / tint matching Web
    text: "#202020", // oklch(0.145 0 0)
    background: "#ffffff",
    tint: tintColorLight,
    icon: "#717182", // --muted-foreground
    tabIconDefault: "#717182",
    tabIconSelected: tintColorLight,

    // Semantic tokens
    success: tintColorLight,
    danger: "#d4183d", // --destructive
    warning: "#d97706",
    info: "#2563eb",

    // Web theme tokens matching theme.css
    primary: "#030213",
    primaryForeground: "#ffffff",
    secondary: "#eceef5", // oklch(0.95 0.0058 264.53)
    secondaryForeground: "#030213",
    muted: "#ececf0",
    mutedForeground: "#717182",
    accent: "#e9ebef",
    accentForeground: "#030213",
    destructive: "#d4183d",
    destructiveForeground: "#ffffff",
    border: "rgba(0, 0, 0, 0.1)",
    inputBackground: "#f3f3f5",
    card: "#ffffff",
    cardForeground: "#202020",
  },
  dark: {
    // Basic text / background / tint matching Web
    text: "#fafafa", // oklch(0.985 0 0)
    background: "#202020", // oklch(0.145 0 0)
    tint: tintColorDark,
    icon: "#acacac", // --muted-foreground oklch(0.708 0 0)
    tabIconDefault: "#acacac",
    tabIconSelected: tintColorDark,

    // Semantic tokens
    success: tintColorDark,
    danger: "#f24957", // --destructive-foreground oklch(0.637 0.237 25.331)
    warning: "#d97706",
    info: "#2563eb",

    // Web theme tokens matching theme.css
    primary: "#fafafa",
    primaryForeground: "#2e2e2e",
    secondary: "#3e3e3e",
    secondaryForeground: "#fafafa",
    muted: "#3e3e3e",
    mutedForeground: "#acacac",
    accent: "#3e3e3e",
    accentForeground: "#fafafa",
    destructive: "#7f232b",
    destructiveForeground: "#ffffff",
    border: "#3e3e3e",
    inputBackground: "#2e2e2e",
    card: "#202020",
    cardForeground: "#fafafa",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
