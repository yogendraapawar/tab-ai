// src/components/SearchBar.jsx
import React from "react";

export default function SearchBar({ query, setQuery, results = [], onOpenTab }) {
  return (
    <div className="panel">
      <h3 className="panel-title">🔍 Search Tabs</h3>
      <div className="search-panel">
        <input
          className="search-input"
          type="text"
          placeholder="Search across all open tabs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results && results.length > 0 && (
          <div className="search-results">
            {results.map((r) => (
              <div key={r.tabId} className="search-row">
                <div>
                  <div className="search-title">{r.tabInfo?.title || `Tab ${r.tabId}`}</div>
                  
                </div>
                <button onClick={() => onOpenTab(r.tabId)}>Open</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
