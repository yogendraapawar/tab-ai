// src/utils/duplicateUtils.js
// Lightweight duplicate detection: TF-like vector + cosine similarity + DSU clustering

function cleanText(text = "") {
  return String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/[\n\r]+/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenize(text) {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  return words;
}

function vectorize(words) {
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  // L2 normalize
  const norm = Math.sqrt(Object.values(freq).reduce((s, v) => s + v * v, 0) || 1);
  Object.keys(freq).forEach((k) => (freq[k] = freq[k] / norm));
  return freq;
}

function cosineSim(a, b) {
  let dot = 0;
  // iterate smaller object
  const [s, l] = Object.keys(a).length < Object.keys(b).length ? [a, b] : [b, a];
  for (const k of Object.keys(s)) {
    if (l[k]) dot += s[k] * l[k];
  }
  return dot || 0;
}

// Union Find (Disjoint Set)
class DSU {
  constructor(n) {
    this.p = new Array(n).fill(-1).map((_, i) => i);
  }
  find(x) {
    if (this.p[x] === x) return x;
    this.p[x] = this.find(this.p[x]);
    return this.p[x];
  }
  union(a, b) {
    const pa = this.find(a), pb = this.find(b);
    if (pa !== pb) this.p[pb] = pa;
  }
}

/**
 * detectDupl
 * icates(items, threshold)
 * items: [{ tabId, text, title, url }]
 * threshold: cosine similarity threshold (0..1)
 * returns: [{ ids: [...tabId], avgScore }]
 */
export function detectDuplicates(items, threshold = 0.82) {
  if (!items || items.length < 2) return [];

  const cleaned = items.map((it) => ({
    tabId: String(it.tabId),
    text: (it.text || it.title || it.url || "").slice(0, 800) // limit length
  }));

  const tokens = cleaned.map((c) => tokenize(c.text));
  const vectors = tokens.map((t) => vectorize(t));

  const n = vectors.length;
  const dsu = new DSU(n);

  // compute pairwise similarity and union if above threshold
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = cosineSim(vectors[i], vectors[j]);
      if (s >= threshold) dsu.union(i, j);
    }
  }

  // group indices by root
  const groupsMap = new Map();
  for (let i = 0; i < n; i++) {
    const r = dsu.find(i);
    if (!groupsMap.has(r)) groupsMap.set(r, []);
    groupsMap.get(r).push(i);
  }

  // filter groups size >= 2 and compute average scores
  const groups = [];
  for (const indices of groupsMap.values()) {
    if (indices.length <= 1) continue;
    const ids = indices.map((i) => cleaned[i].tabId);
    // compute average pairwise score
    let total = 0, count = 0;
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        total += cosineSim(vectors[indices[a]], vectors[indices[b]]);
        count++;
      }
    }
    const avg = count > 0 ? total / count : 0;
    groups.push({
      ids,
      avgScore: Number(avg.toFixed(3))
    });
  }

  // Sort by descending avgScore
  groups.sort((a, b) => b.avgScore - a.avgScore);
  return groups;
}
