# ⚡ ExamEdge Pro

> A scalable, modular exam preparation platform built with HTML5, CSS3, and Vanilla JavaScript.

---

## 🗂 Project Structure

```
examedge-pro/
├── index.html                   # App shell & entry point
│
├── css/
│   ├── styles.css               # Design tokens, resets, utilities
│   ├── layout.css               # Navbar, sidebar, main shell, grids
│   └── components.css           # Cards, buttons, forms, modal, question UI
│
├── js/
│   ├── app.js                   # Bootstrap, router, component loader
│   ├── config.js                # Constants, routes, feature flags
│   ├── state.js                 # Reactive pub/sub state store
│   ├── utils.js                 # DOM helpers, formatters, validators
│   ├── firebase.js              # Firebase stub (ready to activate)
│   └── modules/
│       ├── auth.js              # Sign in / sign up / sign out
│       ├── user.js              # Profile management
│       ├── practice.js          # Practice session engine
│       ├── mock.js              # Timed mock exam with navigator
│       ├── exam.js              # Scheduled exam library
│       ├── xp.js                # XP award, leveling, streak
│       ├── achievements.js      # Achievement definitions & unlock logic
│       ├── milestones.js        # Long-term goal tracking
│       ├── leaderboard.js       # Rankings fetch & render
│       └── analytics.js         # Dashboard stats & weak topic analysis
│
├── components/
│   ├── navbar.html              # Top navigation bar
│   ├── sidebar.html             # Left sidebar with nav links
│   └── modal.html               # Global modal shell (openModal / closeModal)
│
├── pages/
│   ├── dashboard.html           # Home — stats, activity, weak topics
│   ├── practice.html            # Topic/difficulty picker + question flow
│   ├── mock.html                # Full mock exam with timer + nav grid
│   ├── exam.html                # Exam library with status badges
│   ├── leaderboard.html         # Podium + full ranked list
│   └── profile.html             # Avatar, XP ring, achievements, milestones
│
├── assets/
│   ├── images/                  # Static image assets
│   └── icons/                   # SVG icon files
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Serve the project locally

This project uses ES Modules (`type="module"`), so you **must** serve it via a local HTTP server — not `file://`.

```bash
# Option 1: Python
python3 -m http.server 3000

# Option 2: Node (npx)
npx serve .

# Option 3: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open **http://localhost:3000** in your browser.

---

## 🏗 Architecture

### State Management (`js/state.js`)
A lightweight pub/sub reactive store with dot-path access:

```js
import { store } from './state.js';

// Read
const xp = store.get('xp.total');

// Write (shallow merge)
store.set('xp', { total: 1200 });

// Subscribe to changes
const unsub = store.subscribe('xp', newXp => {
  console.log('XP changed:', newXp);
});

// Unsubscribe
unsub();
```

State is auto-persisted to `localStorage` for `user`, `xp`, `achievements`, and `theme`.

---

### Router (`js/app.js`)
Hash-free client-side router using `data-route` attributes:

```html
<a data-route="/practice">Practice</a>
```

```js
// Programmatic navigation
window.navigate('/leaderboard');
```

Pages are lazy-fetched as HTML and their corresponding JS module `init()` is called on arrival.

---

### Modules
Every page module exports an `init()` function called by the router:

```js
// js/modules/practice.js
export function init() {
  requireAuth();
  renderSetupUI();
  bindEvents();
}
```

---

### Components
HTML components (`navbar`, `sidebar`, `modal`) are fetched once at boot and injected into mount points:

```html
<div id="navbar-mount"></div>
<div id="sidebar-mount"></div>
<div id="modal-mount"></div>
```

---

## 🔥 Firebase Integration

Firebase is pre-wired but disabled. To activate:

1. **Install Firebase SDK** (or use CDN)
2. **Fill in credentials** in `js/config.js` → `FIREBASE_CONFIG`
3. **Enable the feature flag** in `js/config.js`:
   ```js
   FIREBASE_ENABLED: true
   ```
4. **Uncomment** the real SDK calls in `js/firebase.js`
5. **Swap stubs** in `auth.js`, `leaderboard.js`, and each module with real Firestore calls

All Firestore patterns are pre-written as comments — just uncomment and remove the mock data.

---

## 🎮 XP & Gamification System

| Action              | XP Reward |
|---------------------|-----------|
| Correct Answer      | +10 XP    |
| Daily Streak        | +20 XP    |
| First Practice      | +50 XP    |
| Perfect Mock (100%) | +100 XP   |
| Level Threshold     | 500 XP    |

Award XP anywhere in the app:

```js
import { awardXP, XP_ACTIONS } from './modules/xp.js';

// Named action
XP_ACTIONS.correctAnswer();

// Custom amount
awardXP(25, '🎯 Bonus round complete!');
```

---

## 🎨 Theming

The design system is token-based. Swap themes by toggling `data-theme` on `<html>`:

```js
document.documentElement.setAttribute('data-theme', 'light'); // or 'dark'
```

Add new themes by extending `:root` token overrides in `css/styles.css`.

---

## 🧩 Adding a New Page

1. Create `pages/my-page.html`
2. Create `js/modules/my-page.js` with an exported `init()` function
3. Register in `app.js`:
   ```js
   const ROUTES  = { ..., MY_PAGE: '/my-page' };
   const PAGE_HTML    = { ..., '/my-page': 'pages/my-page.html' };
   const PAGE_MODULES = { ..., '/my-page': () => import('./modules/my-page.js') };
   ```
4. Add a sidebar link in `components/sidebar.html`

---

## 🧹 Code Conventions

- **ES Modules** only — no global script tags except `app.js`
- **No frameworks** — vanilla DOM APIs + the state store
- **Data attributes** for JS hooks (`data-route`, `data-xp`, `data-user-name`)
- **CSS variables** for all colors, spacing, and radii
- **`requireAuth()`** guard at the top of every protected module's `init()`

---

## 📦 Future Roadmap

- [ ] Firebase Auth + Firestore integration
- [ ] Question bank API integration
- [ ] PWA support (offline mode, install prompt)
- [ ] Detailed per-topic analytics with charts
- [ ] Admin dashboard for question management
- [ ] Push notifications for streak reminders
- [ ] Multiplayer live quiz rooms

---

## 📄 License

MIT — free to use, modify, and distribute.
