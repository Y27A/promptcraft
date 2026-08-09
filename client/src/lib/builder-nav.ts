import { SESSION_KEYS, writeSessionJSON } from "./storage";

type Navigate = (to: string) => void;

/** Opens the builder pre-filled with `text`. */
export function openBuilderWith(navigate: Navigate, text: string) {
  try {
    sessionStorage.setItem(SESSION_KEYS.prefillInput, text);
  } catch {}
  navigate("/builder?refine=1");
}

/** Opens the builder restoring a stored history entry. */
export function resumeInBuilder(navigate: Navigate, entry: unknown) {
  writeSessionJSON(SESSION_KEYS.resume, entry);
  navigate("/builder?resume=1");
}
