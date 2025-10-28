// src/components/ClusterView.jsx
import React, { useState, useEffect, useRef } from "react";

export default function ClusterView({ categorizedTabs, tabsData, onRefresh, onMoveTab, onRemoveFromCategory, onRemoveCategory }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [titleInput, setTitleInput] = useState("");
  const [editedTitles, setEditedTitles] = useState({});

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
      const displayName = editedTitles[category] || category;
      const folderTitle = displayName;

      // First: check if a folder with the same name already exists
      const existing = await new Promise((resolve) => {
        try {
          chrome.bookmarks.search(folderTitle, (results) => resolve(results || []));
        } catch (e) {
          resolve([]);
        }
      });
      const folderExists = Array.isArray(existing) && existing.some(item => item && item.title === folderTitle && !item.url);
      if (folderExists) {
        alert(`Bookmark folder "${folderTitle}" already exists.`);
        return;
      }

      // Confirm before saving
      if (!confirm(`Save cluster "${displayName}" to bookmarks as "${folderTitle}"?`)) return;

      const parentFolder = await chrome.bookmarks.create({ title: folderTitle });
      for (const t of tabs) {
        await chrome.bookmarks.create({
          parentId: parentFolder.id,
          title: t.tabInfo?.title || "Untitled",
          url: t.tabInfo?.url || ""
        });
      }
      alert(`Cluster "${displayName}" saved to bookmarks.`);
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
            <div className="flex justify-between items-start mb-2 gap-3">
              <h4 className="m-0 text-base font-bold text-primary-600 flex-1 flex items-start gap-2 min-w-0 pr-4 sm:pr-6">
                <span>📁</span>
                {editingCategory === category ? (
                  <div className="w-full">
                    <input
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                    />
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditedTitles(prev => ({ ...prev, [category]: titleInput.trim() || category }));
                          setEditingCategory(null);
                        }}
                        className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        title="Save"
                      >
                        ✔
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="inline-block max-w-full">
                    <span className="break-words whitespace-normal leading-snug align-baseline">
                      {editedTitles[category] || category}
                    </span>
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setTitleInput(editedTitles[category] || category);
                      }}
                      className="ml-1 align-baseline inline-flex items-center justify-center w-4 h-4 text-[10px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                      title="Edit title"
                    >
                      ✏️
                    </button>
                  </span>
                )}
              </h4>
              <div className="flex gap-2 self-start shrink-0">
                <button
                  onClick={() => handleSaveCluster(category, tablist)}
                  className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm font-semibold"
                >
                  💾 Save
                </button>
                <button
                  onClick={() => {
                    if (onRemoveCategory) {
                      if (confirm(`Close category "${category}" from the UI? This will not close any tabs.`)) {
                        onRemoveCategory(category);
                      }
                    }
                  }}
                  className="px-3 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-sm font-semibold"
                >
                  ✕ Close
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
                  <li key={tab.tabId} className="py-2.5 border-b border-slate-200 last:border-b-0 transition-all hover:bg-primary-50/50 hover:rounded-md hover:pl-2 relative overflow-visible">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <button
                        onClick={() => chrome.tabs.update(Number(tab.tabId), { active: true })}
                        className="flex-1 min-w-0 text-left bg-transparent border-none cursor-pointer text-slate-800 text-sm font-medium transition-colors hover:text-primary-600 flex items-center gap-2 p-0"
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
                        <span className="truncate min-w-0">{tab.tabInfo?.title || "Untitled"}</span>
                      </button>

                      {/* Remove from this category */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onRemoveFromCategory) {
                            if (confirm(`Remove this link from the "${category}" category?`)) {
                              onRemoveFromCategory(String(tab.tabId), category);
                            }
                          }
                        }}
                        className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-all"
                        title="Remove from this category"
                      >
                        🗑️
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
                          <div className="absolute right-0 bottom-full mb-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[180px] max-h-[200px] overflow-y-auto">
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
