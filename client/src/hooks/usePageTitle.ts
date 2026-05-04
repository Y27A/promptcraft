import { useEffect } from "react";

export function usePageTitle(page: string) {
  useEffect(() => {
    document.title = page ? `${page} — PromptCraft` : "PromptCraft";
  }, [page]);
}
