const SYSTEM_PROMPT = `You are PromptCraft AI — an elite prompt engineer.
Always output TWO versions:
### Version 1: Detailed
600–1000 words. Full paragraphs covering Role, Task, Context, Format, Constraints, Tone, Example, Edge Cases.
### Version 2: Concise
150–250 words. Role + task + format in flowing paragraphs.
Format each inside a markdown code block. After both, write 2 sentences on the key difference.`;

let versions = { v1: "", v2: "" };
let activeV = 1;

function extractVersions(text) {
  const v1 = text.match(/###\s*Version\s*1[^#\n]*\n+([\s\S]+?)(?=###\s*Version\s*2|$)/i);
  const v2 = text.match(/###\s*Version\s*2[^#\n]*\n+([\s\S]+?)(?=###\s*Version\s*[3-9]|$)/i);
  if (!v1 || !v2) return null;
  const clean = s => s.replace(/```[\w]*\n?/g, "").replace(/\n?```/g, "").trim();
  return { v1: clean(v1[1]), v2: clean(v2[1]) };
}

async function generate() {
  const input = document.getElementById("input").value.trim();
  if (!input) return;

  const { apiKey } = await chrome.storage.sync.get("apiKey");
  if (!apiKey) {
    alert("Please enter your Groq API key below first.");
    return;
  }

  const domain = document.getElementById("domain").value;
  const tone = document.getElementById("tone").value;
  let sys = SYSTEM_PROMPT;
  if (domain || tone) sys += `\n\nContext — domain: ${domain || "general"}, tone: ${tone || "neutral"}.`;

  const btn = document.getElementById("btn");
  btn.disabled = true;
  btn.innerHTML = '<span class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>';

  const outputBox = document.getElementById("output-box");
  const outputText = document.getElementById("output-text");
  outputBox.classList.add("show");
  outputText.textContent = "";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        stream: true,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: input }
        ]
      })
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}`);

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") break;
        try {
          const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? "";
          if (delta) { full += delta; outputText.textContent = full; }
        } catch {}
      }
    }

    const v = extractVersions(full);
    if (v) {
      versions = v;
      showVersion(1);
      await chrome.storage.local.set({ lastPrompt: v.v1 });
    }
  } catch (e) {
    outputText.textContent = "Error: " + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate Prompt";
  }
}

function showVersion(v) {
  activeV = v;
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", +t.dataset.v === v));
  document.getElementById("output-text").textContent = v === 1 ? versions.v1 : versions.v2;
  chrome.storage.local.set({ lastPrompt: v === 1 ? versions.v1 : versions.v2 });
}

// Events
document.getElementById("btn").addEventListener("click", generate);
document.getElementById("input").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); }
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => showVersion(+tab.dataset.v));
});

document.getElementById("btn-copy").addEventListener("click", () => {
  const text = activeV === 1 ? versions.v1 : versions.v2;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("btn-copy");
    btn.textContent = "✅ Copied!";
    setTimeout(() => btn.textContent = "📋 Copy", 1500);
  });
});

document.getElementById("btn-insert").addEventListener("click", async () => {
  const text = activeV === 1 ? versions.v1 : versions.v2;
  await chrome.storage.local.set({ lastPrompt: text });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (prompt) => {
      const selectors = [
        "#prompt-textarea",               // ChatGPT
        'div[contenteditable="true"]',    // Claude / Gemini
        "textarea",                        // Perplexity / Poe
        '[role="textbox"]',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (!el) continue;
        if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
          el.value = prompt;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
          el.innerText = prompt;
          el.dispatchEvent(new InputEvent("input", { bubbles: true }));
        }
        el.focus();
        break;
      }
    },
    args: [text]
  });
  window.close();
});

// API key save/load
document.getElementById("btn-save-key").addEventListener("click", async () => {
  const key = document.getElementById("api-key").value.trim();
  await chrome.storage.sync.set({ apiKey: key });
  const btn = document.getElementById("btn-save-key");
  btn.textContent = "Saved!";
  setTimeout(() => btn.textContent = "Save", 1500);
});

chrome.storage.sync.get("apiKey", ({ apiKey }) => {
  if (apiKey) document.getElementById("api-key").value = apiKey;
});
