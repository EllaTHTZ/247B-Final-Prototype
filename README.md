# 247B Final Prototype - Clanker Clash

By: Thet Htar Thin Zar, Marissa Liu, Min Jung, Eva Casto \
*for Stanford CS247B: Design for Behavior Change*

Interactive prototype of a browser-extension-style game that encourages intentional prompting when using LLMs.

The interface simulates a generic LLM website with a Chrome extension overlay that evaluates prompts and drives a tug-of-war game between Humans and Robots.

## Prototype Architecture
### Frontend
* **Stack:** React + TypeScript (Vite)
* **Deployment:** GitHub Pages
* **Environment:** Simulated browser environment with extension overlay

### Backend
* **Stack:** Node.js + Express
* **Deployment:** Hosted on Google Cloud Run
* **AI Integration:** Uses Gemini API for prompt scoring

## Clear Preferences For Testing
In browser DevTools Console:

```js
localStorage.removeItem('clanker_clash_prefs_v1');
```

Then refresh the page to see onboarding again.

---

### Music Credits
shushubobo - coffee time [no copyright music], shushubobo - stuck in nintendo ! ! ! [no copyright music]
