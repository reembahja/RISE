(() => {
'use strict';
const $ = s => document.querySelector(s);
const NEEDS = ['food', 'water', 'health', 'shelter', 'protection'];
const ICON = { dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z', new: 'M12 5v14M5 12h14', analysis: 'M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4zM9 14h.01M15 14h.01', reports: 'M4 6h16M4 12h16M4 18h16', dups: 'M8 8h12v12H8zM4 16V4h12', review: 'M5 12l5 5L20 7', chat: 'M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z', settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12h2M3 12h2M12 3v2M12 19v2', sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M1 12h2M21 12h2', moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z', menu: 'M3 6h18M3 12h18M3 18h18', globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20' };
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
const S = { lang: Store.get('lang', 'en'), theme: Store.get('theme', 'dark'), view: 'dashboard', reports: Store.get('reports', null), draft: null, form: { text: '', loc: '', ppl: '' }, err: {}, f: { q: '', need: '', prio: '' }, chat: [{ r: 'b', k: 'hello' }], open: false, modal: null, busy: false };
const t = k => (T[S.lang][k] ?? T.en[k] ?? k);
const tf = (k, v) => t(k).replace('{0}', v);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl = n => n ? t('n_' + n) : t('ns');
const ll = l => l ? (l[S.lang] || l.en) : t('ns');
const pl = p => p ? p.toLocaleString(S.lang === 'ar' ? 'ar-EG' : 'en-US') : t('ns');
const save = () => Store.set('reports', S.reports);

/* ---- report building ---- */
function build(text, o, pool) {
  const a = RiseAI.analyze(text, o), p = RisePriority.calc(a), d = RiseDup.check(a, text, pool);
  return { text: text.trim(), ...a, ...p, dup: d, status: 'new' };
}
const nextId = () => 'RISE-' + String(S.reports.length + 1).padStart(3, '0');
function seed() {
  S.reports = [];
  SAMPLES.forEach(s => { const r = build(s, {}, S.reports); r.id = nextId(); r.sample = true; S.reports.push(r); });
  save();
}
if (!Array.isArray(S.reports)) seed();

/* ---- shared render pieces ---- */
const lvBadge = l => `<span class="badge ${l}">${t(l)}</span>`;
const stBadge = s => `<span class="badge ${s}">${t('s_' + s)}</span>`;
const dupBadge = d => d.status === 'potential' ? `<span class="badge pot">${t('dupYes')} · ${d.id}</span>` : `<span class="badge">${t('dupNo')}</span>`;
function reasonText(x) {
  if (x.k.startsWith('need_')) return tf('p_base', nl(x.k.slice(5)));
  return t(x.k === 'people' ? 'p_people' : 'u_' + x.k);
}
function dupText(d) {
  if (d.status === 'none') return `<p>${t('d_none')}</p>`;
  const why = [d.sameNeed && t('d_same_need'), d.sameLoc && t('d_same_loc'), d.shared.length && tf('d_words', d.shared.join(', '))].filter(Boolean).join(' · ');
  return `<p><b class="high">${t('d_pot')}</b><br>${t('d_to')} <b>${d.id}</b> (${d.score}%)<br><small>${esc(why)}</small></p><small>${t('d_note')}</small>`;
}
function analysisCard(r) {
  const urg = r.urgency.length ? r.urgency.map(u => t('u_' + u)).join('، ').replace(/، /g, S.lang === 'ar' ? '، ' : ', ') : t('a_none');
  const miss = r.missing.length ? r.missing.map(m => t('m_' + m)).join(S.lang === 'ar' ? '، ' : ', ') : t('a_none');
  return `<div class="banner"><b>${t('demo')}</b><br>${t('demoNote')}</div>
  <div class="grid g2">
   <div class="card"><h3>${t('a_sum')}</h3><dl class="kv"><dt>${t('a_need')}</dt><dd>${nl(r.need)}</dd><dt>${t('a_loc')}</dt><dd>${esc(ll(r.location))}</dd><dt>${t('a_ppl')}</dt><dd>${pl(r.people)}</dd><dt>${t('a_urg')}</dt><dd>${esc(urg)}</dd><dt>${t('a_miss')}</dt><dd>${esc(miss)}</dd></dl></div>
   <div class="card"><h3>${t('p_score')}: ${r.score}/100 ${lvBadge(r.level)}</h3><div class="meter"><i style="width:${r.score}%"></i></div><p><b>${t('p_why')}</b></p>
    <ul>${r.reasons.map(x => `<li>${esc(reasonText(x))}: +${x.pts} ${t('pts')}</li>`).join('') || `<li>${t('a_none')}</li>`}</ul><small>${t('p_note')}</small></div>
   <div class="card"><h3>${t('nav_dups')}</h3>${dupText(r.dup)}</div>
   <div class="card"><h3>${t('r_orig')}</h3><p dir="auto">${esc(r.text)}</p>${r.id ? `<small>${r.id}${r.sample ? ' · ' + t('sample') : ''}</small>` : ''}</div>
  </div>`;
}

/* ---- views ---- */
function vDash() {
  const R = S.reports, c = f => R.filter(f).length, mx = Math.max(1, ...NEEDS.map(n => c(r => r.need === n)));
  const L = { high: c(r => r.level === 'high'), medium: c(r => r.level === 'medium'), low: c(r => r.level === 'low') }, tot = R.length || 1;
  const a = L.high / tot * 100, b = a + L.medium / tot * 100;
  const bg = R.length ? `conic-gradient(var(--hi) 0 ${a}%,var(--md) ${a}% ${b}%,var(--lo) ${b}% 100%)` : 'var(--sf2)';
  return `<div class="grid g4">
   <div class="card stat"><b>${R.length}</b><span>${t('total')}</span></div><div class="card stat"><b>${c(r => r.status === 'new')}</b><span>${t('newR')}</span></div>
   <div class="card stat"><b>${L.high}</b><span>${t('high')}</span></div><div class="card stat"><b>${c(r => r.dup.status === 'potential')}</b><span>${t('dups')}</span></div></div>
   <div class="grid g2" style="margin-top:14px"><div class="card"><h3>${t('byNeed')}</h3>${NEEDS.map(n => { const k = c(r => r.need === n); return `<div class="bar"><span>${nl(n)}</span><i style="width:${k / mx * 100}%"></i><b>${k}</b></div>`; }).join('')}</div>
   <div class="card"><h3>${t('prioOv')}</h3><div class="donut" style="background:${bg}"></div><div class="leg">${['high', 'medium', 'low'].map(l => `<span><i class="dot" style="background:var(--${l == 'high' ? 'hi' : l == 'medium' ? 'md' : 'lo'})"></i>${t(l)}: ${L[l]}</span>`).join('')}</div></div></div>
   <div class="card" style="margin-top:14px"><h3>${t('recent')}</h3>${tableHtml(R.slice(-5).reverse())}</div>`;
}
function vNew() {
  const e = S.err, f = S.form, bz = S.busy ? 'disabled' : '';
  return `<div class="card"><label for="fText">${t('f_desc')} *</label><textarea id="fText" data-k="text" dir="auto" placeholder="${t('ph_desc')}">${esc(f.text)}</textarea>${e.text ? `<div class="err">${e.text}</div>` : ''}
  <label for="fLoc">${t('f_loc')}</label><input id="fLoc" data-k="loc" value="${esc(f.loc)}">
  <label for="fPpl">${t('f_ppl')}</label><input id="fPpl" data-k="ppl" inputmode="numeric" value="${esc(f.ppl)}">${e.ppl ? `<div class="err">${e.ppl}</div>` : ''}
  <div class="row"><button class="btn" data-act="analyze" ${bz}>${S.busy ? '<span class="spin"></span> ' : ''}${t('analyze')}</button><button class="btn alt" data-act="save" ${bz}>${t('save')}</button></div></div>`;
}
function vAnalysis() {
  if (!S.draft) return `<div class="card">${t('a_empty')}</div>`;
  return analysisCard(S.draft) + `<div class="row"><button class="btn" data-act="saveDraft">${t('save')}</button></div>`;
}
function filtered() {
  const q = S.f.q.trim().toLowerCase();
  return S.reports.filter(r => (!S.f.need || r.need === S.f.need) && (!S.f.prio || r.level === S.f.prio) && (!q || (r.text + ' ' + r.id + ' ' + ll(r.location)).toLowerCase().includes(q)));
}
function tableHtml(rows) {
  if (!rows.length) return `<p>${t('noRows')}</p>`;
  return `<table><thead><tr>${['c_id', 'c_desc', 'c_need', 'c_loc', 'c_ppl', 'c_prio', 'c_dup', 'c_status', 'c_act'].map(k => `<th>${t(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>
   <td data-l="${t('c_id')}">${r.id}</td><td data-l="${t('c_desc')}" dir="auto">${esc(r.text.length > 70 ? r.text.slice(0, 70) + '…' : r.text)}</td><td data-l="${t('c_need')}">${nl(r.need)}</td><td data-l="${t('c_loc')}">${esc(ll(r.location))}</td><td data-l="${t('c_ppl')}">${pl(r.people)}</td>
   <td data-l="${t('c_prio')}">${r.score} ${lvBadge(r.level)}</td><td data-l="${t('c_dup')}">${dupBadge(r.dup)}</td><td data-l="${t('c_status')}">${stBadge(r.status)}</td>
   <td data-l="${t('c_act')}"><button class="ib" data-act="view" data-id="${r.id}">${t('view')}</button> <button class="ib" data-act="gor" data-id="${r.id}">${t('review')}</button></td></tr>`).join('')}</tbody></table>`;
}
function vReports() {
  return `<div class="filters"><input id="q" type="search" placeholder="${t('search')}" value="${esc(S.f.q)}" aria-label="${t('search')}">
  <select id="fn" aria-label="${t('c_need')}"><option value="">${t('c_need')}: ${t('all')}</option>${NEEDS.map(n => `<option value="${n}" ${S.f.need === n ? 'selected' : ''}>${nl(n)}</option>`).join('')}</select>
  <select id="fp" aria-label="${t('c_prio')}"><option value="">${t('c_prio')}: ${t('all')}</option>${['high', 'medium', 'low'].map(l => `<option value="${l}" ${S.f.prio === l ? 'selected' : ''}>${t(l)}</option>`).join('')}</select></div>
  <div class="card" id="tbl">${tableHtml(filtered())}</div>`;
}
function vDups() {
  const L = S.reports.filter(r => r.dup.status === 'potential');
  if (!L.length) return `<div class="card">${t('d_empty')}</div>`;
  return L.map(r => { const o = S.reports.find(x => x.id === r.dup.id); return `<div class="card" style="margin-bottom:12px"><h3>${r.id} → ${r.dup.id}</h3><p dir="auto">${esc(r.text)}</p>${o ? `<p dir="auto"><small>${o.id}: ${esc(o.text)}</small></p>` : ''}${dupText(r.dup)}<button class="btn alt" data-act="gor" data-id="${r.id}">${t('review')}</button></div>`; }).join('');
}
function vReview() {
  const L = S.reports.filter(r => r.status === 'new' || r.status === 'review');
  if (!L.length) return `<div class="card">${t('r_empty')}</div>`;
  return `<p>${t('r_human')}</p>` + L.map(r => `<section style="margin-bottom:22px"><h3>${r.id} ${stBadge(r.status)}</h3>${analysisCard(r)}<div class="row"><button class="btn" data-act="dec" data-d="approved" data-id="${r.id}">${t('r_approve')}</button><button class="btn alt" data-act="dec" data-d="rejected" data-id="${r.id}">${t('r_reject')}</button><button class="btn alt" data-act="dec" data-d="review" data-id="${r.id}">${t('r_keep')}</button></div></section>`).join('');
}
const QS = ['how', 'write', 'cats', 'priority', 'analysis', 'missing', 'dup', 'example'];
function vChat() {
  return `<div class="card chat"><h3>${t('chatTitle')}</h3><div class="banner">${t('demoNote')}</div><div class="msgs" id="msgs">${S.chat.map(m => `<div class="m ${m.r}" dir="auto">${m.r === 'b' ? esc(t(m.k)) : esc(m.text)}</div>`).join('')}</div>
  <div class="quick">${QS.map(q => `<button data-act="q" data-q="${q}">${t('q_' + q)}</button>`).join('')}</div>
  <div class="send"><input id="ci" placeholder="${t('chatPh')}" aria-label="${t('chatPh')}"><button class="btn" data-act="send">${t('send')}</button></div></div>`;
}
function vSettings() {
  const sel = (a, v, k) => `<button class="btn ${v ? '' : 'alt'}" data-act="${a}" data-v="${k}">${t(k) === k ? k : t(k)}</button>`;
  return `<div class="grid g2"><div class="card"><h3>${t('set_lang')}</h3><div class="row"><button class="btn ${S.lang === 'en' ? '' : 'alt'}" data-act="lang" data-v="en">English</button><button class="btn ${S.lang === 'ar' ? '' : 'alt'}" data-act="lang" data-v="ar">العربية</button></div>
  <h3 style="margin-top:18px">${t('set_theme')}</h3><div class="row">${sel('theme', S.theme === 'dark', 'dark').replace('data-v="dark"', 'data-v="dark"')}${sel('theme', S.theme === 'light', 'light')}</div>
  <h3 style="margin-top:18px">${t('reset')}</h3><button class="btn alt" data-act="reset">${t('reset')}</button></div>
  <div class="card"><h3>${t('about')}</h3><p>${t('aboutText')}</p><h3>${t('aiStatus')}</h3><p>${t('aiStatusText')}</p></div></div>`;
}
const VIEWS = { dashboard: vDash, new: vNew, analysis: vAnalysis, reports: vReports, dups: vDups, review: vReview, chat: vChat, settings: vSettings };

/* ---- shell ---- */
function apply() { const h = document.documentElement; h.lang = S.lang; h.dir = t('dir'); h.dataset.theme = S.theme; }
function render() {
  apply();
  $('#app').innerHTML = `<div class="app"><aside class="side ${S.open ? 'open' : ''}" id="side"><div class="brand"><img src="logo.png" alt="RISE"><div><b>RISE</b><small>${t('tagline')}</small></div></div><nav class="nav" aria-label="main">${Object.keys(VIEWS).map(v => `<button class="${S.view === v ? 'on' : ''}" data-act="nav" data-v="${v}">${ic(v)}${t('nav_' + v)}</button>`).join('')}</nav></aside>
  <div class="scrim ${S.open ? 'open' : ''}" data-act="close"></div>
  <div class="main"><header class="top"><button class="ib burger" data-act="menu" aria-label="${t('menu')}">${ic('menu')}</button><h1>${t('nav_' + S.view)}</h1>
   <button class="ib" data-act="lang" data-v="${S.lang === 'en' ? 'ar' : 'en'}">${ic('globe')}<span>${S.lang === 'en' ? 'العربية' : 'English'}</span></button>
   <button class="ib" data-act="theme" data-v="${S.theme === 'dark' ? 'light' : 'dark'}" aria-label="${t('set_theme')}">${ic(S.theme === 'dark' ? 'sun' : 'moon')}</button></header>
  <main id="view">${VIEWS[S.view]()}</main></div></div>${S.modal ? `<div class="modal" data-act="close"><div class="card" data-stop>${analysisCard(S.reports.find(r => r.id === S.modal))}<div class="row"><button class="btn" data-act="close">${t('close')}</button></div></div></div>` : ''}`;
  const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight;
}
function toast(m) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 2800); }
function go(v) { S.view = v; S.open = false; S.modal = null; render(); window.scrollTo(0, 0); }

/* ---- actions ---- */
function validateForm() {
  S.err = {}; const e = RiseAI.validate(S.form.text); if (e) S.err.text = t('e_' + e);
  const p = S.form.ppl.trim(); if (p && !(/^\d+$/.test(p) && +p >= 1 && +p <= 100000)) S.err.ppl = t('e_people');
  return !S.err.text && !S.err.ppl;
}
function run(after) {
  if (!validateForm()) { render(); return; }
  S.busy = true; render();
  setTimeout(() => { S.busy = false; S.draft = build(S.form.text, { loc: S.form.loc, people: S.form.ppl }, S.reports); after(); }, 650);
}
function persistDraft() {
  const r = { ...S.draft, id: nextId() }; S.reports.push(r); save(); S.form = { text: '', loc: '', ppl: '' }; S.draft = null; toast(t('saved') + ' · ' + r.id); go('reports');
}
const bot = k => S.chat.push({ r: 'b', k: 'b_' + k });
const ACT = {
  nav: d => go(d.v), menu: () => { S.open = !S.open; render(); }, close: () => { S.open = false; S.modal = null; render(); },
  lang: d => { S.lang = d.v; Store.set('lang', S.lang); render(); }, theme: d => { S.theme = d.v; Store.set('theme', S.theme); render(); },
  analyze: () => run(() => { toast(t('toastNeed')); go('analysis'); }), save: () => run(persistDraft), saveDraft: persistDraft,
  view: d => { S.modal = d.id; render(); }, gor: d => { S.modal = null; go('review'); },
  dec: d => { const r = S.reports.find(x => x.id === d.id); r.status = d.d; r.decidedAt = new Date().toISOString(); save(); toast(t('r_done') + ' · ' + r.id); render(); },
  q: d => { S.chat.push({ r: 'u', text: t('q_' + d.q) }); bot(d.q); render(); },
  send: () => { const i = $('#ci'), v = i.value.trim(); if (!v) return; S.chat.push({ r: 'u', text: v }); bot(RiseBot.intent(v)); render(); $('#ci').focus(); },
  reset: () => { if (confirm(t('resetQ'))) { seed(); S.draft = null; toast(t('resetDone')); render(); } }
};
document.addEventListener('click', e => {
  if (e.target.closest('[data-stop]') && !e.target.closest('[data-act]')) return;
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (el.classList.contains('modal') && e.target !== el) return;
  ACT[el.dataset.act]?.(el.dataset);
});
document.addEventListener('input', e => {
  const k = e.target.dataset.k; if (k) S.form[k] = e.target.value;
  if (e.target.id === 'q') { S.f.q = e.target.value; $('#tbl').innerHTML = tableHtml(filtered()); }
});
document.addEventListener('change', e => {
  if (e.target.id === 'fn') S.f.need = e.target.value; if (e.target.id === 'fp') S.f.prio = e.target.value;
  if (e.target.id === 'fn' || e.target.id === 'fp') $('#tbl').innerHTML = tableHtml(filtered());
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'ci') ACT.send(); if (e.key === 'Escape') ACT.close(); });
render();
})();
