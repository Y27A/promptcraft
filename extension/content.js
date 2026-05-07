// PromptCraft content script — adds "⚡ PC" button near AI input fields

const SELECTORS = [
  "#prompt-textarea",
  'div[contenteditable="true"]',
  "textarea",
  '[role="textbox"]',
];

let injected = false;

function findInput() {
  for (const sel of SELECTORS) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function inject() {
  if (injected || document.getElementById("pc-btn")) return;
  const input = findInput();
  if (!input) return;

  const btn = document.createElement("button");
  btn.id = "pc-btn";
  btn.title = "Insert last PromptCraft prompt";
  btn.innerHTML = "⚡ PC";
  Object.assign(btn.style, {
    position: "fixed", bottom: "80px", right: "20px", zIndex: "99999",
    background: "linear-gradient(135deg, #6d28d9, #5b21b6)",
    color: "white", border: "none", borderRadius: "50px",
    padding: "8px 14px", fontSize: "12px", fontWeight: "700",
    cursor: "pointer", boxShadow: "0 4px 16px #6d28d966",
    fontFamily: "system-ui, sans-serif", letterSpacing: ".02em",
    transition: "transform .15s, opacity .15s",
  });

  btn.addEventListener("mouseenter", () => btn.style.transform = "scale(1.05)");
  btn.addEventListener("mouseleave", () => btn.style.transform = "scale(1)");

  btn.addEventListener("click", async () => {
    const data = await chrome.storage.local.get("lastPrompt");
    const prompt = data.lastPrompt;
    if (!prompt) {
      btn.innerHTML = "Open PromptCraft first!";
      setTimeout(() => btn.innerHTML = "⚡ PC", 2000);
      return;
    }
    const el = findInput();
    if (!el) return;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      el.value = prompt;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      el.innerText = prompt;
      el.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    el.focus();
    btn.innerHTML = "✅ Inserted!";
    setTimeout(() => btn.innerHTML = "⚡ PC", 2000);
  });

  document.body.appendChild(btn);
  injected = true;
}

// Try immediately and on DOM changes
inject();
const observer = new MutationObserver(inject);
observer.observe(document.body, { childList: true, subtree: true });
