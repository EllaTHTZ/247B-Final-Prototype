# 247B Final Prototype - Clanker Clash

React + TypeScript (Vite) clickable prototype of a **generic LLM site** with a simulated **Chrome extension overlay**.

## To Do
Improve Settings (@Ella)

Improve onboarding (@Marissa)

Make it fit the style tile better

Make it more compact

Hand drawings + background (@Min)

Fix scoring (@Eva)

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

## User Testing Variants
Set in App.tsx:

```ts
const FEATURE_FLAG_VERSION_1_ALWAYS_ON = true;
```

- `true`:
  - Onboarding includes the Always On question.
  - Settings shows the Always On toggle.
- `false`:
  - Onboarding skips Always On and treats it as off.
  - Settings hides the Always On toggle.
  - Users can still activate the extension by clicking the logo.

## Onboarding Persistence
- Preferences are saved in `localStorage` under key:
  - `clanker_clash_prefs_v1`
- On first visit, onboarding appears.
- On refresh/next visit, onboarding is skipped once saved.

## Clear Preferences For Testing
In browser DevTools Console:

```js
localStorage.removeItem('clanker_clash_prefs_v1');
```

Then refresh the page to see onboarding again.
