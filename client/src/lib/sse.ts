/**
 * Reads a `text/event-stream` response body and invokes `onDelta` for every
 * `data:` frame until the stream ends or a `[DONE]` sentinel arrives.
 */
export async function readSSEStream(
  response: Response,
  onFrame: (data: unknown) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        onFrame(JSON.parse(data));
      } catch {}
    }
  }
}
