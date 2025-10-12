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
    <div className="glass-panel flex items-center justify-between gap-4 p-4 rounded-2xl">
      <div className="flex gap-2 flex-1">
        <button
          onClick={onHome}
          className={`flex-1 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
            isHomeActive
              ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/30 scale-105'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:-translate-y-0.5'
          }`}
        >
          🏠 Home
        </button>
        <button
          onClick={onAsk}
          className={`flex-1 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
            isAskActive
              ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/30 scale-105'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:-translate-y-0.5'
          }`}
        >
          💬 ASK
        </button>
      </div>
    </div>
  );
}
