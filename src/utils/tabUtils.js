import { extractTabDetails } from "../background";

export function listAllTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        console.log("Tab ID:", tab.id);
        console.log("Tab URL:", tab.url);
        console.log("Tab Title:", tab.title);
        console.log("Window ID:", tab.windowId);
        console.log("------");
      });
      resolve(tabs);
    });
  });
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
    // First, create/add to group (tabs.group only accepts tabIds and groupId)
    const groupOptions = {
      tabIds: options.tabIds
    };

    // Add groupId if adding to existing group
    if (options.groupId) {
      groupOptions.groupId = options.groupId;
    }

    chrome.tabs.group(groupOptions, (groupId) => {
      // If we want to set title or other properties, use tabGroups.update
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

export async function extract_tab_data() {
  const tabs = await listAllTabs();

  const results = await Promise.all(
    tabs.map(async (tab) => {
      // skip chrome:// pages (can't inject scripts there)
      if (!tab.url?.startsWith("http")) {
        return { ...tab, description: "", snippet: "", heading: "" };
      }

      try {
        const pageData = await extractTabDetails(tab.id);
        return {
          id: tab.id,
          title: tab.title ?? "",
          url: tab.url ?? "",
          domain: tab.url ? new URL(tab.url).hostname : "",
          windowId: tab.windowId,
          description: pageData?.description || "",
          snippet: pageData?.bodyText || "",
          heading: pageData?.headings?.[0] || "",
          // Full page data for AI
          pageData: pageData
        };
      } catch (err) {
        console.error("Failed to extract tab data:", err);
        return { ...tab, description: "", snippet: "", heading: "", pageData: null };
      }
    })
  );

  console.log("Enriched tab data:", results);
  return results;
}