/**
 * AI Model utility for categorizing and summarizing browser tabs
 * HYBRID: uses Firebase AI Logic Web SDK (hybrid on-device + cloud)
 *
 * IMPORTANT:
 * - Keep your prompt and example exactly as provided below (unchanged).
 * - Replace firebaseConfig with your project's config.
 */

import { initializeApp } from "firebase/app";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
} from "firebase/ai";
import { firebaseConfig } from "../config.js";
 
/* ---------- Module state ---------- */
let model = null;
let aiInstance = null;
let firebaseApp = null;

/* ---------- Your system prompt + user example (left exactly as you provided) ---------- */
const SYSTEM_PROMPT = `You are TabsAI — an intelligent tab categorizer and summarization assistant for a browser tab manager.

    Your task:
    - Receive an array of open browser tabs, each containing:
      { tabId, title, url, metadata, and pageContent }.
    - Analyze all tabs and group them into meaningful thematic categories.
    - Every tab **must** belong to exactly one category — no tabId should ever be omitted.
    - Each category must include:
      1. A human-readable category name (e.g., "Development Tools", "AI Research", "Finance & Markets").
      2. A "tablist" containing all tabIds assigned to that category.
      3. A "summary" that briefly (1–2 sentences) describes the theme of that category.

    **Output format:**
    Return strictly one valid JSON object structured like this:
    {
      "CategoryName1": {
        "tablist": ["tabId1", "tabId2", ...],
        "summary": "Brief category summary."
      },
      "CategoryName2": {
        "tablist": ["tabId3", "tabId4", ...],
        "summary": "Brief category summary."
      }
    }

    **Rules:**
    - Do NOT include explanations or markdown outside the JSON.
    - Category names should be concise, descriptive, and thematic.
    - Each tabId from the input array must appear exactly once in one of the tablists.
    - If a tab doesn’t clearly fit an existing category, create a new one (e.g., “Miscellaneous” or “Uncategorized”).
    - Ensure the number of total tabIds across all categories equals the number of tabs in the input.
    - Summaries should be short, neutral, and informative.

    **Example Output:**
    {
      "Financial Intermediation": {
        "tablist": ["1181810563"],
        "summary": "Financial intermediaries facilitate transactions between investors, brokers, and banks in the stock market."
      },
      "Coding & Algorithms": {
        "tablist": ["1181810564", "1181810565", "1181810566"],
        "summary": "Tabs focused on coding interview practice, algorithm tutorials, and microservices development."
      },
      "AI & Chrome Development": {
        "tablist": ["1181810569", "1181810570", "1181810571"],
        "summary": "Resources exploring Chrome's built-in AI features, including summarization APIs and client-side scaling techniques."
      },
      "Tab AI Project": {
        "tablist": ["1181810572"],
        "summary": "GitHub repository for the Tab AI project, a system for tab categorization and summarization."
      }
    }

    **Validation reminder:**
    Before producing output, verify that:
    1. Every tabId from the input array appears once.
    2. The JSON object is syntactically valid.
    3. Each category includes a non-empty "tablist" and a "summary".`;

const USER_EXAMPLE = `
{
  "Financial Intermediation": {
    "tablist": ["1181810563"],
    "summary": "Financial intermediaries facilitate your transaction in the Stock Market. They are an interconnected system of stock brokers, depositories, banks, etc."
  },
  "Coding & Algorithms": {
    "tablist": ["1181810564", "1181810565", "1181810566"],
    "summary": "Tabs focused on coding interview practice, algorithm tutorials, and microservices development."
  },
  "AI & Chrome Development": {
    "tablist": ["1181810569", "1181810570", "1181810571"],
    "summary": "Resources exploring Chrome's built-in AI features, including summarization APIs and client-side scaling techniques."
  },
  "Tab AI Project": {
    "tablist": ["1181810572"],
    "summary": "GitHub repository for the Tab AI project, a system for tab categorization and summarization."
  }
}
`;

/* ---------- Initialize Firebase AI Logic (hybrid generative model) ---------- */
export async function initializeAIModel() {
  try {
    if (model) {
      return model; // already initialized
    }

    console.log("🔧 Initializing Firebase app & AI Logic (hybrid mode)...");
    // Initialize Firebase app
    firebaseApp = initializeApp(firebaseConfig);

    // Initialize AI client (use GoogleAIBackend; SDK will route on-device vs cloud as configured)
    aiInstance = getAI(firebaseApp, { backend: new GoogleAIBackend() });

    // Create a GenerativeModel configured to prefer on-device inference but fallback to cloud
    model = getGenerativeModel(aiInstance, {
      mode: InferenceMode.PREFER_ON_DEVICE,
      inCloudParams: {
        model: "gemini-2.5-flash-lite",
        temperature: 0.6,
        topK: 3
      },
      onDeviceParams: {
        createOptions: {
           temperature: 0.6,
           topK: 3
    }
      }
    });

    console.log("✅ Hybrid GenerativeModel created (PREFER_ON_DEVICE).");
    return model;
  } catch (err) {
    console.error("❌ initializeAIModel failed:", err);
    model = null;
    throw err;
  }
}

function cleanAndTrimForModel(tabData, maxChars = 3000) {
  let text = "";
  if (tabData.pageData && tabData.pageData.text) {
    text = tabData.pageData.text;
  } else if (tabData.pageData && tabData.pageData.mainContent) {
    text = tabData.pageData.mainContent;
  }
  // fallback to description
  if (!text || text.length < 50) {
    text = tabData.pageData?.meta?.description || "";
  }
  // clean
  text = text
    .replace(/[\r\n]+/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length > maxChars) {
    // simple chunking: take first + last
    const half = Math.floor(maxChars / 2);
    const start = text.slice(0, half);
    const end = text.slice(text.length - half);
    text = `${start} … ${end}`;
  }
  return text;
}

/* ---------- Format tabs (keeps same as your original function) ---------- */
export function formatTabs(tabs) {
  return tabs.map((tab) => ({
    tabId: String(tab.tabId),
    title: tab.tabInfo?.title || tab.pageData?.title || "",
    url: tab.tabInfo?.url || tab.pageData?.url || "",
    description:
      tab.pageData?.meta?.description || tab.pageData?.meta?.ogDescription || "",
    textSnippet: cleanAndTrimForModel(tab, 3000)
  }));
}

/* ---------- Main: process tabs using hybrid model ---------- */
export async function processTabsWithAI(tabsData) {
  try {
    const formattedTabs = formatTabs(tabsData);
    const inputJSON = JSON.stringify(formattedTabs);

    // Ensure model is initialized
    if (!model) {
      await initializeAIModel();
    }

    if (!model) {
      throw new Error("AI model initialization failed (no model available).");
    }

    // Build the prompt: keep system prompt + example exactly, then include the input JSON
    const prompt = `${SYSTEM_PROMPT}\n\n${USER_EXAMPLE}\n\n${inputJSON}`;

    console.log("🤖 Sending prompt to hybrid GenerativeModel (SDK will use on-device if available)...");
    // generateContent accepts an array of parts; for text-only use a single string in an array
    const result = await model.generateContent([prompt]);

    // According to the docs, result.response.text() yields the output text
    let responseText = "";
    try {
      const resp = result?.response;
      if (resp && typeof resp.text === "function") {
        responseText = resp.text();
      } else if (resp && resp?.candidates && resp.candidates[0]) {
        // fallback shape
        responseText =
          resp.candidates[0]?.content?.parts?.[0]?.text ??
          JSON.stringify(resp.candidates[0]);
      } else {
        responseText = String(result);
      }
    } catch (e) {
      console.warn("⚠️ Could not read response.text() — falling back to raw result", e);
      responseText = JSON.stringify(result);
    }

    console.log("✅ Raw model response received.");
    return parseJSONResponse(responseText);
  } catch (error) {
    console.error("❌ processTabsWithAI error:", error);
    throw error;
  }
}

/* ---------- Utility: parse JSON possibly wrapped in markdown/code fences ---------- */
function parseJSONResponse(responseText) {
  let s = String(responseText || "").trim();
  if (!s) throw new Error("Empty response from model");

  // strip typical code fences
  if (s.startsWith("```json")) {
    s = s.replace(/^```json\s*/, "").replace(/\s*```\s*$/, "");
  } else if (s.startsWith("```")) {
    s = s.replace(/^```\s*/, "").replace(/\s*```\s*$/, "");
  }

  // try to directly parse
  try {
    return JSON.parse(s);
  } catch (err) {
    // if parsing fails, try extracting first JSON-looking substring
    const match = s.match(/\{[\s\S]*\}$/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (err2) {
        console.error("Failed to parse extracted JSON substring:", err2);
        throw err;
      }
    }
    console.error("Failed to parse model response as JSON:", err);
    throw err;
  }
}

/* ---------- Destroy / cleanup (best-effort) ---------- */
export async function destroyAIModel() {
  try {
    if (model && typeof model.close === "function") {
      // if SDK provided a close() or similar, call it (best-effort)
      await model.close();
    }
  } catch (e) {
    console.warn("Failed to gracefully close model:", e);
  } finally {
    model = null;
    aiInstance = null;
    // Firebase app left in place; no explicit teardown needed in typical web apps
    console.log("🔚 AI model state cleared");
  }
}
