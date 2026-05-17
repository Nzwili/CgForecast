# CG Forecast — Frontend Handoff

**UI/UX redesign by Claude (Antigravity project)**  
Ready to drop into the existing monorepo `client/` directory.

---

## What's in this package

```
client/
├── index.html                      # Vite HTML entry (unchanged)
├── package.json                    # Dependencies (recharts added)
├── vite.config.ts                  # Path alias @ → src (unchanged)
├── tsconfig.app.json               # TS config (ignoreDeprecations added)
├── tailwind.config.js              # Tailwind config (unchanged)
├── postcss.config.js               # PostCSS (unchanged)
└── src/
    ├── main.tsx                    # React entry (unchanged)
    ├── App.tsx                     ★ REPLACED — routing + auth state
    ├── index.css                   ★ REPLACED — 2026 Aurora design system
    ├── components/
    │   └── Navbar.tsx              ★ REPLACED — RBAC sidebar
    └── pages/
        ├── LoginPage.tsx           ★ REPLACED
        ├── DashboardPage.tsx       ★ REPLACED — bento grid layout
        ├── AttendancePage.tsx      ★ REPLACED
        ├── ForecastPage.tsx        ★ REPLACED — recharts SVR chart
        ├── AlertsPage.tsx          ★ REPLACED
        └── FeedbackPage.tsx        ★ REPLACED — star rating widget
```

---

## Integration steps

1. **Replace** the `client/` directory contents with these files (preserve your existing `client/src/api/`, `client/src/context/` — they are untouched).

2. **Install the one new dependency:**
   ```bash
   cd client && npm install recharts
   # or: pnpm add recharts / yarn add recharts
   ```

3. **Hook up real data** — every page uses local mock arrays. Search for the comment `// TODO: replace with api/client.js call` pattern (or just grep for the mock arrays at the top of each page file). Wire each to your existing `api/client.js` Axios instance.

4. **Connect AuthContext** — `App.tsx` currently manages `user` state locally with a `useState`. Replace the `useState<User|null>(null)` and login handler with your existing `useAuth()` hook from `src/context/AuthContext.jsx`.

5. **Run dev server:**
   ```bash
   cd client && npm run dev
   ```

---

## Design system notes (`src/index.css`)

The entire design lives in CSS custom properties — no Tailwind component classes used for the core UI. Key tokens:

| Token | Value | Usage |
|---|---|---|
| `--a-indigo` | `#7c6df0` | Primary accent, buttons, active nav |
| `--a-violet` | `#b86ef8` | Secondary accent, gradients |
| `--a-emerald` | `#10d98a` | Success, growth indicators |
| `--a-rose` | `#f85f7c` | Danger, decline alerts |
| `--a-amber` | `#f8b94e` | Warnings, ratings |
| `--bg-void` | `#03030a` | Base background |
| `--t-hi / --t-mid / --t-lo` | — | Text hierarchy (3 levels) |

Font stack: **Syne** (headings) + **Inter** (body) + **JetBrains Mono** (numbers/code) — all loaded from Google Fonts in `index.css`.

---

## Files NOT included (already exist in your repo, do not overwrite)

- `src/api/client.js` — Axios instance
- `src/context/AuthContext.jsx` — Auth state
- `src/App.css` — (unused, can delete)
