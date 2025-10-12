// src/components/ClusterView.jsx
import React, { useState, useEffect, useRef } from "react";

export default function ClusterView({ categorizedTabs, tabsData, onRefresh, onMoveTab }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleCloseCluster = async (tabIds) => {
    if (!tabIds?.length) return;
    if (!confirm(`Close all ${tabIds.length} tabs in this cluster?`)) return;
    const numericIds = tabIds.map((id) => Number(id));
    try {
      await chrome.tabs.remove(numericIds);
      // Refresh the tabs data to update UI
      if (onRefresh) {
        setTimeout(() => onRefresh(), 300);
      }
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

        // Don't render cluster if it has no tabs
        if (clusterTabs.length === 0) return null;

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
                  <li key={tab.tabId} className="py-2.5 border-b border-slate-200 last:border-b-0 transition-all hover:bg-primary-50/50 hover:rounded-md hover:pl-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => chrome.tabs.update(Number(tab.tabId), { active: true })}
                        className="flex-1 text-left bg-transparent border-none cursor-pointer text-slate-800 text-sm font-medium transition-colors hover:text-primary-600 flex items-center gap-2 p-0"
                      >
                        {tab.tabInfo?.favIconUrl ? (
                          <img
                            src={tab.tabInfo.favIconUrl}
                            alt=""
                            className="w-4 h-4 flex-shrink-0"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        ) : (
                          <span>🔗</span>
                        )}
                        <span className="truncate">{tab.tabInfo?.title || "Untitled"}</span>
                      </button>

                      {/* Move to category button */}
                      <div className="relative" ref={openDropdown === tab.tabId ? dropdownRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === tab.tabId ? null : tab.tabId);
                          }}
                          className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-all"
                          title="Move to category"
                        >
                          ⇅
                        </button>

                        {/* Dropdown menu */}
                        {openDropdown === tab.tabId && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[180px] max-h-[200px] overflow-y-auto">
                            <div className="p-2">
                              <div className="text-[10px] text-slate-500 font-semibold mb-1 px-2">Move to:</div>
                              {Object.keys(categorizedTabs).filter(cat => cat !== category).map((targetCategory) => (
                                <button
                                  key={targetCategory}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onMoveTab) {
                                      onMoveTab(String(tab.tabId), category, targetCategory);
                                    }
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-primary-50 rounded transition-colors"
                                >
                                  📁 {targetCategory}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
