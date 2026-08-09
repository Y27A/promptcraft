import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIsMobile } from "./use-mobile";

let container: HTMLDivElement;
let root: Root;
let listeners: ((event: { matches: boolean }) => void)[];
let addEventListener: ReturnType<typeof vi.fn>;
let removeEventListener: ReturnType<typeof vi.fn>;
let queries: string[];

function setup(width: number) {
  window.innerWidth = width;
  listeners = [];
  queries = [];
  addEventListener = vi.fn((_: string, handler: (event: { matches: boolean }) => void) => listeners.push(handler));
  removeEventListener = vi.fn();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      queries.push(query);
      return { matches: window.innerWidth < 768, addEventListener, removeEventListener };
    }),
  );
}

function render(breakpoint?: number) {
  let value = false;
  const Probe = () => {
    value = breakpoint === undefined ? useIsMobile() : useIsMobile(breakpoint);
    return null;
  };
  act(() => root.render(createElement(Probe)));
  return () => value;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  setup(1024);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("useIsMobile", () => {
  it("is false for a viewport wider than the default breakpoint", () => {
    expect(render()()).toBe(false);
  });

  it("is true for a viewport narrower than the default breakpoint", () => {
    setup(500);
    expect(render()()).toBe(true);
  });

  it("subscribes to a max-width query one pixel below the breakpoint", () => {
    render(1000);
    expect(queries).toEqual(["(max-width: 999px)"]);
    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("respects a custom breakpoint for the initial value", () => {
    setup(800);
    expect(render(1000)()).toBe(true);
  });

  it("updates when the media query changes", () => {
    const value = render();
    expect(value()).toBe(false);

    act(() => listeners.forEach((handler) => handler({ matches: true })));
    expect(value()).toBe(true);
  });

  it("removes the listener on unmount", () => {
    render();
    act(() => root.unmount());
    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    root = createRoot(container);
  });
});
