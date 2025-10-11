// src/components/QueryTab.jsx
import React, { useState, useRef, useEffect } from "react";
import { initializeAIModel } from "../utils/aiModel.js";

export default function QueryTab({ tabsData, categorizedTabs, onOpenTab }) {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  // Universal search function that works for any query
  const findRelevantTabs = (searchQuery) => {
    if (!searchQuery.trim() || !tabsData || tabsData.length === 0) {
      console.log("🔍 Search: No query or tabs data available");
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(word => word.length > 1);
    const scoredTabs = [];

    console.log(`🔍 Searching for: "${query}" (${queryWords.length} words)`);
    console.log(`📊 Available tabs: ${tabsData.length}`);

    // Search in all tabs data
    tabsData.forEach((tab, index) => {
      const title = (tab.tabInfo?.title || "").toLowerCase();
      const url = (tab.tabInfo?.url || "").toLowerCase();
      const content = (tab.pageData?.content?.text || tab.pageData?.mainContent || "").toLowerCase();
      const description = (tab.pageData?.meta?.description || "").toLowerCase();

      let score = 0;
      let matchType = "";

      // Exact query match in title (highest priority)
      if (title.includes(query)) {
        score += 25;
        matchType = "Exact Title Match";
      }
      // Exact query match in URL
      else if (url.includes(query)) {
        score += 20;
        matchType = "Exact URL Match";
      }
      // Exact query match in content
      else if (content.includes(query)) {
        score += 15;
        matchType = "Exact Content Match";
      }
      // Word-by-word matching
      else {
        let wordMatches = 0;
        queryWords.forEach(word => {
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

      // Bonus for multiple word matches
      const totalMatches = queryWords.filter(word => 
        title.includes(word) || url.includes(word) || content.includes(word)
      ).length;
      
      if (totalMatches === queryWords.length && queryWords.length > 1) {
        score += 5; // Bonus for matching all words
      }

      if (score > 0) {
        scoredTabs.push({
          ...tab,
          score,
          matchType,
          originalIndex: index
        });
      }
    });

    // Sort by score and return top 3 most relevant
    const results = scoredTabs
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log(`🔍 Found ${results.length} relevant tabs:`, results.map(r => ({ 
      title: r.tabInfo?.title, 
      score: r.score, 
      matchType: r.matchType,
      url: r.tabInfo?.url
    })));
    
    return results;
  };

  // Process query with professional AI assistant
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setError("");
    setResponse("");

    try {
      console.log(`🔍 Processing query: "${query}"`);

      // Find the most relevant tabs (max 3)
      const relevantTabs = findRelevantTabs(query);
      setSearchResults(relevantTabs);

      if (relevantTabs.length === 0) {
        setResponse("I couldn't find any tabs that match your query. Please try a different search term or make sure you have scanned your tabs first.");
        setIsProcessing(false);
        return;
      }

      // Clean and prepare tab data for AI
      const cleanedTabs = relevantTabs.map((tab, index) => {
        const title = tab.tabInfo?.title || "Untitled";
        const url = tab.tabInfo?.url || "";
        const rawContent = tab.pageData?.content?.text || tab.pageData?.mainContent || tab.pageData?.meta?.description || "";
        
        // Clean content - remove HTML tags, excessive whitespace, and limit length
        const cleanedContent = rawContent
          .replace(/<[^>]*>/g, ' ') // Remove HTML tags
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/[^\w\s.,!?;:()-]/g, ' ') // Remove special characters except basic punctuation
          .trim()
          .substring(0, 1500); // Increased to 1500 characters for more context
        
        return {
          id: index + 1,
          title,
          url,
          content: cleanedContent,
          matchType: tab.matchType
        };
      });

      // Initialize AI model
      const model = await initializeAIModel();
      if (!model) {
        throw new Error("AI model initialization failed");
      }

      // Create focused prompt with clean tab data
      const tabContext = cleanedTabs.map(tab => 
        `[${tab.id}] ${tab.title}
URL: ${tab.url}
Content: ${tab.content}`
      ).join('\n\n');

      const prompt = `You are a helpful AI assistant. The user asked: "${query}"

Here are the relevant tabs from their browser:
${tabContext}

Instructions:
1. Answer the user's question directly and specifically
2. Use the tab content to provide detailed, helpful information
3. Reference tabs with [1], [2], [3] when relevant
4. Be thorough but concise
5. Focus on what the user actually asked for

Answer their question based on the tab information provided.`;

      console.log(`🤖 Sending to AI: ${relevantTabs.length} relevant tabs`);
      console.log("📋 Tab context being sent:", tabContext.substring(0, 500) + "...");

      const startTime = performance.now();
      const result = await model.generateContent([prompt]);
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`✅ AI response received in ${duration}s`);

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
      } catch (e) {
        console.warn("Could not read response.text() — falling back to raw result", e);
        responseText = JSON.stringify(result);
      }

      console.log(`📝 Response length: ${responseText.length} characters`);

      // Format the response for better display
      const formattedResponse = formatResponse(responseText);
      setResponse(formattedResponse);

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

  // Format response for better display
  const formatResponse = (text) => {
    if (!text) return "";
    
    // Convert markdown-style formatting to HTML-like structure
    let formatted = text
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Bullet points
      .replace(/^[\s]*[-*]\s+(.+)$/gm, '• $1')
      // Numbered lists
      .replace(/^[\s]*(\d+)\.\s+(.+)$/gm, '$1. $2')
      // Line breaks
      .replace(/\n\n/g, '\n\n')
      // Tab references with better styling
      .replace(/\[(\d+)\]/g, '<span class="inline-block px-2 py-1 bg-primary-100 text-primary-600 rounded text-xs font-semibold mr-1">[$1]</span>');
    
    return formatted;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 transition-all hover:shadow-xl flex flex-col h-full">
      {/* Query Input */}
      <div className="mb-4">
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
              placeholder="e.g., 'What are my work-related tabs?', 'Show me tabs about AI', 'Find shopping websites'..."
              className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              rows={3}
              disabled={isProcessing}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-500">
              {tabsData?.length > 0 ? `${tabsData.length} tabs available` : 'No tabs scanned yet'}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  console.log("🔍 Debug: All tabs data:", tabsData);
                  console.log("🔍 Debug: Current query:", query);
                  const results = findRelevantTabs(query);
                  console.log("🔍 Debug: Search results:", results);
                }}
                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg font-semibold text-xs transition-all hover:bg-slate-200"
              >
                🔍 Debug
              </button>
              <button
                type="submit"
                disabled={!query.trim() || isProcessing || !tabsData?.length}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    🤖 Ask AI
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
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

        {/* Response Display */}
        {response && (
          <div className="mb-4 p-4 bg-gradient-to-r from-primary-50/30 to-purple-50/30 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🤖</span>
              <span className="font-semibold text-slate-700 text-sm">AI Response</span>
            </div>
            <div 
              className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: response }}
            />
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🔍</span>
              <span className="font-semibold text-slate-700 text-sm">Relevant Tabs</span>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full text-xs font-semibold">
                {searchResults.length}
              </span>
            </div>
            <div className="space-y-2">
              {searchResults.map((tab, index) => (
                <div
                  key={tab.tabId}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50/30 to-purple-50/30 border border-slate-200 rounded-lg hover:border-primary-200 transition-all cursor-pointer"
                  onClick={() => handleTabClick(tab.tabId)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-600 rounded text-xs font-semibold">
                        [{index + 1}]
                      </span>
                      <span className="text-xs text-slate-500">{tab.matchType}</span>
                    </div>
                    <div className="font-semibold text-sm text-slate-900 truncate">
                      {tab.tabInfo?.title || "Untitled"}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {tab.tabInfo?.url || "No URL"}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabClick(tab.tabId);
                    }}
                    className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all hover:-translate-y-0.5 shadow-sm"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!response && !isProcessing && !error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-400">
              <div className="text-4xl mb-3 opacity-50">💬</div>
              <div className="font-semibold mb-1 text-base">Ask me anything about your tabs!</div>
              <div className="text-xs max-w-sm">
                I can help you find specific tabs, understand their content, or get insights about your browsing patterns.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
