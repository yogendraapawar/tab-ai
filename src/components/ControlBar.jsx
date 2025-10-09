// src/components/ControlBar.jsx
import React from "react";

export default function ControlBar({
  onScan,
  onOrganize,
  disabledScan,
  disabledOrganize,
  dupThreshold,
  setDupThreshold
}) {
  return (
    <div className="control-bar">
      <div className="controls-left">
        <button className="primary" onClick={onScan} disabled={disabledScan}>
          Scan Tabs
        </button>
        <button className="secondary" onClick={onOrganize} disabled={disabledOrganize}>
          Organize (AI)
        </button>
      </div>

      <div className="controls-right">
        <label className="small">
          Duplicate threshold
          <input
            type="range"
            min="0.6"
            max="0.95"
            step="0.01"
            value={dupThreshold}
            onChange={(e) => setDupThreshold(Number(e.target.value))}
          />
          <span className="muted">{dupThreshold}</span>
        </label>
      </div>
    </div>
  );
}
