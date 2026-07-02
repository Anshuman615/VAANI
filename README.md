# VAANI
# VAANI — Every Tongue, One Universe

Duolingo-style language learning app with an orbit-diagram home screen — built by Shivam, Orbit Studio.

## What's inside
- **5 languages, ready-made lessons**: Hindi, Telugu, Finnish, German, Japanese
  - 4 categories each: Greetings, Numbers 1-10, Common Phrases, Food & Drink
  - Mixed exercise types: multiple choice, reverse MCQ, type-the-answer
  - XP, streaks, per-language progress — all saved locally (localStorage)
  - Pronunciation via browser Text-to-Speech (🔊 Listen button)
- **AI Practice mode**: type ANY language (Spanish, French, Korean, Bengali, anything) + pick a topic → Gemini generates a fresh 8-word lesson on the spot, plays through the same exercise flow.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo in Vercel.
3. Add an environment variable:
   - `GEMINI_API_KEY` = your free Gemini key from https://aistudio.google.com/apikey
4. Deploy. That's it — `index.html` is static, `api/generate.js` runs as a serverless function automatically.

## Local testing
Since `/api/generate` needs a serverless runtime, use the Vercel CLI:
```
npm i -g vercel
vercel dev
```
Then open the local URL it gives you. Opening `index.html` directly (file://) will work for the 5 fixed languages but AI Practice won't have a backend to call.

## Adding more fixed languages
Edit the `DATA` object in `index.html` — add a new language key with the same 4 categories (`greetings`, `numbers`, `phrases`, `food`), each an array of `[english, native, transliteration]`. Then add it to `LANGUAGES` with a flag emoji and a BCP-47 speech code (for the Listen button).
