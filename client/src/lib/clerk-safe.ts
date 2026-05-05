/**
 * Safe Clerk hook wrappers — return no-op values when ClerkProvider is absent
 * (e.g. local preview without a valid publishable key).
 */
import { useUser, useAuth } from "@clerk/clerk-react";

export const HAS_CLERK =
  typeof import.meta.env.VITE_CLERK_PUBLISHABLE_KEY === "string" &&
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string).startsWith("pk_");

// eslint-disable-next-line react-hooks/rules-of-hooks
export const useSafeUser = () => (HAS_CLERK ? useUser() : { user: null, isSignedIn: false, isLoaded: true });

export const useSafeAuth = () =>
  // eslint-disable-next-line react-hooks/rules-of-hooks
  HAS_CLERK ? useAuth() : { isSignedIn: false, isLoaded: true, getToken: async () => null as string | null };
