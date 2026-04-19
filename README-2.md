# SGT – Simple Gym Tracker

A Progressive Web App (PWA) for tracking workouts, exercises, and cardio.

---

## Deploy in 5 minutes (Netlify)

### Step 1 — Install dependencies & build

Make sure you have [Node.js](https://nodejs.org) installed (v18 or later), then run:

```bash
npm install
npm run build
```

This produces a `dist/` folder — your complete app ready to publish.

---

### Step 2 — Deploy to Netlify (drag & drop, no account setup needed)

1. Go to **[netlify.com](https://netlify.com)** and sign up for free
2. From your dashboard, find the **"Deploy manually"** box at the bottom
3. Drag and drop your **`dist/`** folder onto it
4. Netlify gives you a live URL instantly (e.g. `https://random-name.netlify.app`)

**That's it — your app is live.**

---

### Step 3 — Give it a custom name (optional)

In Netlify → Site settings → Site details → Change site name
e.g. `sgt-gym.netlify.app`

---

### Step 4 — Add to your iPhone home screen

1. Open the app URL in **Safari** on your iPhone
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Tap **Add**

The SGT icon now appears on your home screen and opens full-screen, just like a native app. Data is stored on-device.

---

## Local development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

---

## Deploy to Vercel (alternative)

```bash
npm install -g vercel
npm run build
vercel deploy dist/
```

---

## Tech stack

- React 18
- Vite 5
- vite-plugin-pwa (Workbox)
- localStorage for data persistence
- No backend, no accounts — fully private

