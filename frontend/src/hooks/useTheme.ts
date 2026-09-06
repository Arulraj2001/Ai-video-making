import { useState, useEffect, useCallback } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem("scenora_theme") || localStorage.getItem("ai_video_theme");
      if (saved === "dark" || saved === "light" || saved === "system") {
        return saved;
      }
    } catch {
      // Fallback if localStorage unavailable
    }
    return "light";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") return "light";
    if (preference === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return preference;
  });

  // Apply resolved theme to HTML root element
  const applyTheme = useCallback((themeToApply: ResolvedTheme) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", themeToApply);
      document.documentElement.style.colorScheme = themeToApply;
    }
  }, []);

  useEffect(() => {
    let resolved: ResolvedTheme;
    if (preference === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      resolved = mediaQuery.matches ? "dark" : "light";

      const handleChange = (e: MediaQueryListEvent) => {
        const next = e.matches ? "dark" : "light";
        setResolvedTheme(next);
        applyTheme(next);
      };

      mediaQuery.addEventListener("change", handleChange);
      setResolvedTheme(resolved);
      applyTheme(resolved);

      try {
        localStorage.setItem("scenora_theme", "system");
        localStorage.setItem("ai_video_theme", resolved);
      } catch {}

      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      resolved = preference;
      setResolvedTheme(resolved);
      applyTheme(resolved);

      try {
        localStorage.setItem("scenora_theme", preference);
        localStorage.setItem("ai_video_theme", preference);
      } catch {}
    }
  }, [preference, applyTheme]);

  const toggleTheme = () => {
    setPreference((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "system";
      return "light";
    });
  };

  return {
    theme: resolvedTheme, // Backward compatibility: "light" | "dark"
    preference,           // Explicit choice: "light" | "dark" | "system"
    resolvedTheme,
    toggleTheme,
    setPreference,
    setTheme: (t: ResolvedTheme) => setPreference(t),
  };
}
