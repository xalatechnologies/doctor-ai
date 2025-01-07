export const theme = {
  light: {
    background: "#ffffff",
    foreground: "#0f172a",
    primary: {
      main: "#0ea5e9",
      light: "#38bdf8",
      dark: "#0369a1",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#64748b",
      light: "#94a3b8",
      dark: "#334155",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#b91c1c",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#b45309",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#047857",
      contrastText: "#ffffff",
    },
    grey: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },
  dark: {
    background: "#0f172a",
    foreground: "#f8fafc",
    primary: {
      main: "#38bdf8",
      light: "#7dd3fc",
      dark: "#0284c7",
      contrastText: "#0f172a",
    },
    secondary: {
      main: "#94a3b8",
      light: "#cbd5e1",
      dark: "#475569",
      contrastText: "#0f172a",
    },
    error: {
      main: "#f87171",
      light: "#fca5a5",
      dark: "#dc2626",
      contrastText: "#0f172a",
    },
    warning: {
      main: "#fbbf24",
      light: "#fcd34d",
      dark: "#d97706",
      contrastText: "#0f172a",
    },
    success: {
      main: "#34d399",
      light: "#6ee7b7",
      dark: "#059669",
      contrastText: "#0f172a",
    },
    grey: {
      50: "#0f172a",
      100: "#1e293b",
      200: "#334155",
      300: "#475569",
      400: "#64748b",
      500: "#94a3b8",
      600: "#cbd5e1",
      700: "#e2e8f0",
      800: "#f1f5f9",
      900: "#f8fafc",
    },
  },
} as const;

export type Theme = typeof theme;
export type ThemeMode = keyof Theme;
export type ThemeColors = keyof Theme["light"]; 