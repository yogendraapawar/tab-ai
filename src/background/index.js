// Background service worker for Chrome Extension

console.log('Chrome Extension background script loaded');

// Message interfaces removed - using plain JavaScript

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
});

// Handle extension button click - open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (tab.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (error) {
    console.error('Failed to open side panel:', error);
    // Fallback: try to open side panel for current window
    try {
      if (tab.id) {
        await chrome.sidePanel.open({ tabId: tab.id });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
  }
});

// Handle messages from side panel or content scripts
chrome.runtime.onMessage.addListener((
  request,
  sender,
  sendResponse
) => {
  console.log('Message received:', request);

  switch (request.type) {
    case 'GET_CURRENT_TAB':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse({ tab: tabs[0] });
      });
      return true; // Keep message channel open for async response

    case 'GET_ALL_TABS_DATA':
      collectAllTabsData().then(tabsData => {
        sendResponse({ tabsData });
      });
      return true; // Keep message channel open for async response

    case 'EXTRACT_TAB_DATA':
      if (request.tabId) {
        extractTabDetails(request.tabId).then(data => {
          sendResponse({ data });
        });
      } else {
        sendResponse({ error: 'No tabId provided' });
      }
      return true; // Keep message channel open for async response

    default:
      console.log('Unknown message type:', request.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

// Optional: Listen to tab updates
chrome.tabs.onUpdated.addListener((
  tabId,
  changeInfo,
  tab
) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab completed loading:', tab.title);
  }
});



// Function to collect data from all tabs for AI processing
export async function collectAllTabsData() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, async (tabs) => {
      const tabsData = [];

      for (const tab of tabs) {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          try {
            const tabData = await extractTabDetails(tab.id);
            if (tabData) {
              tabsData.push({
                tabId: tab.id,
                tabInfo: {
                  id: tab.id,
                  title: tab.title,
                  url: tab.url,
                  favIconUrl: tab.favIconUrl,
                  windowId: tab.windowId,
                  index: tab.index,
                  pinned: tab.pinned,
                  active: tab.active,
                  audible: tab.audible,
                  mutedInfo: tab.mutedInfo,
                  groupId: tab.groupId
                },
                pageData: tabData
              });
            }
          } catch (error) {
            console.error(`Error extracting data from tab ${tab.id}:`, error);
          }
        }
      }

      resolve(tabsData);
    });
  });
}

export async function extractTabDetails(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          // Get main content area
          const mainContent = document.querySelector('main, article, .content, .main-content, .post-content')?.innerText || '';

          // Extract meaningful content for semantic analysis
          const bodyText = document.body.innerText || '';
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent?.trim()).filter(Boolean);
          const paragraphs = Array.from(document.querySelectorAll('p')).slice(0, 15).map(p => p.textContent?.trim()).filter(Boolean);

          // Combine all text content for semantic analysis
          const allText = [
            document.title,
            ...headings,
            ...paragraphs.slice(0, 8),
            mainContent.substring(0, 1500)
          ].join(' ').replace(/\s+/g, ' ').trim();

          return {
            // Basic identifiers
            title: document.title,
            url: window.location.href,
            domain: window.location.hostname,

            // Semantic content for AI analysis
            content: {
              // Combined meaningful text (first 3000 chars for better context)
              text: allText.substring(0, 3000),
              // Structured content
              headings: headings,
              paragraphs: paragraphs.slice(0, 10),
              // Main content area
              mainContent: mainContent.substring(0, 2000)
            },

            // Meta information
            meta: {
              description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
              keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
              ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''
            },

            // Context for understanding purpose
            context: {
              // Page structure indicators
              hasCode: document.querySelectorAll('code, pre').length > 0,
              hasImages: document.querySelectorAll('img').length,
              hasVideo: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0,
              hasForms: document.querySelectorAll('form').length,
              hasTables: document.querySelectorAll('table').length > 0,
              // Content length indicators
              contentLength: bodyText.length,
              headingCount: headings.length,
              paragraphCount: paragraphs.length
            },

            timestamp: Date.now()
          };
        }
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          resolve(results[0].result);
        } else {
          resolve(null);
        }
      }
    );
  });
}
