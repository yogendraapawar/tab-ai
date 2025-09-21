// Background service worker for Chrome Extension

console.log('Chrome Extension background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
});

// Handle extension button click - open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error('Failed to open side panel:', error);
    // Fallback: try to open side panel for current window
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
  }
});

// Handle messages from side panel or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);

  switch (request.type) {
    case 'GET_CURRENT_TAB':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse({ tab: tabs[0] });
      });
      return true; // Keep message channel open for async response

    default:
      console.log('Unknown message type:', request.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

// Optional: Listen to tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab completed loading:', tab.title);
  }
});
