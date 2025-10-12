// src/components/TabScanningIndicator.jsx
import React, { useState, useEffect } from "react";

export default function TabScanningIndicator({ isScanning, progress, totalTabs, aiProcessing = false }) {
  const [showDetails, setShowDetails] = useState(false);
  const [actualTotalTabs, setActualTotalTabs] = useState(totalTabs);

  // Get total tabs from Chrome API when scanning starts
  useEffect(() => {
    if (isScanning && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        if (tabs && tabs.length > 0) {
          setActualTotalTabs(tabs.length);
        }
      });
    }
  }, [isScanning]);

  // Update totalTabs if provided value changes
  useEffect(() => {
    if (totalTabs > 0) {
      setActualTotalTabs(totalTabs);
    }
  }, [totalTabs]);

  if (!isScanning) return null;

  const scannedTabs = Math.round((progress / 100) * actualTotalTabs);
  const progressPercent = Math.min(100, Math.max(0, progress));

  // Position below AI indicator if both are active
  const topPosition = aiProcessing ? "top-36" : "top-4";

  return (
    <div className={`fixed ${topPosition} right-4 z-50 animate-slide-up`}>
      <div className="glass-panel rounded-xl p-4 shadow-2xl min-w-[280px]">
        {/* Main Status */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center animate-pulse">
              <span className="text-xl">🔄</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-slate-900">Scanning Tabs...</div>
            <div className="text-xs text-slate-500">
              {scannedTabs} of {actualTotalTabs} tabs
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-slate-400 hover:text-slate-600 transition-colors text-xs"
          >
            {showDetails ? "▼" : "▶"}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Progress</span>
            <span className="font-semibold text-slate-700">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Details Panel */}
        {showDetails && (
          <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-semibold text-blue-600">
                {progressPercent < 100 ? 'In Progress' : 'Completing...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tabs Scanned:</span>
              <span className="font-semibold text-slate-700">{scannedTabs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Remaining:</span>
              <span className="font-semibold text-slate-700">{actualTotalTabs - scannedTabs}</span>
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded text-[10px] text-blue-700">
              💡 <strong>Tip:</strong> Large numbers of tabs may take a moment
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
