/* RISE Assistant — demo keyword intents (no real LLM). Answers live in translations.js */
const RiseBot = {
  intents: [
    ['example', /example|sample|مثال|أمثلة|نموذج/i],
    ['dup', /duplic|similar|مكرر|تكرار|تشابه|مشابه/i],
    ['priority', /priorit|score|أولوية|درجة|نقاط/i],
    ['missing', /missing|incomplete|ناقص|مفقود|معلومات/i],
    ['write', /write|clear|better|اكتب|كتابة|أوضح|صياغة/i],
    ['cats', /categor|need type|types|فئات|أنواع|تصنيف|احتياج/i],
    ['analysis', /analy|result|ai|تحليل|نتائج|ذكاء/i],
    ['how', /how|use|start|help|كيف|استخدام|ابدأ|مساعدة/i]
  ],
  intent(q) { const i = this.intents.find(x => x[1].test(q)); return i ? i[0] : 'fallback'; }
};
if (typeof module !== 'undefined') module.exports = RiseBot;
