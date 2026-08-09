import { createContext, useContext, useEffect, useState } from "react";
import chroma from "chroma-js";
import { readString, writeString } from "@/lib/storage";

type ThemePref = "system" | "light" | "dark";
type Resolved = "light" | "dark";

interface ThemeCtx {
  themePref: ThemePref;
  resolved: Resolved;
  setThemePref: (p: ThemePref) => void;
  accentHex: string;
  setAccent: (hex: string) => void;
}

const Ctx = createContext<ThemeCtx>({
  themePref: "dark", resolved: "dark",
  setThemePref: () => {}, accentHex: "#7c3aed", setAccent: () => {},
});

function applyAccent(hex: string) {
  try {
    const c = chroma(hex);
    const [h, s, l] = c.hsl();
    const hsl = `${Math.round(h ?? 0)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    const root = document.documentElement;
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    // derive accent (darker version) and glow
    const darker = chroma(hex).darken(2);
    const [dh, ds, dl] = darker.hsl();
    root.style.setProperty("--accent", `${Math.round(dh ?? 0)} ${Math.round(ds * 100)}% ${Math.round(dl * 100)}%`);
  } catch (err) {
    console.warn(`Ignoring invalid accent colour "${hex}"`, err);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePref, setThemePrefState] = useState<ThemePref>(
    () => (readString("promptcraft:themePref", "dark") as ThemePref)
  );
  const [accentHex, setAccentState] = useState<string>(
    () => readString("promptcraft:accent", "#7c3aed")
  );

  const getResolved = (pref: ThemePref): Resolved =>
    pref === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : pref;

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

  useEffect(() => { applyAccent(accentHex); }, [accentHex]);

  const setThemePref = (p: ThemePref) => {
    writeString("promptcraft:themePref", p);
    setThemePrefState(p);
  };

  const setAccent = (hex: string) => {
    writeString("promptcraft:accent", hex);
    setAccentState(hex);
  };

  return <Ctx.Provider value={{ themePref, resolved, setThemePref, accentHex, setAccent }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
