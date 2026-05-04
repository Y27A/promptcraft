export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPrompt(title: string, content: string, format: "md" | "txt" | "json") {
  if (format === "md") {
    downloadFile(`# ${title}\n\n${content}`, `${title}.md`, "text/markdown");
  } else if (format === "txt") {
    downloadFile(content, `${title}.txt`, "text/plain");
  } else {
    downloadFile(JSON.stringify({ title, content }, null, 2), `${title}.json`, "application/json");
  }
}
