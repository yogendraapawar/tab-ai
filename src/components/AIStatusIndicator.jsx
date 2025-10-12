// src/components/AIStatusIndicator.jsx
import React, { useState, useEffect } from "react";
import { getSettings } from "./Settings";

export default function AIStatusIndicator({ isProcessing }) {
  const [settings, setSettings] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isProcessing) {
      getSettings().then(setSettings);
    }
  }, [isProcessing]);

  if (!isProcessing || !settings) return null;

  const getModeIcon = (mode) => {
    switch (mode) {
      case "PREFER_ON_DEVICE":
        return "🔄";
      case "ON_DEVICE_ONLY":
        return "📱";
      case "CLOUD_ONLY":
        return "☁️";
      case "PREFER_CLOUD":
        return "🌐";
      default:
        return "🤖";
    }
  };

  const getModeDescription = (mode) => {
    switch (mode) {
      case "PREFER_ON_DEVICE":
        return "Preferring On-Device";
      case "ON_DEVICE_ONLY":
        return "On-Device Only";
      case "CLOUD_ONLY":
        return "Cloud Only";
      case "PREFER_CLOUD":
        return "Preferring Cloud";
      default:
        return mode;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className="glass-panel rounded-xl p-4 shadow-2xl min-w-[280px]">
        {/* Main Status */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center animate-pulse">
              <span className="text-xl">{getModeIcon(settings.inferenceMode)}</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-slate-900">AI Processing...</div>
            <div className="text-xs text-slate-500">
              {getModeDescription(settings.inferenceMode)}
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
        <div className="h-1 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-primary-500 to-purple-600 animate-progress" />
        </div>

        {/* Details Panel */}
        {showDetails && (
          <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Model:</span>
              <span className="font-semibold text-slate-700">{settings.cloudModel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Temperature:</span>
              <span className="font-semibold text-slate-700">{settings.temperature}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Top K:</span>
              <span className="font-semibold text-slate-700">{settings.topK}</span>
            </div>
            <div className="mt-3 p-2 bg-primary-50 rounded text-[10px] text-primary-700">
              💡 <strong>Tip:</strong> Check browser console for detailed logs
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

