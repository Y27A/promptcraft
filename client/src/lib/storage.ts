export const STORAGE_KEYS = {
  history: "pc:history",
  saved: "pc:saved",
  projects: "pc:projects",
  settings: "pc:settings",
  userTemplates: "pc:user-templates",
  sessionKey: "pc:sessionKey",
  trialDate: "pc:trialDate",
  trialUsed: "pc:trialUsed",
  visited: "pc:visited",
  themePref: "promptcraft:themePref",
  accent: "promptcraft:accent",
} as const;

export const SESSION_KEYS = {
  resume: "pc:resume",
  prefillInput: "promptcraft:prefillInput",
  remixPrompt: "promptcraft:remixPrompt",
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function removeStored(...keys: string[]) {
  try {
    for (const key of keys) localStorage.removeItem(key);
  } catch {}
}

export function writeSessionJSON(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** Reads a sessionStorage entry and removes it, so it is consumed only once. */
export function takeSessionItem(key: string): string | null {
  try {
    const value = sessionStorage.getItem(key);
    if (value !== null) sessionStorage.removeItem(key);
    return value;
  } catch {
    return null;
  }
}
