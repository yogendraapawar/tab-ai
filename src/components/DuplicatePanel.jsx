import React, { useState } from "react";

export default function DuplicatePanel({ duplicateGroups = [], onCloseDuplicates, tabsData = [] }) {
  const [selectedKeep, setSelectedKeep] = useState({});

  if (!duplicateGroups || duplicateGroups.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-5 transition-all hover:shadow-xl">
        <h3 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
          <span className="text-2xl">🔄</span>
          Duplicate Tabs
        </h3>
        <div className="text-center py-8 text-emerald-600 font-semibold">
          <div className="text-5xl mb-2">🎉</div>
          No duplicates found!
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 transition-all hover:shadow-xl">
      <h3 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
        <span className="text-2xl">⚠️</span>
        Duplicate Candidates
      </h3>
      <div className="text-xs text-slate-500 mb-3 font-semibold">
        Found {duplicateGroups.length} duplicate group{duplicateGroups.length !== 1 ? 's' : ''}
      </div>
      <div className="flex flex-col gap-3">
        {duplicateGroups.map((g, idx) => {
          const keep = selectedKeep[idx] || g.ids[0];

          // map ids to actual tabs safely
          const groupTabs = g.ids.map((id) =>
            tabsData.find((t) => String(t.tabId) === String(id))
          ).filter(Boolean); // remove undefined

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

              <div className="flex items-center gap-2.5 flex-wrap mt-3">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <b>Keep:</b>
                  <select
                    value={keep}
                    onChange={(e) => setSelectedKeep({ ...selectedKeep, [idx]: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white cursor-pointer transition-colors focus:outline-none focus:border-primary-500"
                  >
                    {g.ids.map((id) => (
                      <option key={id} value={id}>
                        Tab {id}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => {
                    const toClose = g.ids.filter((id) => String(id) !== String(keep));
                    if (toClose.length === 0) {
                      alert("No other tabs to close in this group.");
                      return;
                    }
                    onCloseDuplicates(keep, toClose);
                  }}
                  className="px-3.5 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all hover:-translate-y-0.5 shadow-sm font-semibold"
                >
                  🗑️ Close {g.ids.length - 1} duplicate{g.ids.length - 1 !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
