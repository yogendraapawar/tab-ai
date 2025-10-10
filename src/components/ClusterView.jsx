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
    <div className="flex flex-col gap-4">
      {Object.entries(categorizedTabs).map(([category, data]) => {
        const { summary, tablist } = data;
        const clusterTabs = tabsData.filter((t) => tablist.includes(String(t.tabId)));

        return (
          <div key={category} className="bg-gradient-to-br from-primary-50/50 to-purple-50/50 border border-slate-200 rounded-xl p-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary-200">
            <div className="flex justify-between items-center mb-2">
              <h4 className="m-0 text-base font-bold text-primary-600 flex items-center gap-2">
                <span>📁</span>
                {category}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveCluster(category, tablist)}
                  className="px-3 py-1.5 text-xs bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-500 hover:text-white transition-all hover:-translate-y-0.5 shadow-sm font-semibold"
                >
                  💾 Save
                </button>
                <button
                  onClick={() => handleCloseCluster(tablist)}
                  className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all hover:-translate-y-0.5 shadow-sm font-semibold"
                >
                  ✕ Close All
                </button>
              </div>
            </div>
            {summary && <p className="text-slate-500 text-sm leading-relaxed my-2 italic">"{summary}"</p>}
            <div className="mt-3">
              <div className="text-[11px] text-slate-500 mb-2 font-semibold">
                {clusterTabs.length} tab{clusterTabs.length !== 1 ? 's' : ''}
              </div>
              <ul className="list-none m-0 p-0">
                {clusterTabs.map((tab) => (
                  <li key={tab.tabId} className="py-2.5 border-b border-slate-200 last:border-b-0 transition-all hover:bg-primary-50/50 hover:rounded-md hover:pl-2">
                    <a
                      href={tab.tabInfo?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-800 no-underline text-sm font-medium transition-colors hover:text-primary-600 flex items-center gap-2"
                    >
                      <span>🔗</span>
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
