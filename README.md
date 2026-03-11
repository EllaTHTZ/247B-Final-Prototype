# 247B Final Prototype - Clanker Clash

React + TypeScript (Vite) clickable prototype of a **generic LLM site** with a simulated **Chrome extension overlay**.

## Notes

- This is frontend-only prototype logic (no backend, no real extension permissions).
- Prompt scoring is heuristic and intentionally very simple for demo use.
- We suggest trying these prompts:

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

## Music Credits
shushubobo - coffee time [no copyright music]
shushubobo - stuck in nintendo ! ! ! [no copyright music]
