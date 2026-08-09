import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { usePageTitle } from "./usePageTitle";

let container: HTMLDivElement;
let root: Root;

function render(page: string) {
  const Probe = ({ page: p }: { page: string }) => {
    usePageTitle(p);
    return null;
  };
  act(() => {
    root.render(createElement(Probe, { page }));
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  document.title = "";
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("usePageTitle", () => {
  it("suffixes the page name with the app name", () => {
    render("Builder");
    expect(document.title).toBe("Builder — PromptCraft");
  });

  it("falls back to the bare app name for an empty page", () => {
    render("");
    expect(document.title).toBe("PromptCraft");
  });

  it("updates the title when the page changes", () => {
    render("Builder");
    render("History");
    expect(document.title).toBe("History — PromptCraft");
  });
});
