// Tab utilities for Chrome extension

// Helper function to check if tab is extractable
function isExtractableTab(tab) {
  if (!tab.id || !tab.url) return false;

  // Skip Chrome internal pages
  if (tab.url.startsWith('chrome://') ||
    tab.url.startsWith('chrome-extension://')) {
    return false;
  }

  // Skip problematic domains that often cause issues
  const problematicDomains = [
    // 'google.com/search',
    // 'google.com/maps',
    // 'youtube.com',
    // 'facebook.com',
    // 'twitter.com',
    // 'instagram.com'
  ];

  return !problematicDomains.some(domain => tab.url.includes(domain));
}

// Helper function to get all tabs
function getAllTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      resolve(tabs);
    });
  });
}

// Helper function to format tab info
function formatTabInfo(tab) {
  return {
    id: tab.id,
    title: tab.title || "",
    url: tab.url || "",
    domain: tab.url ? new URL(tab.url).hostname : "",
    windowId: tab.windowId,
    favIconUrl: tab.favIconUrl,
    index: tab.index,
    pinned: tab.pinned,
    active: tab.active,
    audible: tab.audible,
    mutedInfo: tab.mutedInfo,
    groupId: tab.groupId
  };
}

// Basic tab operations
export function listAllTabs() {
  return getAllTabs();
}

export function removeTab(tabIds) {
  return new Promise((resolve) => {
    chrome.tabs.remove(tabIds, () => {
      resolve();
    });
  });
}

export function createOrAddToGroup(options) {
  return new Promise((resolve) => {
    const groupOptions = { tabIds: options.tabIds };

    if (options.groupId) {
      groupOptions.groupId = options.groupId;
    }

    chrome.tabs.group(groupOptions, (groupId) => {
      if (options.title || options.color) {
        const updateProperties = {};
        if (options.title) updateProperties.title = options.title;
        if (options.color) updateProperties.color = options.color;

        chrome.tabGroups.update(groupId, updateProperties, () => {
          resolve(groupId);
        });
      } else {
        resolve(groupId);
      }
    });
  });
}

// Content extraction functions
export async function extractTabDetails(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: extractPageContent
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.log(`extractTabDetails: Error for tab ${tabId}:`, chrome.runtime.lastError.message);
          resolve(null);
          return;
        }

        if (results && results[0] && results[0].result) {
          resolve(results[0].result);
        } else {
          resolve(null);
        }
      }
    );
  });
}

function extractPageContent() {
  const mainContentEl = document.querySelector(
    'main, article, [role="main"], .main-content, .content, .post-content, .entry-content, #main, #content'
  );
  const mainContent = mainContentEl?.innerText || '';

  const meta = {
    description: document.querySelector('meta[name="description"]')?.content || '',
    keywords: document.querySelector('meta[name="keywords"]')?.content || '',
    ogDescription: document.querySelector('meta[property="og:description"]')?.content || ''
  };

  const junkHeadings = ["navigation", "menu", "related", "footer", "share"];
  const headings = Array.from(document.querySelectorAll("h1, h2"))
    .map(h => h.textContent?.trim())
    .filter(h => h && !junkHeadings.some(j => h.toLowerCase().includes(j)));

  const paragraphs = Array.from(document.querySelectorAll("p"))
    .map(p => p.textContent?.trim())
    .filter(p => p && p.length > 30)
    .slice(0, 5);

  const truncateText = (text, maxWords = 400) =>
    text.split(/\s+/).slice(0, maxWords).join(" ");

  const allText = [
    document.title,
    meta.description,
    ...headings.slice(0, 3),
    ...paragraphs.slice(0, 5),
    truncateText(mainContent, 400)
  ].join(" ").replace(/\s+/g, " ").trim();

  return {
    title: document.title,
    url: window.location.href,
    domain: window.location.hostname,
    content: {
      text: allText,
      headings,
      paragraphs,
      mainContent: truncateText(mainContent, 500)
    },
    meta,
    // context: {
      // hasCode: document.querySelectorAll('code, pre').length > 0,
      // hasImages: document.querySelectorAll('img').length,
      // hasVideo: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0,
      // hasForms: document.querySelectorAll('form').length,
      // hasTables: document.querySelectorAll('table').length > 0,
      // contentLength: allText.length,
      // headingCount: headings.length,
      // paragraphCount: paragraphs.length
    // },
    timestamp: Date.now()
  };
}


// Main data collection function
export async function collectAllTabsData() {
  console.log('collectAllTabsData: Starting...');

  try {
    const tabs = await getAllTabs();
    console.log('collectAllTabsData: Got tabs:', tabs.length);

    const tabsData = [];
    let processedCount = 0;

    for (const tab of tabs) {
      console.log(`collectAllTabsData: Processing tab ${processedCount + 1}/${tabs.length}:`, tab.title);

      if (isExtractableTab(tab)) {
        try {
          console.log(`collectAllTabsData: Extracting data from tab ${tab.id}...`);
          const tabData = await extractTabDetails(tab.id);
          console.log(`collectAllTabsData: Got data from tab ${tab.id}:`, tabData ? 'success' : 'null');

          if (tabData) {
            tabsData.push({
              tabId: tab.id,
              tabInfo: formatTabInfo(tab),
              pageData: tabData
            });
          }
        } catch (error) {
          console.error(`Error extracting data from tab ${tab.id}:`, error);
        }
      } else {
        console.log(`collectAllTabsData: Skipping non-extractable tab ${tab.id}`);
      }

      processedCount++;
    }

    console.log('collectAllTabsData: Completed, returning', tabsData.length, 'tabs');
    return tabsData;
  } catch (error) {
    console.error('collectAllTabsData: Error:', error);
    throw error;
  }
}