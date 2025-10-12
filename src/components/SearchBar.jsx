// src/components/SearchBar.jsx
import React from "react";

export default function SearchBar({ query, setQuery, results = [], onOpenTab }) {
  return (
    <div className="glass-panel rounded-2xl p-5 transition-all hover:shadow-xl">
      <h3 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
        <span className="text-2xl">🔍</span>
        Search Tabs
      </h3>
      <div className="relative">
        <input
          className="w-full border-2 border-slate-200 outline-none text-base px-4 py-3.5 rounded-xl bg-white transition-all focus:border-primary-500 focus:shadow-lg focus:shadow-primary-100 font-medium placeholder:text-slate-400"
          type="text"
          placeholder="🔎 Search across all open tabs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results && results.length > 0 && (
          <div className="mt-3 border-t-2 border-slate-200 pt-3 max-h-72 overflow-y-auto">
            <div className="text-xs text-slate-500 mb-2 font-semibold">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
            {results.map((r) => (
              <div key={r.tabId} className="p-3 flex justify-between items-center rounded-lg mb-2 bg-primary-50/30 transition-all hover:bg-primary-50/60 hover:translate-x-1">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{r.tabInfo?.title || `Tab ${r.tabId}`}</div>
                  <div className="text-xs text-slate-500 truncate">{r.tabInfo?.url}</div>
                </div>
                <button 
                  onClick={() => onOpenTab(r.tabId)}
                  className="ml-3 px-3 py-1.5 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all hover:-translate-y-0.5 shadow-sm"
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
