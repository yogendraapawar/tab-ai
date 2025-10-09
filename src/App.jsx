// src/App.jsx
import React, { useEffect, useState, useMemo } from "react";
import "./App.css";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  setChromeApiAvailable,
  processTabsWithProgress,
  processTabsWithAIAction,
  fetchTabsData
} from "./store/slices/appSlice";

import ControlBar from "./components/ControlBar";
import ClusterView from "./components/ClusterView";
import DuplicatePanel from "./components/DuplicatePanel";
import SearchBar from "./components/SearchBar";

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
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState("");

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

  // Search handler (naive semantic: title + summary + url)
  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const q = query.trim().toLowerCase();
    const results = [];

    // Search categorizedTabs summaries first (if available)
    if (categorizedTabs) {
      Object.entries(categorizedTabs).forEach(([cat, data]) => {
        if ((data.summary || "").toLowerCase().includes(q) || cat.toLowerCase().includes(q)) {
          data.tablist.forEach((id) => {
            const tab = tabsData.find((t) => String(t.tabId) === String(id));
            if (tab) results.push(tab);
          });
        }
      });
    }

    // Fallback search in raw tabs (title, url, text)
    tabsData.forEach((t) => {
      const needle = `${t.tabInfo?.title || ""} ${t.tabInfo?.url || ""} ${t.pageData?.content?.text || ""}`.toLowerCase();
      if (needle.includes(q)) results.push(t);
    });

    // Deduplicate results
    const uniq = [];
    const ids = new Set();
    for (const r of results) {
      if (!ids.has(String(r.tabId))) {
        ids.add(String(r.tabId));
        uniq.push(r);
      }
    }
    setSearchResults(uniq.slice(0, 50));
  }, [query, categorizedTabs, tabsData]);

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
    <div className="extension-popup">
      <header className="popup-header">
        {processing?.isProcessing && (
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.round(processing.progress || 0)}%` }}
            />
          </div>
        )}
        <div className="brand">
          <div className="logo">TS</div>
          <div>
            <h1>TabSense</h1>
            <p className="subtitle">Summarize • Cluster • Clean</p>
          </div>
        </div>
        <div className={`api-badge ${chromeApiAvailable ? "on" : "off"}`}>
          {chromeApiAvailable ? "Chrome API ✓" : "Chrome API ✗"}
        </div>
      </header>

      <ControlBar
        onScan={handleScanTabs}
        onOrganize={() => dispatch(processTabsWithAIAction(tabsData))}
        disabledScan={loading || processing.isProcessing || aiProcessing.isProcessing}
        disabledOrganize={tabsData.length === 0 || aiProcessing.isProcessing}
        dupThreshold={dupThreshold}
        setDupThreshold={setDupThreshold}
      />

      <main className="popup-main">
        <div className="left-col">
          <SearchBar
            query={query}
            setQuery={setQuery}
            results={searchResults}
            onOpenTab={(tabId) => chrome.tabs.update(Number(tabId), { active: true })}
          />

          <div className="panel">
            <h3 className="panel-title">AI Categorized Tabs</h3>
            {aiProcessing.isProcessing && <div className="muted">AI is processing — results will update shortly.</div>}
            {categorizedTabs ? (
              <ClusterView categorizedTabs={categorizedTabs} tabsData={tabsData} />
            ) : (
              <div className="muted">No categories yet — run Organize.</div>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title">All Open Tabs ({tabCount})</h3>
            <div className="tabs-scroll">
              {tabsData.map((t) => (
                <div key={t.tabId} className="tab-row">
                  <div className="tab-meta">
                    <div className="tab-title">{t.tabInfo?.title || "Untitled"}</div>
                    <div className="tab-url">{t.tabInfo?.url || "No url"}</div>
                  </div>
                  <div className="tab-actions">
                    <button onClick={() => chrome.tabs.update(Number(t.tabId), { active: true })}>Open</button>
                    <button onClick={() => chrome.tabs.remove(Number(t.tabId))} title="Close tab">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="right-col">
          <DuplicatePanel
            duplicateGroups={duplicateGroups}
            onCloseDuplicates={handleCloseDuplicates}
          />

          <div className="panel small">
            <h4>Quick actions</h4>
            <button
              onClick={() => {
                // open settings / docs link
                chrome.tabs.create({ url: "https://developer.chrome.com/docs/ai" });
              }}
            >
              Docs
            </button>
            <button onClick={() => {
              // refresh tabs
              dispatch(fetchTabsData());
            }}>Refresh tabs</button>
          </div>

        </aside>
      </main>

      <footer className="popup-footer">
        <small>TabSense — Built with Chrome AI • Hybrid mode available</small>
      </footer>
    </div>
  );
}
