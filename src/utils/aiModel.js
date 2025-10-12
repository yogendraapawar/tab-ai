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
const SYSTEM_PROMPT = `You are TabsAI — an intelligent browser tab categorization and summarization assistant.

Your task:
Given an array of open browser tabs, where each tab includes:
{ tabId, title, url, metadata, pageContent },
analyze all tabs and group them into clear, meaningful thematic categories based on their content and purpose.

🚨 CRITICAL RULE - ONE TAB, ONE CATEGORY:
Each unique tab (tabId) MUST appear in EXACTLY ONE category - never in multiple categories.
A tabId appearing in more than one category is strictly forbidden and will cause errors.

Rules & Requirements:

1. Categorization (STRICT ONE-TO-ONE MAPPING)

* Every tab must belong to EXACTLY ONE category - NO EXCEPTIONS.
* No tabId may be skipped, duplicated, or assigned to multiple categories.
* If a tab could fit multiple themes, choose the SINGLE MOST RELEVANT category.
* Categories should be derived from semantic similarity — topic, theme, intent, or context.
* DO NOT duplicate any tabId across different categories.

2. Category Structure
   Each category must include:

* "tablist" → an array of UNIQUE tabIds grouped under this category (NO DUPLICATES).
* "summary" → a concise 1–2 sentence explanation describing what unites the tabs in that category.

3. Output Format
   Return only one valid JSON object, structured exactly like this:
   {
   "CategoryName1": {
   "tablist": ["tabId1", "tabId2", ...],
   "summary": "Brief, neutral summary describing the category's theme."
   },
   "CategoryName2": {
   "tablist": ["tabId3", "tabId4", ...],
   "summary": "Brief, neutral summary describing the category's theme."
   }
   }

4. Category Naming

* Category names must be concise, thematic, and human-readable.
* You are free to create any relevant categories — not limited to predefined examples.
* Use general labels (e.g., "Miscellaneous", "Uncategorized") only when no clear thematic link exists.

5. Validation Criteria (ENFORCE UNIQUENESS)

* Every tabId from the input array appears EXACTLY ONCE across all tablists (NO DUPLICATES).
* No tabId should appear in more than one category's tablist.
* Each category has:

  * A non-empty "tablist" with UNIQUE tabIds.
  * A meaningful "summary".
* The final output must be valid JSON only, with no explanations, markdown, or text outside the JSON object.

Example Output (for illustration only):
{
"Financial Intermediation": {
"tablist": ["1181810563"],
"summary": "Pages discussing institutions that connect investors, brokers, and banks in financial systems."
},
"AI Development Tools": {
"tablist": ["1181810564", "1181810565"],
"summary": "Tabs focused on frameworks, APIs, and tools for building and deploying AI models."
},
"Market Research": {
"tablist": ["1181810566", "1181810567"],
"summary": "Articles and dashboards analyzing business trends, consumer data, and market insights."
}
}

Your goal:
Generate the final categorized JSON output according to these rules, ensuring every tab is represented once and all categories are semantically coherent.

Below is the input JSON:
`;


/* ---------- Get settings from Chrome storage ---------- */
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get("tabSenseSettings", (result) => {
      const defaultSettings = {
        inferenceMode: "PREFER_ON_DEVICE",
        cloudModel: "gemini-2.0-flash-exp",
        temperature: 0.6,
        topK: 3,
        maxOutputTokens: 8192,
      };
      resolve({ ...defaultSettings, ...result.tabSenseSettings });
    });
  });
}

/* ---------- Initialize Firebase AI Logic (hybrid generative model) ---------- */
export async function initializeAIModel(forceReinit = false) {
  try {
    if (model && !forceReinit) {
      return model; // already initialized
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔧 INITIALIZING AI MODEL");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Get user settings
    const settings = await getSettings();
    console.log("📋 User Settings:");
    console.log(`   • Inference Mode: ${settings.inferenceMode}`);
    console.log(`   • Cloud Model: ${settings.cloudModel}`);
    console.log(`   • Temperature: ${settings.temperature}`);
    console.log(`   • Top K: ${settings.topK}`);
    console.log(`   • Max Output Tokens: ${settings.maxOutputTokens}`);

    // Initialize Firebase app (only once)
    if (!firebaseApp) {
      console.log("🔥 Initializing Firebase app...");
      firebaseApp = initializeApp(firebaseConfig);
      console.log("✅ Firebase app initialized");
    }

    // Initialize AI client (use GoogleAIBackend; SDK will route on-device vs cloud as configured)
    if (!aiInstance) {
      console.log("🤖 Creating AI instance with GoogleAIBackend...");
      aiInstance = getAI(firebaseApp, { backend: new GoogleAIBackend() });
      console.log("✅ AI instance created");
    }

    // Map string mode to InferenceMode enum
    const modeMap = {
      "PREFER_ON_DEVICE": InferenceMode.PREFER_ON_DEVICE,
      "PREFER_CLOUD": InferenceMode.PREFER_CLOUD,
      "ON_DEVICE_ONLY": InferenceMode.ON_DEVICE_ONLY,
      "CLOUD_ONLY": InferenceMode.CLOUD_ONLY,
    };
    const inferenceMode = modeMap[settings.inferenceMode] || InferenceMode.PREFER_ON_DEVICE;

    console.log("⚙️  Creating GenerativeModel with configuration...");
    // Create a GenerativeModel with user settings
    model = getGenerativeModel(aiInstance, {
      mode: inferenceMode,
      inCloudParams: {
        model: settings.cloudModel,
        temperature: settings.temperature,
        topK: settings.topK,
        maxOutputTokens: settings.maxOutputTokens,
      },
      onDeviceParams: {
        createOptions: {
          temperature: settings.temperature,
          topK: settings.topK,
          maxOutputTokens: settings.maxOutputTokens,
        }
      }
    });

    console.log("✅ GenerativeModel created successfully!");
    console.log(`📍 Mode: ${settings.inferenceMode}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return model;
  } catch (err) {
    console.error("❌ initializeAIModel failed:", err);
    model = null;
    throw err;
  }
}

/* ---------- Reset model (useful when settings change) ---------- */
export function resetAIModel() {
  model = null;
  console.log("🔄 AI Model reset. Will reinitialize on next use.");
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
    const prompt = `${SYSTEM_PROMPT}\n\n${inputJSON}`;
    console.log("Prompt:", prompt);

    // Get current settings to show execution context
    const settings = await getSettings();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 STARTING AI PROCESSING");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Configuration:");
    console.log(`   • Mode: ${settings.inferenceMode}`);
    console.log(`   • Cloud Model: ${settings.cloudModel}`);
    console.log(`   • Temperature: ${settings.temperature}`);
    console.log(`   • Top K: ${settings.topK}`);
    console.log(`   • Max Tokens: ${settings.maxOutputTokens}`);
    console.log(`   • Tabs to Process: ${tabsData.length}`);
    console.log(`   • Prompt Size: ${prompt.length} characters`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const startTime = performance.now();
    console.log("⏱️  Starting generateContent() call...");
    console.log("🤖 Sending to AI model (SDK will route based on mode)...");

    // generateContent accepts an array of parts; for text-only use a single string in an array
    const result = await model.generateContent([prompt]);

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ AI PROCESSING COMPLETE in ${duration}s`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Try to detect which backend was used
    console.log("📊 Response Details:");
    if (result?.response) {
      console.log(`   • Has Response: ✓`);
      console.log(`   • Candidates: ${result.response.candidates?.length || 0}`);

      // Try to detect execution location
      const metadata = result.response.metadata || result.metadata;
      if (metadata) {
        console.log("   • Metadata:", metadata);
      }

      // Check for on-device indicators
      if (result.onDevice !== undefined) {
        console.log(`   • Executed: ${result.onDevice ? '📱 ON-DEVICE' : '☁️  CLOUD'}`);
      }
    }

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

    console.log(`   • Response Length: ${responseText.length} characters`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 Parsing JSON response...");

    const parsed = parseJSONResponse(responseText);
    const categoryCount = Object.keys(parsed).length;
    console.log(`✅ Successfully parsed ${categoryCount} categories`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return parsed;
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
