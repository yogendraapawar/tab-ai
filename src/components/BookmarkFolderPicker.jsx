import React, { useEffect, useMemo, useState } from "react";

export default function BookmarkFolderPicker({
  isOpen,
  folders,
  onCancel,
  onConfirm
}) {
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      // Default select all when opened
      const all = new Set((folders || []).map((f) => f.id));
      setSelected(all);
    }
  }, [isOpen, folders]);

  const total = folders?.length || 0;
  const selectedCount = selected.size;

  const sortedFolders = useMemo(() => {
    const arr = Array.isArray(folders) ? [...folders] : [];
    // Sort by title asc
    arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return arr;
  }, [folders]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(sortedFolders.map((f) => f.id)));
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const handleConfirm = () => {
    if (!onConfirm) return;
    onConfirm(Array.from(selected));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-[min(720px,95vw)] max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl bg-white border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-primary-50/70 to-purple-50/70">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-base font-bold text-slate-900">
                Select bookmark folders to open and group
              </h3>
              <div className="text-xs text-slate-600 mt-0.5">
                {selectedCount}/{total} selected
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded border border-slate-200 hover:bg-slate-200"
              >
                Select all
              </button>
              <button
                onClick={clearAll}
                className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded border border-slate-200 hover:bg-slate-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="max-h-[52vh] overflow-auto pr-1 space-y-2">
            {sortedFolders.length === 0 ? (
              <div className="text-sm text-slate-500 py-8 text-center">
                No bookmark folders with links found.
              </div>
            ) : (
              sortedFolders.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 bg-white/80 hover:border-primary-300 transition-colors"
                  title={f.title || "(Untitled Folder)"}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={selected.has(f.id)}
                    onChange={() => toggle(f.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {f.title || "(Untitled Folder)"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {f.links?.length || 0} link{(f.links?.length || 0) !== 1 ? "s" : ""}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold shadow-sm transition-colors ${
              selectedCount === 0
                ? "bg-emerald-500/50 text-white cursor-not-allowed"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
