/* RISE Demo AI Engine — rule/keyword based. NOT a real LLM. */
const RiseAI = (() => {
  const NEED = {
    food: ['food','meal','bread','hungry','hunger','milk','ration','طعام','وجبات','وجبة','غذاء','جوع','خبز','حليب'],
    water: ['water','drinking','thirst','thirsty','مياه','ماء','شرب','عطش'],
    health: ['medical','medicine','injur','wound','bleed','sick','doctor','insulin','hospital','طبية','طبي','إصابة','مصاب','جريح','دواء','أدوية','مريض','نزيف','رعاية صحية','أنسولين'],
    shelter: ['shelter','tent','blanket','homeless','housing','roof','مأوى','إيواء','خيمة','بطانيات','مشرد','تشرد','سكن'],
    protection: ['protection','threat','violence','abuse','unsafe','missing person','حماية','تهديد','عنف','اعتداء','خطر','مفقود']
  };
  const PLACES = {
    rimal: { en: 'Al-Rimal', ar: 'الرمال', a: ['al-rimal','rimal','الرمال'] },
    shati: { en: 'Al-Shati', ar: 'الشاطئ', a: ['al-shati','shati','الشاطئ','الشاطىء'] }
  };
  const URG = {
    urgent: /urgent|emergency|immediately|critical|عاجل|طارئ|فورا|فوراً|حرج/,
    child: /\bchild|children|infant|baby|\bkid|طفل|أطفال|رضيع/,
    injury: /injur|wound|bleed|إصاب|مصاب|جريح|جرح|نزيف/,
    noSupply: /\bno (?:clean )?(?:drinking )?(?:water|food|shelter)|not enough|running out|ran out|shortage|لا توجد|لا يوجد|لا تتوفر|نفد|نقص/,
    duration: /(?:for|since)\s+(?:two|three|four|\d+)\s+days|منذ\s+(?:يومين|ثلاثة|\d+)|\d+\s*أيام/,
    vulnerable: /elderly|pregnant|disabled|كبار السن|حامل|مسن|معاق/
  };
  const AD = s => s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const locFrom = str => {
    const s = (str || '').trim().toLowerCase(); if (!s) return null;
    for (const k in PLACES) if (PLACES[k].a.some(a => s.includes(a))) return { key: k, en: PLACES[k].en, ar: PLACES[k].ar };
    const raw = str.trim(); return { key: s, en: raw, ar: raw };
  };
  function validate(text) {
    const s = String(text || '').trim();
    if (!s) return 'reqDesc'; if (s.length < 10) return 'shortDesc'; if (s.length > 2000) return 'longDesc'; return null;
  }
  function analyze(text, o = {}) {
    const raw = String(text || ''), s = AD(raw).toLowerCase();
    let need = null, best = 0;
    for (const k in NEED) { const n = NEED[k].filter(w => s.includes(w)).length; if (n > best) { best = n; need = k; } }
    let location = null;
    for (const k in PLACES) if (PLACES[k].a.some(a => s.includes(a))) { location = { key: k, en: PLACES[k].en, ar: PLACES[k].ar }; break; }
    if (!location) {
      const m = raw.match(/\b(?:in|at|near)\s+([A-Z][A-Za-z-]+(?:\s[A-Z][A-Za-z-]+)?)/) || raw.match(/(?:حي|منطقة|مخيم|مدينة|قرية)\s+([\u0600-\u06FF]+)/);
      if (m) location = locFrom(m[1]);
    }
    if (!location && o.loc) location = locFrom(o.loc);
    let people = null;
    const pm = s.match(/(\d+)\s*(?:people|persons|individuals|members|residents|أشخاص|شخص|أفراد|فرد|نسمة)/);
    if (pm) people = parseInt(pm[1], 10); else if (o.people) people = parseInt(o.people, 10) || null;
    const urgency = Object.keys(URG).filter(k => URG[k].test(s));
    const missing = [];
    if (!need) missing.push('need'); if (!location) missing.push('location'); if (!people) missing.push('people');
    return { need, location, people, urgency, missing };
  }
  const api = { analyze, validate, locFrom, PLACES };
  if (typeof module !== 'undefined') module.exports = api;
  return api;
})();
