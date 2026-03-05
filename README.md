# 247B Final Prototype - Clanker Clash

React + TypeScript (Vite) clickable prototype of a **generic LLM site** with a simulated **Chrome extension overlay**.

## What this prototype includes

- Generic "Ask anything" LLM-like page
- Top-right extension panel (Clanker Clash)
- Tug-of-war game: Humans vs Robots over lava
- Prompt scoring (intentional vs low-effort)
- Feedback after each submitted prompt
- Template dropdown shown after low-effort prompts
- Settings panel (Always On, session toggle, difficulty, music slider)
- Win/Lose states, reflection prompt, and Play Again loop

## Run locally

From this repo root:

```bash
npm install
npm run dev
```

Then open the Vite URL shown in terminal (usually `http://localhost:5173`).

## Notes

- This is frontend-only prototype logic (no backend, no real extension permissions).
- Prompt scoring is heuristic and intentionally simple for demo use.
