// src/components/ControlBar.jsx
import React from "react";

export default function ControlBar({
  onHome,
  onAsk,
  activeView
}) {
  const isHomeActive = activeView === "main";
  const isAskActive = activeView === "query";

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex gap-2 flex-1">
        <button
          onClick={onHome}
          className={`flex-1 px-3 py-2 rounded-xl font-semibold text-sm transition-colors ${
            isHomeActive
              ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/30 scale-105'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          🏠 Home
        </button>
        <button
          onClick={onAsk}
          className={`flex-1 px-3 py-2 rounded-xl font-semibold text-sm transition-colors ${
            isAskActive
              ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/30 scale-105'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          💬 ASK
        </button>
      </div>
    </div>
  );
}
