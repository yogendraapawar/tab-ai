export function listAllTabs(): Promise<chrome.tabs.Tab[]> {
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

export function removeTab(tabIds: number | number[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.tabs.remove(tabIds, () => {
      resolve();
    });
  });
}

interface CreateGroupOptions {
  tabIds: number[];
  groupId?: number;
  title?: string;
  color?: chrome.tabGroups.ColorEnum;
}

export function createOrAddToGroup(options: CreateGroupOptions): Promise<number> {
  return new Promise((resolve) => {
    // First, create/add to group (tabs.group only accepts tabIds and groupId)
    const groupOptions: chrome.tabs.GroupOptions = {
      tabIds: options.tabIds
    };

    // Add groupId if adding to existing group
    if (options.groupId) {
      groupOptions.groupId = options.groupId;
    }

    chrome.tabs.group(groupOptions, (groupId) => {
      // If we want to set title or other properties, use tabGroups.update
      if (options.title || options.color) {
        const updateProperties: chrome.tabGroups.UpdateProperties = {};
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