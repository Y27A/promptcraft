import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import "./index.css";
import App from "./App";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const hasValidClerkKey = typeof PUBLISHABLE_KEY === "string" && PUBLISHABLE_KEY.startsWith("pk_");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const tree = (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {hasValidClerkKey ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>{tree}</ClerkProvider>
    ) : (
      tree
    )}
  </StrictMode>
);
