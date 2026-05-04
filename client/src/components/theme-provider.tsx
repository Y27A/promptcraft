import { createContext, useContext, useEffect, useState } from "react";

type ThemePref = "system" | "light" | "dark";
type Resolved = "light" | "dark";

interface ThemeCtx {
  themePref: ThemePref;
  resolved: Resolved;
  setThemePref: (p: ThemePref) => void;
}

const Ctx = createContext<ThemeCtx>({
  themePref: "system",
  resolved: "dark",
  setThemePref: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePref, setThemePrefState] = useState<ThemePref>(() => {
    return (localStorage.getItem("promptcraft:themePref") as ThemePref) ?? "system";
  });

  const getResolved = (pref: ThemePref): Resolved => {
    if (pref === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return pref;
  };

  const [resolved, setResolved] = useState<Resolved>(() => getResolved(themePref));

  useEffect(() => {
    const r = getResolved(themePref);
    setResolved(r);
    document.documentElement.classList.remove("light", "dark");
    if (r === "light") document.documentElement.classList.add("light");
  }, [themePref]);

  useEffect(() => {
    if (themePref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolved(getResolved("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themePref]);

  const setThemePref = (p: ThemePref) => {
    localStorage.setItem("promptcraft:themePref", p);
    setThemePrefState(p);
  };

  return <Ctx.Provider value={{ themePref, resolved, setThemePref }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
