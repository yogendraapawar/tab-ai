import React, { useEffect, useState, useCallback } from "react";

function collectFolders(nodes, path = []) {
  const result = [];
  if (!Array.isArray(nodes)) return result;

  const walk = (node, currentPath) => {
    const title = node.title || "";
    const nextPath = [...currentPath, title].filter(Boolean);

    if (node.children && node.children.length > 0) {
      // Direct child links of this folder
      const links = node.children
        .filter((c) => c.url)
        .map((c) => ({
          id: c.id,
          title: c.title || c.url,
          url: c.url,
        }));

      if (links.length > 0) {
        result.push({
          id: node.id,
          title,
          path: nextPath.join(" / "),
          links,
        });
      }

      // Recurse into subfolders
      node.children
        .filter((c) => c.children && c.children.length >= 0)
        .forEach((child) => walk(child, nextPath));
    }
  };

  for (const n of nodes) {
    walk(n, path);
  }
  return result;
}

export default function BookmarksPanel() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [editing, setEditing] = useState({ id: null, value: "" });

  const load = useCallback(() => {
    try {
      setLoading(true);
      chrome.bookmarks.getTree((tree) => {
        const groups = collectFolders(tree || []);
        setFolders(groups);
        // Expand all by default if first load
        const init = {};
        groups.forEach((g) => (init[g.id] = true));
        setExpanded((prev) => (Object.keys(prev).length ? prev : init));
        setLoading(false);
      });
    } catch (e) {
      console.error("Failed to load bookmarks:", e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEdit = (folder) => {
    setEditing({ id: folder.id, value: folder.title || "" });
  };

  const cancelEdit = () => {
    setEditing({ id: null, value: "" });
  };

  const saveEdit = async () => {
    const { id, value } = editing;
    if (!id) return;
    const newTitle = value.trim();
    if (!newTitle) return;

    try {
      await new Promise((resolve, reject) => {
        chrome.bookmarks.update(id, { title: newTitle }, (res) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(res);
          }
        });
      });
      // Refresh and reset editor
      load();
      setEditing({ id: null, value: "" });
    } catch (e) {
      console.error("Failed to update bookmark folder title:", e);
      alert("Unable to rename bookmark folder.");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="m-0 text-base font-bold text-slate-900 flex items-center gap-2">
          <span>🔖</span>
          Bookmarks
        </h3>
        <button
          onClick={load}
          className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors"
          title="Refresh bookmarks"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-500 text-sm">Loading bookmarks…</div>
      ) : folders.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">No bookmark folders with links found.</div>
      ) : (
        <div className="space-y-3 pr-2">
          {folders.map((folder) => {
            const isEditing = editing.id === folder.id;
            const isOpen = expanded[folder.id];

            return (
              <div
                key={folder.id}
                className="bg-white/80 border border-slate-200 rounded-xl hover:border-primary-300 transition-colors"
              >
                <div className="p-3 flex items-start justify-between gap-3">
                  {/* Title block */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="w-full">
                        <input
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                        />
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            onClick={saveEdit}
                            className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            title="Save"
                          >
                            ✔
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-baseline max-w-full">
                        <span className="text-sm font-semibold text-slate-900 break-words whitespace-normal leading-snug">
                          {folder.title || "(Untitled Folder)"}
                        </span>
                        <button
                          onClick={() => startEdit(folder)}
                          className="ml-2 align-baseline inline-flex items-center justify-center w-5 h-5 text-[11px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                          title="Edit title"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                      {folder.links.length} link{folder.links.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => toggleExpand(folder.id)}
                      className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors"
                      title={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? "▼" : "▶"}
                    </button>
                  </div>
                </div>

                {/* Links */}
                {isOpen && (
                  <div className="px-3 pb-3">
                    <div className="space-y-1.5">
                      {folder.links.map((b) => (
                        <div key={b.id} className="p-2 bg-white/70 border border-slate-200 rounded-md">
                          <a
                            href={b.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-sm text-slate-800 no-underline hover:text-primary-600 truncate"
                            title={b.title}
                          >
                            {b.title}
                          </a>
                          <div className="text-[11px] text-slate-500 truncate">{b.url}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
