// src/components/ClusterView.jsx
import React from "react";

export default function ClusterView({ categorizedTabs, tabsData }) {

  const handleCloseCluster = async (tabIds) => {
    if (!tabIds?.length) return;
    if (!confirm(`Close all ${tabIds.length} tabs in this cluster?`)) return;
    const numericIds = tabIds.map((id) => Number(id));
    try {
      await chrome.tabs.remove(numericIds);
    } catch (err) {
      console.error("Failed to close cluster tabs:", err);
    }
  };

  const handleSaveCluster = async (category, tabIds) => {
    if (!tabIds?.length) return;
    try {
      const tabs = tabsData.filter((t) => tabIds.includes(String(t.tabId)));
      const parentFolder = await chrome.bookmarks.create({ title: `TabSense - ${category}` });
      for (const t of tabs) {
        await chrome.bookmarks.create({
          parentId: parentFolder.id,
          title: t.tabInfo?.title || "Untitled",
          url: t.tabInfo?.url || ""
        });
      }
      alert(`Cluster "${category}" saved to bookmarks.`);
    } catch (err) {
      console.error("Failed to save cluster:", err);
      alert("Unable to save cluster — check bookmarks permission.");
    }
  };

  return (
    <div className="clusters-grid">
      {Object.entries(categorizedTabs).map(([category, data]) => {
        const { summary, tablist } = data;
        const clusterTabs = tabsData.filter((t) => tablist.includes(String(t.tabId)));

        return (
          <div key={category} className="category-card">
            <div className="category-head">
              <h4>{category}</h4>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className="secondary"
                  onClick={() => handleSaveCluster(category, tablist)}
                >
                  Save
                </button>
                <button
                  className="danger"
                  onClick={() => handleCloseCluster(tablist)}
                >
                  Close
                </button>
              </div>
            </div>
            {summary && <p className="category-summary">{summary}</p>}
            <div className="category-tabs">
              <ul>
                {clusterTabs.map((tab) => (
                  <li key={tab.tabId} className="cat-tab-row">
                    <a
                      href={tab.tabInfo?.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {tab.tabInfo?.title || "Untitled"}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
