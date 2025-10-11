// src/App.jsx
import React, { useEffect, useState, useMemo } from "react";
import "./App.css";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  setChromeApiAvailable,
  processTabsWithProgress,
  processTabsWithAIAction,
  fetchTabsData,
  moveTabBetweenCategories,
  removeTab
} from "./store/slices/appSlice";

import ControlBar from "./components/ControlBar";
import ClusterView from "./components/ClusterView";
import DuplicatePanel from "./components/DuplicatePanel";
import Settings, { getSettings } from "./components/Settings";
import AIStatusIndicator from "./components/AIStatusIndicator";
import TabPanel from "./components/TabPanel";
import QueryTab from "./components/QueryTab";

import { detectDuplicates } from "./utils/duplicateUtils";

export default function App() {
  const dispatch = useAppDispatch();
  const {
    chromeApiAvailable,
    tabsData,
    categorizedTabs,
    loading,
    error,
    processing,
    aiProcessing
  } = useAppSelector((state) => state.app);

  // Local UI state
  const [dupThreshold, setDupThreshold] = useState(0.82);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState("main"); // "main" or "query"

  // Load settings on mount
  useEffect(() => {
    getSettings().then((settings) => {
      setDupThreshold(settings.duplicateThreshold);
    });
  }, []);

  // Check Chrome API availability on mount
  useEffect(() => {
    const checkChromeAPI = async () => {
      try {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.tabs) {
          dispatch(setChromeApiAvailable(true));
        } else {
          dispatch(setChromeApiAvailable(false));
        }
      } catch (err) {
        dispatch(setChromeApiAvailable(false));
        console.error("Error checking Chrome APIs:", err);
      }
    };
    checkChromeAPI();
  }, [dispatch]);

  // Listen for tab closures and update state
  useEffect(() => {
    if (!chromeApiAvailable) return;

    const handleTabRemoved = (tabId) => {
      dispatch(removeTab(tabId));
    };

    // Add listener for tab removal
    chrome.tabs.onRemoved.addListener(handleTabRemoved);

    // Cleanup listener on unmount
    return () => {
      chrome.tabs.onRemoved.removeListener(handleTabRemoved);
    };
  }, [chromeApiAvailable, dispatch]);

  // Action: Scan tabs (progress) -> then run AI processing
  const handleScanTabs = async () => {
    const res = await dispatch(processTabsWithProgress());
    if (res && res.payload && res.payload.length > 0) {
      // Kick off AI processing (existing action)
      dispatch(processTabsWithAIAction(res.payload));
    }
  };

  // Recompute duplicates whenever tabsData or threshold changes
  useEffect(() => {
    if (!tabsData || tabsData.length === 0) {
      setDuplicateGroups([]);
      return;
    }
    const items = tabsData.map((t) => {
      const text =
        t.pageData?.content?.text ||
        t.pageData?.mainContent ||
        t.pageData?.meta?.description ||
        t.pageData?.meta?.ogDescription ||
        "";
      return {
        tabId: String(t.tabId),
        title: t.tabInfo?.title || t.pageData?.title || "",
        url: t.tabInfo?.url || t.pageData?.url || "",
        text
      };
    });

    // basic throttling: I/O heavy; run detection in next tick
    setTimeout(() => {
      const groups = detectDuplicates(items, dupThreshold);
      setDuplicateGroups(groups);
    }, 50);
  }, [tabsData, dupThreshold]);


  // Close duplicates: given keepId and array of toClose IDs
  const handleCloseDuplicates = async (keepId, toCloseIds) => {
    if (!Array.isArray(toCloseIds) || toCloseIds.length === 0) return;
    // confirm
    const confirmMsg = `Close ${toCloseIds.length} tabs and keep tab ${keepId}?`;
    if (!confirm(confirmMsg)) return;

    try {
      // chrome.tabs.remove accepts array of ids (numbers) or single number
      const numeric = toCloseIds.map((id) => (isNaN(Number(id)) ? id : Number(id)));
      chrome.tabs.remove(numeric, () => {
        // refresh tabs list in redux
        dispatch(fetchTabsData());
        // recompute duplicates after small delay
        setTimeout(() => {
          const items = tabsData.map((t) => ({
            tabId: String(t.tabId),
            text: t.pageData?.content?.text || t.pageData?.mainContent || t.pageData?.meta?.description || ""
          }));
          setDuplicateGroups(detectDuplicates(items, dupThreshold));
        }, 700);
      });
    } catch (err) {
      console.error("Failed to close tabs:", err);
      alert("Failed to close tabs. Check extension permissions (tabs).");
    }
  };

  // Memoize counts for header
  const tabCount = tabsData?.length || 0;

  return (
    <div className="flex flex-col h-full p-5 gradient-bg overflow-hidden max-w-6xl mx-auto gap-5">
      <header className="glass-panel relative flex items-center justify-between p-4 rounded-2xl">
        {processing?.isProcessing && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100/20 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-purple-600 transition-all duration-300 shadow-lg shadow-primary-500/50"
              style={{ width: `${Math.round(processing.progress || 0)}%` }}
            />
          </div>
        )}
        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-primary-400/40 transition-transform hover:scale-105 hover:rotate-[-5deg]">
            TS
          </div>
          <div>
            <h1 className="m-0 text-2xl font-bold gradient-text">TabSense</h1>
            <p className="m-0 text-slate-500 text-xs font-medium">Summarize • Cluster • Clean</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-1.5"
            title="Settings"
          >
            ⚙️ Settings
          </button>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            chromeApiAvailable
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30"
              : "bg-red-100 text-red-600"
          }`}>
            {chromeApiAvailable ? "Chrome API ✓" : "Chrome API ✗"}
          </div>
        </div>
      </header>

      <ControlBar
        onHome={() => setActiveView("main")}
        onAsk={() => setActiveView("query")}
        activeView={activeView}
      />

      {activeView === "query" ? (
        // Query View - Full screen query interface
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col gap-4">
            <div className="glass-panel rounded-2xl p-4">
              <h2 className="text-xl font-bold text-slate-800">💬 Ask About Your Tabs</h2>
            </div>
            <QueryTab
              tabsData={tabsData}
              categorizedTabs={categorizedTabs}
              onOpenTab={(tabId) => chrome.tabs.update(Number(tabId), { active: true })}
            />
          </div>
        </main>
      ) : (
        // Main View - Original layout
        <main className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 flex-1 overflow-hidden">
          <div className="flex flex-col gap-5 overflow-y-auto pr-2">
             <TabPanel
              tabs={[
                {
                  icon: "✨",
                  label: "AI Categorized",
                  badge: categorizedTabs ? Object.keys(categorizedTabs).length : null,
                  content: (
                    <div className="h-full overflow-y-auto">
                      {aiProcessing.isProcessing && (
                        <div className="mb-3 p-3 bg-gradient-to-r from-primary-100/80 to-purple-100/80 rounded-lg text-primary-600 font-semibold text-sm">
                          ⏳ AI is processing — results will update shortly...
                        </div>
                      )}
                      {categorizedTabs ? (
                        <ClusterView
                          categorizedTabs={categorizedTabs}
                          tabsData={tabsData}
                          onRefresh={() => dispatch(fetchTabsData())}
                          onMoveTab={(tabId, fromCategory, toCategory) => {
                            dispatch(moveTabBetweenCategories({ tabId, fromCategory, toCategory }));
                          }}
                        />
                      ) : (
                        <div className="text-center py-12 text-slate-400">
                          <div className="text-6xl mb-4 opacity-50">📊</div>
                          <div className="font-semibold mb-2 text-lg">No categories yet</div>
                          <div className="text-sm">Click "💬 ASK" to query your tabs or scan them first</div>
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  icon: "🔄",
                  label: "Duplicate Tabs",
                  badge: duplicateGroups.length > 0 ? duplicateGroups.length : null,
                  content: (
                    <div className="h-full overflow-y-auto">
                      {duplicateGroups.length === 0 ? (
                        <div className="text-center py-12 text-emerald-600">
                          <div className="text-6xl mb-4">🎉</div>
                          <div className="font-semibold text-lg">No duplicates found!</div>
                        </div>
                      ) : (
                        <div className="space-y-3 pr-2">
                          {duplicateGroups.map((g, idx) => {
                            const groupTabs = g.ids.map((id) =>
                              tabsData.find((t) => String(t.tabId) === String(id))
                            ).filter(Boolean);

                            return (
                              <div key={idx} className="bg-gradient-to-br from-red-50/80 to-red-100/50 border border-red-200 rounded-xl p-3.5 transition-all hover:shadow-sm hover:border-red-300">
                                <div className="flex justify-between items-center mb-2">
                                  <strong className="text-red-600 text-sm flex items-center gap-2">
                                    <span>🔗</span>
                                    Group #{idx + 1}
                                  </strong>
                                  <span className="text-slate-500 text-xs">
                                    {(g.avgScore * 100).toFixed(0)}% similar
                                  </span>
                                </div>

                                <div className="my-3 p-2.5 bg-white/80 rounded-lg">
                                  {groupTabs.map((tab) => (
                                    <a
                                      key={tab.tabId}
                                      href={tab.tabInfo?.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block text-sm text-slate-800 no-underline py-1.5 border-b border-dashed border-slate-200 last:border-b-0 transition-colors hover:text-primary-600 flex items-center gap-2"
                                    >
                                      <span>📄</span>
                                      {tab.tabInfo?.title || tab.tabInfo?.url}
                                    </a>
                                  ))}
                                </div>

                                <button
                                  onClick={() => {
                                    const keep = g.ids[0];
                                    const toClose = g.ids.filter((id) => String(id) !== String(keep));
                                    if (toClose.length === 0) {
                                      alert("No other tabs to close in this group.");
                                      return;
                                    }
                                    handleCloseDuplicates(keep, toClose);
                                  }}
                                  className="w-full px-3.5 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all hover:-translate-y-0.5 shadow-sm font-semibold"
                                >
                                  🗑️ Close {g.ids.length - 1} duplicate{g.ids.length - 1 !== 1 ? 's' : ''} (Keep Tab {g.ids[0]})
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  icon: "📑",
                  label: "All Tabs",
                  badge: tabCount || null,
                  content: (
                    <div className="h-full overflow-y-auto">
                      {tabsData.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <div className="text-6xl mb-4 opacity-50">🗂️</div>
                          <div className="font-semibold text-lg">No tabs found</div>
                        </div>
                      ) : (
                        <div className="space-y-2 pr-2">
                          {tabsData.map((t) => (
                            <div key={t.tabId} className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50/30 to-purple-50/30 border border-slate-200 rounded-xl transition-all hover:translate-x-1 hover:shadow-sm hover:border-primary-200">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {t.tabInfo?.favIconUrl ? (
                                  <img
                                    src={t.tabInfo.favIconUrl}
                                    alt=""
                                    className="w-4 h-4 flex-shrink-0"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                ) : (
                                  <span className="text-sm">🔗</span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-slate-900 truncate">{t.tabInfo?.title || "Untitled"}</div>
                                  <div className="text-xs text-slate-500 truncate">{t.tabInfo?.url || "No url"}</div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-3">
                                <button
                                  onClick={() => chrome.tabs.update(Number(t.tabId), { active: true })}
                                  className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all hover:-translate-y-0.5 shadow-sm"
                                >
                                  Open
                                </button>
                                <button
                                  onClick={() => {
                                    chrome.tabs.remove(Number(t.tabId));
                                    setTimeout(() => dispatch(fetchTabsData()), 300);
                                  }}
                                  title="Close tab"
                                  className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all hover:-translate-y-0.5 shadow-sm"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
              ]}
            />
          </div>

          <aside className="flex flex-col gap-5 overflow-y-auto pr-2">
            <div className="glass-panel rounded-2xl p-4">
              <h4 className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <span className="text-lg">⚡</span>
                Quick Actions
              </h4>
              <button
                onClick={handleScanTabs}
                disabled={aiProcessing.isProcessing}
                className="w-full mb-2 px-4 py-2 text-sm bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all hover:-translate-y-0.5 shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔍 Scan Tabs
              </button>
              <button
                onClick={() => {
                  dispatch(fetchTabsData());
                }}
                className="w-full mb-2 px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all hover:-translate-y-0.5 shadow-sm font-semibold"
              >
                🔄 Refresh Tabs
              </button>
              <button
                onClick={() => {
                  chrome.tabs.create({ url: "https://developer.chrome.com/docs/ai" });
                }}
                className="w-full px-4 py-2 text-sm bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-500 hover:text-white transition-all hover:-translate-y-0.5 shadow-sm font-semibold"
              >
                📚 View Docs
              </button>
            </div>
          </aside>
        </main>
      )}

      <footer className="mt-auto pt-4 text-center text-white/80 text-xs font-medium">
        <small>TabSense — Built with Chrome AI • Hybrid mode available</small>
      </footer>

      {/* Settings Modal */}
      <Settings
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          // Reload settings after closing
          getSettings().then((settings) => {
            setDupThreshold(settings.duplicateThreshold);
          });
        }}
      />

      {/* AI Status Indicator */}
      <AIStatusIndicator isProcessing={aiProcessing.isProcessing || processing.isProcessing} />
    </div>
  );
}
