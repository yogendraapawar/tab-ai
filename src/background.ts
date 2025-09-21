// Background service worker for Chrome Extension

console.log('Chrome Extension background script loaded');

interface MessageRequest {
  type: string;
  [key: string]: any;
}

interface MessageResponse {
  tab?: chrome.tabs.Tab;
  error?: string;
  [key: string]: any;
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  console.log('Extension installed:', details.reason);
});

// Handle extension button click - open side panel
chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
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
  request: MessageRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
) => {
  console.log('Message received:', request);

  switch (request.type) {
    case 'GET_CURRENT_TAB':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
        sendResponse({ tab: tabs[0] });
      });
      return true; // Keep message channel open for async response

    default:
      console.log('Unknown message type:', request.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

// Optional: Listen to tab updates
chrome.tabs.onUpdated.addListener((
  tabId: number,
  changeInfo: { status?: string; url?: string; title?: string; [key: string]: any },
  tab: chrome.tabs.Tab
) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab completed loading:', tab.title);
  }
});
