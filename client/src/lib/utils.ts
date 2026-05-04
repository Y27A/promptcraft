import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getAuthToken } from "./auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function apiFetch(path: string, options?: RequestInit) {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers ?? {}),
  };
  return fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
}

export function formatAge(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
