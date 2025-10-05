/**
 * AI Model utility for categorizing and summarizing browser tabs
 */

let model = null;

/**
 * Initialize the AI model with system prompts
 */
export async function initializeAIModel() {
  try {
    console.log('🔍 Step 1: Checking AI availability...');

    // Check if the API is available
    const availability = await LanguageModel.availability();
    console.log('Availability status:', availability);

    if (availability === 'no') {
      console.error('❌ AI is not available in this browser');
      throw new Error('AI is not available in this browser');
    }

    if (availability === 'after-download') {
      console.log('⏳ AI model needs to be downloaded first');
      // The model will download automatically when you create a session
    }

    console.log('✅ Step 2: Creating AI session...');

    // Create a session with language specified
    model = await LanguageModel.create({
      initialPrompts: [
        {
          role: "system",
          content: `You are TabsAI — an intelligent tab categorizer and summarization assistant for a browser tab manager.

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
    3. Each category includes a non-empty "tablist" and a "summary".`
        },
            {
      role: "user",
      content: `
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
`
    }
      ]
    });

    console.log('✅ AI model initialized successfully');
    return model;
  } catch (error) {
    console.error('❌ Error initializing AI model:', error.message);
    console.error(error);
    throw error;
  }
}

/**
 * Format tabs data for AI processing
 * @param {Array} tabs - Array of tab objects from Redux state
 * @returns {Array} Formatted tabs array
 */
export function formatTabs(tabs) {
  return tabs.map(tab => ({
    tabId: String(tab.tabId),
    title: tab.tabInfo?.title || tab.pageData?.title || "",
    url: tab.tabInfo?.url || tab.pageData?.url || "",
    description: tab.pageData?.meta?.description || tab.pageData?.meta?.ogDescription || ""
  }));
}

/**
 * Process tabs with AI to categorize and summarize them
 * @param {Array} tabsData - Array of tabs from Redux state
 * @returns {Object} Categorized tabs response from AI
 */
export async function processTabsWithAI(tabsData) {
  try {
    // Initialize model if not already initialized
    if (!model) {
      await initializeAIModel();
    }

    console.log('📊 Formatting tabs data for AI...');
    const formattedTabs = formatTabs(tabsData);
    const data = JSON.stringify(formattedTabs);

    console.log('🤖 Sending data to AI model...');
    console.log('Input data:', data);

    const response = await model.prompt(data);
    console.log('✅ AI response received:', response);

    // Clean response to remove any markdown formatting
    let cleanResponse = response.trim();

    // Remove markdown code blocks if present
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```\s*$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```\s*$/, '');
    }

    // Parse the JSON response
    const categorizedTabs = JSON.parse(cleanResponse);
    return categorizedTabs;
  } catch (error) {
    console.error('❌ Error processing tabs with AI:', error);
    throw error;
  }
}

/**
 * Destroy the AI model session
 */
export async function destroyAIModel() {
  if (model) {
    try {
      await model.destroy();
      model = null;
      console.log('✅ AI model session destroyed');
    } catch (error) {
      console.error('❌ Error destroying AI model:', error);
    }
  }
}
