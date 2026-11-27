# RISE — Response Intelligence for Smart Emergencies
# رايز — ذكاء الاستجابة للطوارئ الذكية

A humanitarian report-management demo: turns unstructured reports into structured, classified, prioritized cases.
**Demo AI – Simulated Analysis:** the analysis is a local rule/keyword engine written in JavaScript. It is **not** a real LLM and no API is called. All sample data is fictional. The final decision always stays with the human coordinator.

## Project structure
```
RISE/
├── index.html
├── style.css              Themes + responsive layout
├── app.js                 UI, navigation, language/theme switching, actions
├── ai.js                  Demo AI engine
├── priority.js            Experimental priority score
├── duplicates.js          Duplicate detection
├── chatbot.js             RISE Assistant intents
├── translations.js        AR/EN text + fictional sample reports
├── storage.js             LocalStorage wrapper
├── logo.png
├── favicon.png
└── run-tests.js
```
Theme and language switching live in `app.js` and `style.css` (merged instead of separate i18n/theme/responsive files).

## Run
Open `index.html` in a browser (or VS Code → Live Server). No build step, no API key. Fonts (Cairo, Inter) load from Google Fonts.
Tests: `node run-tests.js`

## Brand colors (from the design)
Deep brown `#1b0e08` / `#2a160d`, copper `#8a4420`, gazelle tan `#d19a6c`, sand `#f5ede6`.

## Connecting the Anthropic API later (secure way)
Never put an API key in the browser. Add a small Express server that holds the key and exposes `/api/analyze`:
```bash
npm init -y && npm i express @anthropic-ai/sdk
```
```js
// server.js
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
const app = express(); app.use(express.json()); app.use(express.static('.'));
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); // from env, never committed
app.post('/api/analyze', async (req, res) => {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 800,
    system: 'Return ONLY JSON: {need, location, people, urgency[], missing[]}. Use null when not stated. Never invent data.',
    messages: [{ role: 'user', content: String(req.body.text).slice(0, 2000) }]
  });
  res.json(JSON.parse(msg.content[0].text));
});
app.listen(3000);
```
Then in `app.js` replace the `RiseAI.analyze(...)` call inside `build()` with `await fetch('/api/analyze', ...)` and keep `RiseAI.analyze` as the offline fallback. Keep `priority.js`, `duplicates.js` and the human-review step unchanged.
