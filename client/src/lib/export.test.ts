import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { downloadFile, exportPrompt } from "./export";

/** jsdom's Blob has no `text()`, so record the parts it was constructed with. */
class RecordingBlob {
  parts: string[];
  type: string;
  constructor(parts: string[], options?: BlobPropertyBag) {
    this.parts = parts;
    this.type = options?.type ?? "";
  }
  async text() {
    return this.parts.join("");
  }
}

const createObjectURL = vi.fn((_blob: unknown) => "blob:mock-url");
const revokeObjectURL = vi.fn((_url: string) => {});
let clickSpy: ReturnType<typeof vi.spyOn>;
let anchors: HTMLAnchorElement[];

beforeEach(() => {
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  anchors = [];
  vi.stubGlobal("URL", Object.assign(globalThis.URL, { createObjectURL, revokeObjectURL }));
  vi.stubGlobal("Blob", RecordingBlob);
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    anchors.push(this);
  });
});

afterEach(() => {
  clickSpy.mockRestore();
  vi.unstubAllGlobals();
});

const blobOf = (call = 0) => createObjectURL.mock.calls[call][0] as unknown as RecordingBlob;

describe("downloadFile", () => {
  it("creates an object URL for a blob with the given content type", async () => {
    downloadFile("hello", "greeting.txt", "text/plain");

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(blobOf().type).toBe("text/plain");
    await expect(blobOf().text()).resolves.toBe("hello");
  });

  it("clicks an anchor carrying the url and download filename", () => {
    downloadFile("hello", "greeting.txt", "text/plain");

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(anchors[0].download).toBe("greeting.txt");
    expect(anchors[0].href).toBe("blob:mock-url");
  });

  it("revokes the object url after triggering the download", () => {
    downloadFile("hello", "greeting.txt", "text/plain");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});

describe("exportPrompt", () => {
  it("writes markdown with the title as an h1 heading", async () => {
    exportPrompt("My Prompt", "body text", "md");

    expect(anchors[0].download).toBe("My Prompt.md");
    expect(blobOf().type).toBe("text/markdown");
    await expect(blobOf().text()).resolves.toBe("# My Prompt\n\nbody text");
  });

  it("writes plain text with only the content", async () => {
    exportPrompt("My Prompt", "body text", "txt");

    expect(anchors[0].download).toBe("My Prompt.txt");
    expect(blobOf().type).toBe("text/plain");
    await expect(blobOf().text()).resolves.toBe("body text");
  });

  it("writes pretty-printed json containing title and content", async () => {
    exportPrompt("My Prompt", "body text", "json");

    expect(anchors[0].download).toBe("My Prompt.json");
    expect(blobOf().type).toBe("application/json");
    const text = await blobOf().text();
    expect(JSON.parse(text)).toEqual({ title: "My Prompt", content: "body text" });
    expect(text).toContain("\n  ");
  });
});
