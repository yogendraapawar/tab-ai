// src/components/ControlBar.jsx
import React from "react";

export default function ControlBar({
  onScan,
  onAsk,
  disabledScan,
  disabledAsk
}) {
  return (
    <div className="glass-panel flex items-center justify-between gap-4 p-4 rounded-2xl">
      <div className="flex gap-3 flex-1">
        <button 
          onClick={onScan} 
          disabled={disabledScan}
          className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          🔍 Scan Tabs
        </button>
        <button 
          onClick={onAsk} 
          disabled={disabledAsk}
          className="px-5 py-2.5 bg-primary-100 text-primary-600 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 hover:bg-primary-500 hover:text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          💬 ASK
        </button>
      </div>

    </div>
  );
}
