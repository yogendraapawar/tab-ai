// src/components/Settings.jsx
import React, { useState, useEffect } from "react";
import { resetAIModel } from "../utils/aiModel";

const DEFAULT_SETTINGS = {
  // AI Model Settings
  inferenceMode: "PREFER_ON_DEVICE",
  cloudModel: "gemini-2.0-flash-exp",
  temperature: 0.6,
  topK: 3,
  maxOutputTokens: 8192,
  
  // Duplicate Detection
  duplicateThreshold: 0.82,
  
  // UI Preferences
  showEmojis: true,
  autoRefresh: false,
};

export default function Settings({ isOpen, onClose }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings from Chrome storage
  useEffect(() => {
    if (isOpen) {
      chrome.storage.sync.get("tabSenseSettings", (result) => {
        if (result.tabSenseSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...result.tabSenseSettings });
        }
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await chrome.storage.sync.set({ tabSenseSettings: settings });
      // Reset AI model so new settings take effect
      resetAIModel();
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all settings to defaults?")) {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-panel rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold gradient-text">Settings</h2>
              <p className="text-sm text-slate-500">Configure your TabSense experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Model Settings */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-xl">🤖</span>
              AI Model Configuration
            </h3>
            
            <div className="space-y-4">
              {/* Inference Mode */}
              <div className="bg-gradient-to-r from-primary-50/30 to-purple-50/30 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Inference Mode
                </label>
                <select
                  value={settings.inferenceMode}
                  onChange={(e) => updateSetting("inferenceMode", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="PREFER_ON_DEVICE">Prefer On-Device (Faster, Private)</option>
                  <option value="PREFER_CLOUD">Prefer Cloud (More Powerful)</option>
                  <option value="ON_DEVICE_ONLY">On-Device Only</option>
                  <option value="CLOUD_ONLY">Cloud Only</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Choose how AI processes your tabs. On-device is faster and more private.
                </p>
              </div>

              {/* Cloud Model */}
              <div className="bg-gradient-to-r from-primary-50/30 to-purple-50/30 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Cloud Model
                </label>
                <select
                  value={settings.cloudModel}
                  onChange={(e) => updateSetting("cloudModel", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Model used when running in cloud mode.
                </p>
              </div>

              {/* Temperature */}
              <div className="bg-gradient-to-r from-primary-50/30 to-purple-50/30 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Temperature: {settings.temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => updateSetting("temperature", parseFloat(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-primary-100 to-primary-500 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-primary-500 [&::-webkit-slider-thumb]:to-purple-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary-400/40 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Controls randomness: 0 = focused, 1 = creative
                </p>
              </div>

              {/* Top K */}
              <div className="bg-gradient-to-r from-primary-50/30 to-purple-50/30 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Top K: {settings.topK}
                </label>
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  value={settings.topK}
                  onChange={(e) => updateSetting("topK", parseInt(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-primary-100 to-primary-500 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-primary-500 [&::-webkit-slider-thumb]:to-purple-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary-400/40 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Number of highest probability tokens to consider
                </p>
              </div>

              {/* Max Output Tokens */}
              <div className="bg-gradient-to-r from-primary-50/30 to-purple-50/30 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Max Output Tokens: {settings.maxOutputTokens}
                </label>
                <input
                  type="range"
                  min="1024"
                  max="16384"
                  step="1024"
                  value={settings.maxOutputTokens}
                  onChange={(e) => updateSetting("maxOutputTokens", parseInt(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-primary-100 to-primary-500 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-primary-500 [&::-webkit-slider-thumb]:to-purple-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary-400/40 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Maximum length of AI responses
                </p>
              </div>
            </div>
          </section>

          {/* Tab Management Settings */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-xl">📑</span>
              Tab Management
            </h3>
            
            <div className="space-y-4">
              {/* Duplicate Threshold */}
              <div className="bg-gradient-to-r from-primary-50/30 to-purple-50/30 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Duplicate Detection Threshold: {settings.duplicateThreshold.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.6"
                  max="0.95"
                  step="0.01"
                  value={settings.duplicateThreshold}
                  onChange={(e) => updateSetting("duplicateThreshold", parseFloat(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-primary-100 to-primary-500 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-primary-500 [&::-webkit-slider-thumb]:to-purple-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary-400/40 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Higher = stricter duplicate detection (fewer duplicates found)
                </p>
              </div>
            </div>
          </section>

          {/* UI Preferences */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-xl">🎨</span>
              UI Preferences
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between bg-gradient-to-r from-primary-50/30 to-purple-50/30 rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow">
                <div>
                  <div className="text-sm font-semibold text-slate-700">Show Emojis</div>
                  <div className="text-xs text-slate-500">Display emojis throughout the UI</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showEmojis}
                  onChange={(e) => updateSetting("showEmojis", e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between bg-gradient-to-r from-primary-50/30 to-purple-50/30 rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow">
                <div>
                  <div className="text-sm font-semibold text-slate-700">Auto Refresh</div>
                  <div className="text-xs text-slate-500">Automatically refresh tabs periodically</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => updateSetting("autoRefresh", e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                />
              </label>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  ✓ Saved!
                </>
              ) : (
                <>
                  💾 Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export function to get settings
export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get("tabSenseSettings", (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...result.tabSenseSettings });
    });
  });
}

export { DEFAULT_SETTINGS };

