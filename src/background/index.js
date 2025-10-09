// Background service worker for Chrome Extension

console.log('Chrome Extension background script loaded');

// Import tab utilities
import { collectAllTabsData, extractTabDetails } from '../utils/tabUtils.js';

// Test if functions are imported
console.log('collectAllTabsData function:', typeof collectAllTabsData);
console.log('extractTabDetails function:', typeof extractTabDetails);

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
      console.log('Processing GET_ALL_TABS_DATA request');
      console.log('collectAllTabsData type:', typeof collectAllTabsData);

      if (typeof collectAllTabsData !== 'function') {
        console.error('collectAllTabsData is not a function!');
        sendResponse({ error: 'Function not imported' });
        return true;
      }

      collectAllTabsData().then(tabsData => {
        console.log('Sending response with tabsData:', tabsData.length, 'tabs');
        sendResponse({ tabsData });
      }).catch(error => {
        console.error('Error in collectAllTabsData:', error);
        sendResponse({ error: error.message });
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