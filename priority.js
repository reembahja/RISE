/* Experimental, transparent priority score (0-100). Not an official humanitarian assessment. */
const RisePriority = (() => {
  const BASE = { health: 30, water: 25, protection: 25, shelter: 20, food: 15 };
  const URG = { urgent: 25, injury: 20, child: 15, noSupply: 10, duration: 10, vulnerable: 10 };
  function calc(a) {
    const reasons = [];
    if (a.need) reasons.push({ k: 'need_' + a.need, pts: BASE[a.need] });
    a.urgency.forEach(u => reasons.push({ k: u, pts: URG[u] }));
    if (a.people) { const p = a.people >= 20 ? 15 : a.people >= 5 ? 8 : 3; reasons.push({ k: 'people', pts: p }); }
    const score = Math.min(100, reasons.reduce((s, r) => s + r.pts, 0));
    const level = score >= 65 ? 'high' : score >= 40 ? 'medium' : 'low';
    return { score, level, reasons };
  }
  const api = { calc };
  if (typeof module !== 'undefined') module.exports = api;
  return api;
})();
