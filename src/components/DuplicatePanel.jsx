import React, { useState } from "react";

export default function DuplicatePanel({ duplicateGroups = [], onCloseDuplicates, tabsData = [] }) {
  const [selectedKeep, setSelectedKeep] = useState({});

  if (!duplicateGroups || duplicateGroups.length === 0) {
    return (
      <div className="panel">
        <h3 className="panel-title">Duplicate Tabs</h3>
        <div className="muted">No duplicates found 🎉</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3 className="panel-title">Duplicate Candidates</h3>
      <div className="duplicates-list">
        {duplicateGroups.map((g, idx) => {
          const keep = selectedKeep[idx] || g.ids[0];

          // map ids to actual tabs safely
          const groupTabs = g.ids.map((id) =>
            tabsData.find((t) => String(t.tabId) === String(id))
          ).filter(Boolean); // remove undefined

          return (
            <div key={idx} className="dup-card">
              <div className="dup-header">
                <strong>Group #{idx + 1}</strong>
                <span className="muted">Avg similarity: {g.avgScore.toFixed(2)}</span>
              </div>

              <div className="dup-urls">
                {groupTabs.map((tab) => (
                  <a key={tab.tabId} href={tab.tabInfo?.url} target="_blank" rel="noreferrer">
                    {tab.tabInfo?.title || tab.tabInfo?.url}
                  </a>
                ))}
              </div>

              <div className="dup-actions" style={{ marginTop: 10 }}>
                <label>
                  <b>Keep:</b>
                  <select
                    value={keep}
                    onChange={(e) => setSelectedKeep({ ...selectedKeep, [idx]: e.target.value })}
                    style={{ marginLeft: 8 }}
                  >
                    {g.ids.map((id) => (
                      <option key={id} value={id}>
                        Tab {id}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="danger"
                  style={{ marginLeft: 10 }}
                  onClick={() => {
                    const toClose = g.ids.filter((id) => String(id) !== String(keep));
                    if (toClose.length === 0) {
                      alert("No other tabs to close in this group.");
                      return;
                    }
                    onCloseDuplicates(keep, toClose);
                  }}
                >
                  Close duplicates (keep {keep})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
