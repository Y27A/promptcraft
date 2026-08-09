import { toast } from "sonner";

export async function copyToClipboard(text: string, message = "Copied!") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error("Failed to copy");
  }
}
