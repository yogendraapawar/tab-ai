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

Example Input (for illustration only):
[
{"tabId":"1181813436","title":"Market Intermediaries – Varsity by Zerodha","url":"https://zerodha.com/varsity/chapter/financial-intermediaries/","description":"Financial intermediaries facilitates your transaction in the Stock Market. They are an interconnected system of stock brokers, depositories, banks, etc.","textSnippet":"Financial intermediaries facilitates your transaction in the Stock Market. They are an interconnected system of stock brokers, depositories, banks, etc."},
{"tabId":"1181814267","title":"Best Swing Trading Strategy for Salaried Employees Hindi | Episodic Pivot ft. ‪@AnkurPatel59‬ - YouTube","url":"https://www.youtube.com/watch?v=CcVEU0M7uPQ","description":"In this in-depth interview with swing trading expert Ankur Patel, we explore proven strategies for part-time traders, including range contraction/expansion s...","textSnippet":"In this in-depth interview with swing trading expert Ankur Patel, we explore proven strategies for part-time traders, including range contraction/expansion s..."},
{"tabId":"1181813445","title":"Spring Boot Microservices Complete Tutorial - YouTube","url":"https://www.youtube.com/watch?v=ZKQWwCUEABY&t=24206s","description":"#sivalabs #java #spring #springboot #microservices #restapi #intellijidea #testing #junit #junit5 #maven #testcontainers #dockerGitHub Repository: https://gi...","textSnippet":"#sivalabs #java #spring #springboot #microservices #restapi #intellijidea #testing #junit #junit5 #maven #testcontainers #dockerGitHub Repository: https://gi..."},
{"tabId":"1181814402","title":"Programming - Interviewbit","url":"https://www.interviewbit.com/courses/programming/","description":"Learn and Practice on almost all coding interview \n    questions asked historically and get referred to the best tech companies","textSnippet":""},
{"tabId":"1181813568","title":"70 Leetcode problems in 5+ hours (every data structure) (full tutorial) - YouTube","url":"https://www.youtube.com/watch?v=lvO88XxNAzs","description":"In this video we go through the solution and problem solving logic, walking through pretty much every leetcode question you need to know to pass a tech/progr...","textSnippet":"In this video we go through the solution and problem solving logic, walking through pretty much every leetcode question you need to know to pass a tech/progr..."},
{"tabId":"1181814411","title":"sandeepB3 (sandeep)","url":"https://github.com/sandeepB3","description":"Open Source Dev | GSoC'24 @Rocket.Chat | C4GT'23 @Beckn - sandeepB3","textSnippet":"Open Source Dev | GSoC'24 @Rocket.Chat | C4GT'23 @Beckn - sandeepB3"},
{"tabId":"1181814414","title":"tanhanwei/mochi","url":"https://github.com/tanhanwei/mochi/tree/main?tab=readme-ov-file","description":"Contribute to tanhanwei/mochi development by creating an account on GitHub.","textSnippet":"Contribute to tanhanwei/mochi development by creating an account on GitHub."},
{"tabId":"1181814417","title":"added app logo · yogendraapawar/tab-ai@69e4c83","url":"https://github.com/yogendraapawar/tab-ai/commit/69e4c835163cef1fd38180e9494b776b3496afb7","description":"","textSnippet":""},
{"tabId":"1181814351","title":"Mochi - Making hard content enjoyable | Devpost","url":"https://devpost.com/software/mochi-6i7vuk#updates","description":"Mochi - Making hard content enjoyable - Mochi is a Chrome extension that adapts web content for users with reading disabilities, ADHD, and dyslexia...","textSnippet":"Mochi - Making hard content enjoyable - Mochi is a Chrome extension that adapts web content for users with reading disabilities, ADHD, and dyslexia..."},
{"tabId":"1181814354","title":"Orma | Devpost","url":"https://devpost.com/software/orma","description":"Orma - Orma is your browser's memory layer that transforms how you learn online. Instantly capture, understand, and chat with your browsing history...","textSnippet":"Orma - Orma is your browser's memory layer that transforms how you learn online. Instantly capture, understand, and chat with your browsing history..."},
{"tabId":"1181814420","title":"Google Chrome Built-in AI Challenge: Develop a web application or Chrome Extension that uses one or more Chrome built-in AI APIs to interact with integrated models such as Gemini Nano. - Devpost","url":"https://googlechromeai.devpost.com/project-gallery","description":"Develop a web application or Chrome Extension that uses one or more Chrome built-in AI APIs to interact with integrated models such as Gemini Nano.","textSnippet":"Develop a web application or Chrome Extension that uses one or more Chrome built-in AI APIs to interact with integrated models such as Gemini Nano."},
{"tabId":"1181814174","title":"Live Server - Google Docs","url":"https://docs.google.com/document/d/19GsaRF11EMb5b3jC0sFtQXn1iZQ3k4Ip7YJaCHWh9n4/edit?tab=t.0","description":"Live Server: https://prod.liveshare.vsengsaas.visualstudio.com/join?8D994062CA04633BC865FB3F32DA42BD267C   https://meet.google.com/bmw-amdx-djv   I have attached the image of the UI of this application, improve the code so that the UI is flexible and occupies screen perfectly and is appealing  Be...","textSnippet":""},
{"tabId":"1181814399","title":"What is the Model Context Protocol (MCP)? - Model Context Protocol","url":"https://modelcontextprotocol.io/docs/getting-started/intro","description":"","textSnippet":""},
{"tabId":"1181814405","title":"MCP Overview - Cline","url":"https://docs.cline.bot/mcp/mcp-overview","description":"Learn about Model Context Protocol (MCP) servers, their capabilities, and how Cline can help build and use them. MCP standardizes how applications provide context to LLMs, acting like a USB-C port for AI applications.","textSnippet":"Learn about Model Context Protocol (MCP) servers, their capabilities, and how Cline can help build and use them. MCP standardizes how applications provide context to LLMs, acting like a USB-C port for AI applications."},
{"tabId":"1181814260","title":"What Are MCP Servers? (And How I Built an AI Trading Bot on It) - YouTube","url":"https://www.youtube.com/watch?v=1iJ34tTjwwo","description":"Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube.","textSnippet":"Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube."},
{"tabId":"1181814263","title":"you need to learn MCP RIGHT NOW!! (Model Context Protocol) - YouTube","url":"https://www.youtube.com/watch?v=GuTcle5edjk","description":"🐳 Try for FREE the Docker MCP Catalog: https://dockr.ly/3UFTCj4🖥️ Download Docker Desktop: https://dockr.ly/3HgjIGjYou need to learn MCP Right Now!! The Mo...","textSnippet":"🐳 Try for FREE the Docker MCP Catalog: https://dockr.ly/3UFTCj4🖥️ Download Docker Desktop: https://dockr.ly/3HgjIGjYou need to learn MCP Right Now!! The Mo..."},
{"tabId":"1181814271","title":"Chef - YouTube","url":"https://www.youtube.com/watch?v=4W6-KQ17sDY","description":"Carl Casper is an acclaimed chef with a family life that seems as decaying as his artistic freedom. Those frustrations boil over into a raucous viral-videoed...","textSnippet":"Carl Casper is an acclaimed chef with a family life that seems as decaying as his artistic freedom. Those frustrations boil over into a raucous viral-videoed..."},
{"tabId":"1181814465","title":"Netflix","url":"https://www.netflix.com/watch/70243461?trackId=14219576&tctx=18%2C1%2C5dcb81a8-c164-41ca-a7b0-a614526b5e9f-405175091%2CNES_D8776803A501443F20E0F4C5C67759-AA8CEAE8954504-92A92C475E_p_1761644783444%2CNES_D8776803A501443F20E0F4C5C67759_p_1761644783444%2C%2C%2C%2C%2CVideo%3A70243461%2CminiDpPlayButton","description":"","textSnippet":""},
{"tabId":"1181814278","title":"(28) Global Temperatures Plummet to -100°c, A Pack of Instant Noodles Sells for $5,000! - YouTube","url":"https://www.youtube.com/watch?v=Klv85YaC_1k&list=PLu5dX6gmxYJ6H-kYM1o_42HshqsN6SjnE&index=30","description":"Name: Global Freeze: I Created an Apocalypse ShelterPlaylist: https://www.youtube.com/playlist?list=PLu5dX6gmxYJ6H-kYM1o_42HshqsN6SjnETAGS - #manhwa #manhua​...","textSnippet":"Name: Global Freeze: I Created an Apocalypse ShelterPlaylist: https://www.youtube.com/playlist?list=PLu5dX6gmxYJ6H-kYM1o_42HshqsN6SjnETAGS - #manhwa #manhua​..."},
{"tabId":"1181814429","title":"Build hybrid experiences with on-device and cloud-hosted models  |  Firebase AI Logic","url":"https://firebase.google.com/docs/ai-logic/hybrid-on-device-inference?api=dev","description":"","textSnippet":""},
{"tabId":"1181814502","title":"Devpost","url":"https://devpost.com/submit-to/25987-google-chrome-built-in-ai-challenge-2025/manage/submissions/798906-tabsense/project_details/edit","description":"","textSnippet":""},
{"tabId":"1181814454","title":"I Interviewed 300 People from Different Salary Brackets | What I Found - YouTube","url":"https://www.youtube.com/watch?v=umejNI-fafg","description":"In this video, Kirat takes you through the insights he discovered after interviewing 300 people across different salary brackets from entry-level professiona...","textSnippet":"In this video, Kirat takes you through the insights he discovered after interviewing 300 people across different salary brackets from entry-level professiona..."},
{"tabId":"1181814457","title":"Gordon Ramsay RIPS Into Microwaved Mexican Food | Kitchen Nightmares FULL EP - YouTube","url":"https://www.youtube.com/watch?v=hGwi2RhUFh8","description":"Full Episodes from the Gordon Ramsay Back catalog. #GordonRamsay #Cooking #Food","textSnippet":"Full Episodes from the Gordon Ramsay Back catalog. #GordonRamsay #Cooking #Food"},
{"tabId":"1181814438","title":"TabSense - Presentation","url":"https://www.canva.com/design/DAG3Mi53qBk/Nbk6mSZ_bLQbENzr0HVXzw/edit","description":"","textSnippet":""}
]

Example Output (for illustration only):
{
"Stock Market & Trading": {
"tablist": ["1181813436", "1181814267"],
"summary": "Resources covering financial market intermediaries, stock brokers, and swing trading strategies for part-time traders."
},
"Software Development & Programming": {
"tablist": ["1181813445", "1181814402", "1181813568"],
"summary": "Educational content on Spring Boot microservices, coding interview preparation, and LeetCode problem-solving tutorials."
},
"GitHub & Open Source Projects": {
"tablist": ["1181814411", "1181814414", "1181814417"],
"summary": "GitHub profiles, repositories, and commit history related to open-source development projects including Mochi and TabAI."
},
"Chrome Extension Development & AI Challenges": {
"tablist": ["1181814351", "1181814354", "1181814420", "1181814502", "1181814438"],
"summary": "Devpost submissions and presentations for Chrome extensions and AI challenges, including Mochi, Orma, and TabSense projects."
},
"Model Context Protocol (MCP)": {
"tablist": ["1181814399", "1181814405", "1181814260", "1181814263"],
"summary": "Documentation and video tutorials explaining Model Context Protocol servers, their capabilities, and implementation guides."
},
"Firebase AI & Development Tools": {
"tablist": ["1181814429", "1181814174"],
"summary": "Firebase documentation on hybrid AI inference models and collaborative development environments like Live Server."
},
"Entertainment & Media": {
"tablist": ["1181814271", "1181814465", "1181814278", "1181814454", "1181814457"],
"summary": "Video content including movies (Chef), Netflix streaming, manhwa recaps, career interviews, and cooking shows."
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
        cloudModel: "gemini-2.5-flash",
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
