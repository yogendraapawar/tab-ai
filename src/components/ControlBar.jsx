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
          onClick={onOrganize} 
          disabled={disabledOrganize}
          className="px-5 py-2.5 bg-primary-100 text-primary-600 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 hover:bg-primary-500 hover:text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          ✨ Organize (AI)
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
          <span className="text-xs font-semibold">Duplicate Threshold</span>
          <input
            type="range"
            min="0.6"
            max="0.95"
            step="0.01"
            value={dupThreshold}
            onChange={(e) => setDupThreshold(Number(e.target.value))}
            className="w-32 h-1.5 bg-gradient-to-r from-primary-100 to-primary-500 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-primary-500 [&::-webkit-slider-thumb]:to-purple-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-primary-400/40 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-primary-500 [&::-moz-range-thumb]:to-purple-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
          />
          <span className="min-w-[40px] text-center font-semibold text-primary-600">{dupThreshold.toFixed(2)}</span>
        </label>
      </div>
    </div>
  );
}
