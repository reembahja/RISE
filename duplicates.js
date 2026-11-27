/* Duplicate detection: need + location + shared words. Never deletes anything. */
const RiseDup = (() => {
  const STOP = new Set(['the','and','for','has','have','are','with','that','this','needs','need','from','there','لا','التي','على','إلى','يحتاج','تحتاج','في','من']);
  const tok = s => new Set(String(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 2 && !STOP.has(w)));
  function check(a, text, pool) {
    const t = tok(text); let best = null;
    for (const o of pool) {
      const sameNeed = !!a.need && a.need === o.need;
      const sameLoc = !!(a.location && o.location && a.location.key === o.location.key);
      const shared = [...tok(o.text)].filter(w => t.has(w));
      const j = shared.length / Math.max(1, new Set([...t, ...tok(o.text)]).size);
      if (!(sameNeed && (sameLoc || j >= 0.35))) continue;
      const score = Math.round(((sameNeed ? 0.4 : 0) + (sameLoc ? 0.4 : 0) + Math.min(1, j * 2) * 0.2) * 100);
      if (!best || score > best.score) best = { status: 'potential', id: o.id, score, sameNeed, sameLoc, shared: shared.slice(0, 5) };
    }
    return best || { status: 'none', id: null, score: 0, sameNeed: false, sameLoc: false, shared: [] };
  }
  const api = { check };
  if (typeof module !== 'undefined') module.exports = api;
  return api;
})();
