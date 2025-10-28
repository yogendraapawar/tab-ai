// src/components/QueryTab.jsx
import React, { useState, useRef, useEffect } from "react";
import { initializeAIModel } from "../utils/aiModel.js";

export default function QueryTab({ tabsData, categorizedTabs, onOpenTab }) {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  // messages: { role: 'user'|'assistant', text?: string, html?: string, reference?: { title, url, tabId, score } }
  const [messages, setMessages] = useState([]);
  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [query]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  // Restore chat from chrome.storage.session to persist until extension closes
  useEffect(() => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage?.session) {
        chrome.storage.session.get("ts_query_chat", (obj) => {
          const saved = obj?.ts_query_chat;
          if (Array.isArray(saved) && saved.length > 0) {
            setMessages(saved);
          }
        });
      }
    } catch {
      // non-fatal
    }
  }, []);

  // Persist chat to chrome.storage.session on every change
  useEffect(() => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage?.session) {
        chrome.storage.session.set({ ts_query_chat: messages });
      }
    } catch {
      // non-fatal
    }
  }, [messages]);

  // Debug: Log tab stats
  useEffect(() => {
    console.log("📊 QueryTab mounted. tabsData:", tabsData?.length || 0);
  }, [tabsData]);

  // Helper: detect if query refers to the active/current tab
  const mentionsActiveTab = (q) => {
    const s = (q || "").toLowerCase();
    return (
      /\b(current|this|active)\s+(tab|page)\b/.test(s) ||
      /\bsummar(i[sz]e|yze)\s+(this|current)\b/.test(s) ||
      /\b(on\s+my\s+tab)\b/.test(s)
    );
  };

  // Helper: format response for better display
  const formatResponse = (text) => {
    if (!text) return "";
    let formatted = text
      // Basic markdown-like formatting
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Bullets / numbered lists (keeping line breaks)
      .replace(/^[\s]*[-*]\s+(.+)$/gm, "• $1")
      .replace(/^[\s]*(\d+)\.\s+(.+)$/gm, "$1. $2")
      // Tab references like [1]
      .replace(
        /\[(\d+)\]/g,
        '<span class="inline-block px-2 py-1 bg-primary-100 text-primary-600 rounded text-xs font-semibold mr-1">[$1]</span>'
      );
    return formatted;
  };

  // Universal search function that works for any query (reused for chat context)
  const findRelevantTabs = (searchQuery) => {
    if (!searchQuery?.trim() || !tabsData || tabsData.length === 0) {
      console.log("🔍 Search: No query or tabs data available");
      return [];
    }

    const q = searchQuery.toLowerCase().trim();
    const queryWords = q.split(/\s+/).filter((word) => word.length > 1);
    const scoredTabs = [];

    tabsData.forEach((tab, index) => {
      const title = (tab.tabInfo?.title || "").toLowerCase();
      const url = (tab.tabInfo?.url || "").toLowerCase();
      const content = (
        tab.pageData?.content?.text ||
        tab.pageData?.mainContent ||
        ""
      ).toLowerCase();
      const description = (tab.pageData?.meta?.description || "").toLowerCase();

      let score = 0;
      let matchType = "";

      if (title.includes(q)) {
        score += 25;
        matchType = "Exact Title Match";
      } else if (url.includes(q)) {
        score += 20;
        matchType = "Exact URL Match";
      } else if (content.includes(q)) {
        score += 15;
        matchType = "Exact Content Match";
      } else {
        let wordMatches = 0;
        queryWords.forEach((word) => {
          if (title.includes(word)) {
            score += 8;
            wordMatches++;
          }
          if (url.includes(word)) {
            score += 6;
            wordMatches++;
          }
          if (content.includes(word)) {
            score += 4;
            wordMatches++;
          }
          if (description.includes(word)) {
            score += 3;
            wordMatches++;
          }
        });

        if (wordMatches > 0) {
          matchType = `Word Match (${wordMatches}/${queryWords.length} words)`;
        }
      }

      const totalMatches = queryWords.filter(
        (word) => title.includes(word) || url.includes(word) || content.includes(word)
      ).length;
      if (totalMatches === queryWords.length && queryWords.length > 1) {
        score += 5;
      }

      if (score > 0) {
        scoredTabs.push({
          ...tab,
          score,
          matchType,
          originalIndex: index,
        });
      }
    });

    const results = scoredTabs.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);
    return results;
  };

  // Bookmarks: find relevant bookmarks by query (title/url match)
  const findRelevantBookmarks = async (searchQuery) => {
    if (!searchQuery?.trim()) return [];
    try {
      if (typeof chrome === "undefined" || !chrome.bookmarks?.search) return [];
      const results = await new Promise((resolve) => {
        try {
          chrome.bookmarks.search(searchQuery, (res) => resolve(res || []));
        } catch (e) {
          resolve([]);
        }
      });
      // Filter to only nodes with URL and dedupe same URL
      const urlSeen = new Set();
      const items = [];
      for (const r of results) {
        if (!r.url) continue;
        if (urlSeen.has(r.url)) continue;
        urlSeen.add(r.url);
        items.push({ id: r.id, title: r.title || r.url, url: r.url });
        if (items.length >= 5) break;
      }
      return items;
    } catch {
      return [];
    }
  };

  // Try to pull active tab content if user mentions current tab
  const getActiveTabContextIfRequested = async (searchQuery) => {
    if (!mentionsActiveTab(searchQuery)) return null;
    try {
      if (typeof chrome === "undefined" || !chrome.tabs?.query) return null;
      const [active] = await new Promise((resolve) => {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (res) =>
            resolve(res || [])
          );
        } catch (e) {
          resolve([]);
        }
      });
      if (!active?.id || !active?.url) return null;

      let pageData = null;
      try {
        pageData = await new Promise((resolve) => {
          try {
            chrome.runtime.sendMessage(
              { type: "EXTRACT_TAB_DATA", tabId: active.id },
              (resp) => resolve(resp?.data || null)
            );
          } catch (e) {
            resolve(null);
          }
        });
      } catch {
        pageData = null;
      }

      const ctx = {
        tabId: active.id,
        tabInfo: {
          id: active.id,
          title: active.title || "",
          url: active.url || "",
          domain: active.url ? new URL(active.url).hostname : "",
          windowId: active.windowId,
          favIconUrl: active.favIconUrl,
          index: active.index,
          pinned: active.pinned,
          active: true,
          audible: active.audible,
          mutedInfo: active.mutedInfo,
          groupId: active.groupId,
        },
        pageData: pageData || {
          meta: {},
          mainContent: "",
        },
        score: 9999,
        matchType: "Active Tab",
        originalIndex: -1,
      };
      return ctx;
    } catch (e) {
      console.warn("Failed to fetch active tab context:", e);
      return null;
    }
  };

  // Clean and prepare tab data for AI
  const cleanTabsForAI = (relevantTabs) => {
    return relevantTabs.map((tab, index) => {
      const title = tab.tabInfo?.title || "Untitled";
      const url = tab.tabInfo?.url || "";
      const rawContent =
        tab.pageData?.content?.text ||
        tab.pageData?.mainContent ||
        tab.pageData?.meta?.description ||
        "";

      const cleanedContent = String(rawContent)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .replace(/[^\w\s.,!?;:()-]/g, " ")
        .trim()
        .substring(0, 1500);

      return {
        id: index + 1,
        tabId: tab.tabId,
        title,
        url,
        content: cleanedContent,
        matchType: tab.matchType || "",
        score: tab.score || 0,
      };
    });
  };

  // Main submit handler (chat-style)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setError("");

    const userText = query;
    setQuery("");

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text: userText }]);

    try {
      console.log(`🔍 Processing query: "${userText}"`);

      // Compute relevant tab context
      let relevantTabs = findRelevantTabs(userText);

      // If asked about current tab, fetch and prioritize it
      const activeCtx = await getActiveTabContextIfRequested(userText);
      if (activeCtx) {
        const exists = relevantTabs.some(
          (t) => String(t.tabId) === String(activeCtx.tabId)
        );
        if (!exists) {
          relevantTabs = [activeCtx, ...relevantTabs].slice(0, 3);
        } else {
          relevantTabs = relevantTabs.map((t) =>
            String(t.tabId) === String(activeCtx.tabId)
              ? { ...t, matchType: "Active Tab", score: Math.max(9999, t.score || 0) }
              : t
          );
        }
      }

      // Related bookmarks context (not rendered, but can inform prompt)
      const relatedBookmarks = await findRelevantBookmarks(userText);

      const cleanedTabs = cleanTabsForAI(relevantTabs);

      // Initialize AI model
      const model = await initializeAIModel();
      if (!model) {
        throw new Error("AI model initialization failed");
      }

      // Build prompt
      const tabsBlock =
        cleanedTabs.length > 0
          ? cleanedTabs
              .map(
                (t) => `[${t.id}] ${t.title}
URL: ${t.url}
Content: ${t.content}`
              )
              .join("\n\n")
          : "(no tab context available)";

      const bookmarksBlock =
        relatedBookmarks.length > 0
          ? relatedBookmarks
              .map((b, i) => `(${i + 1}) ${b.title} — ${b.url}`)
              .join("\n")
          : "(no related bookmarks)";

      const intentHints = [];
      if (/youtube\.com\/watch/.test(cleanedTabs.map((t) => t.url).join(" "))) {
        intentHints.push(
          "If the question is about a YouTube video, summarize the key points, structure, and actionable takeaways."
        );
      }
      if (mentionsActiveTab(userText)) {
        intentHints.push("Prioritize the Active Tab context when answering.");
      }

      const prompt = `You are a chat assistant focused on the user's browsing context (tabs and bookmarks).
User asked: "${userText}"

Context — Relevant Tabs:
${tabsBlock}

Context — Related Bookmarks:
${bookmarksBlock}

Instructions:
1) Answer the user's question directly, focusing on the provided tab/bookmark context.
2) Use tab references like [1], [2], [3] when pulling from specific tabs.
3) Provide concise yet thorough explanations and, when useful, short bullet steps.
4) If user asks for similar resources, list a few high-quality links (use Related Bookmarks first if they fit).
5) If summarization is requested, summarize clearly and extract key points and action items.
${intentHints.length ? "6) " + intentHints.join(" ") : ""}

Now provide the best possible answer based on the above context.`;

      console.log(`🤖 Sending to AI with ${cleanedTabs.length} tab(s) and ${relatedBookmarks.length} bookmark(s).`);
      const startTime = performance.now();
      const result = await model.generateContent([prompt]);
      const endTime = performance.now();
      console.log(`✅ AI response received in ${((endTime - startTime) / 1000).toFixed(2)}s`);

      // Extract and format response
      let responseText = "";
      try {
        const resp = result?.response;
        if (resp && typeof resp.text === "function") {
          responseText = resp.text();
        } else if (resp && resp?.candidates && resp.candidates[0]) {
          responseText = resp.candidates[0]?.content?.parts?.[0]?.text ?? "";
        } else {
          responseText = String(result);
        }
      } catch (e2) {
        console.warn("Could not read response.text() — falling back to raw result", e2);
        responseText = JSON.stringify(result);
      }

      const formattedResponse = formatResponse(responseText);

      // Determine single reference link with highest score (from relevant tabs)
      let bestRef = null;
      if (relevantTabs && relevantTabs.length > 0) {
        let best = relevantTabs[0];
        for (const t of relevantTabs) {
          if ((t.score || 0) > (best.score || 0)) best = t;
        }
        bestRef = {
          tabId: best.tabId,
          title: best?.tabInfo?.title || best?.pageData?.title || best?.tabInfo?.url || "Reference",
          url: best?.tabInfo?.url || "",
          score: best.score || 0,
        };
      }

      // Append assistant message (AI Response; only one reference link at bottom)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          html: formattedResponse,
          reference: bestRef,
        },
      ]);
    } catch (err) {
      console.error("Error processing query:", err);
      setError("Failed to process your query. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTabClick = (tabId) => {
    if (onOpenTab) {
      onOpenTab(tabId);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Query Input */}
      <div className="mb-4 flex-shrink-0 px-2">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="query" className="block text-sm font-semibold text-slate-700 mb-2">
              Ask about your tabs
            </label>
            <textarea
              ref={textareaRef}
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'Summarize my current tab', 'Summarize the YouTube video on my tab', 'Provide similar resources', 'Which tabs are about AI?'"
              className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              rows={3}
              disabled={isProcessing}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-500">
              {tabsData?.length > 0 ? `${tabsData.length} tabs available` : "No tabs scanned yet"}
            </div>
            <div className="flex gap-2">
              {/* 'Find' and 'Clear Chat' removed as requested */}
              <button
                type="submit"
                disabled={!query.trim() || isProcessing}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:from-primary-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>🤖 Ask AI</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <span className="text-sm">⚠️</span>
              <span className="font-semibold text-sm">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Chat Log */}
        <div className="space-y-3">
          {messages.map((m, idx) => {
            if (m.role === "user") {
              return (
                <div key={idx} className="flex justify-end">
                  <div className="max-w-[85%] bg-primary-50/60 border border-primary-200 rounded-xl p-3 shadow-sm">
                    <div className="text-xs text-slate-500 mb-1">You</div>
                    <div className="text-slate-800 text-sm whitespace-pre-wrap">{m.text}</div>
                  </div>
                </div>
              );
            }
            // assistant message
            return (
              <div key={idx} className="flex justify-start">
                <div className="w-full max-w-[95%]">
                  {/* AI Response */}
                  <div className="p-4 bg-gradient-to-r from-primary-50/30 to-purple-50/30 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">🤖</span>
                      <span className="font-semibold text-slate-700 text-sm">AI Response</span>
                    </div>
                    <div
                      className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: m.html }}
                    />
                    {/* Single reference link at bottom (highest score) */}
                    {m.reference?.url && (
                      <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-xs text-slate-500 mb-1">Reference</div>
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={m.reference.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-700 hover:underline truncate"
                            title={m.reference.title || m.reference.url}
                          >
                            {m.reference.title || m.reference.url}
                          </a>
                          {m.reference.tabId && (
                            <button
                              onClick={() => handleTabClick(m.reference.tabId)}
                              className="px-3 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600"
                            >
                              Open
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Empty State */}
        {messages.length === 0 && !isProcessing && !error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-400">
              <div className="text-4xl mb-3 opacity-50">💬</div>
              <div className="font-semibold mb-1 text-base">Ask anything about your tabs and bookmarks</div>
              <div className="text-xs max-w-sm">
                Try: "Summarize my current tab", "Summarize the YouTube video on my tab", "Provide similar resources", or "Show tabs about AI".
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
