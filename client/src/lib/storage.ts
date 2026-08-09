/**
 * localStorage helpers that never throw but never fail silently either:
 * failures are logged, and writes report whether they succeeded so callers
 * can tell the user when their data was not persisted.
 */

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Failed to read "${key}" from localStorage`, err);
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`Failed to write "${key}" to localStorage`, err);
    return false;
  }
}

export function remove(...keys: string[]): void {
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`Failed to remove "${key}" from localStorage`, err);
    }
  }
}

export function readString(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (err) {
    console.warn(`Failed to read "${key}" from localStorage`, err);
    return fallback;
  }
}

export function writeString(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`Failed to write "${key}" to localStorage`, err);
    return false;
  }
}
