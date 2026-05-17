# Frontend Developer & UI/UX Guide: Faith Organization Growth Forecasting System

Welcome to the project! This document is a comprehensive guide to the existing frontend architecture of the **Faith Organization Growth Forecasting System**. It explains how the frontend is currently structured, what technologies are in use, the existing design system, and a breakdown of all core files. 

Since you are taking over the UI/UX and frontend component design, your goal is to understand this structure, create new designs/components, and provide the updated React components/CSS. Once you are done, the updated code will be integrated back into the existing backend and Machine Learning pipeline.

---

## 1. Technology Stack & Core Libraries

The frontend is a Single Page Application (SPA) built with modern web technologies:

- **Framework**: React 18
- **Build Tool**: Vite (Extremely fast HMR and optimized builds)
- **Routing**: `react-router-dom` (v6) for client-side navigation and protected routes.
- **Styling**: Standard CSS with a custom design system built on CSS Variables (Glassmorphism, Dark Theme). *Note: Tailwind CSS is installed but the core UI is heavily driven by `index.css` custom classes.*
- **Data Fetching**: `axios` configured with a custom client for API requests.
- **Data Visualization**: `recharts` for rendering the SVR (Support Vector Regression) forecasting charts.

---

## 2. Directory Structure & Architecture

The frontend code is located inside the `client/` directory of the monorepo. Here is the high-level structure:

```text
client/
├── index.html           # Main HTML entry point
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── src/
    ├── api/             # Axios API client configuration
    ├── components/      # Reusable UI components (Navbar, Charts, Alerts)
    ├── context/         # Global state management (AuthContext)
    ├── pages/           # Route-level page components
    ├── App.jsx          # Root component & Route definitions
    ├── main.jsx         # React DOM rendering entry point
    └── index.css        # Global styles, variables, and custom CSS classes
```

---

## 3. Detailed File Breakdown

Here is exactly what currently exists in the codebase and what each file is responsible for.

### Entry Points & Routing
- **`src/main.jsx`**: The standard React entry point that mounts `<App />` to the DOM inside `<StrictMode>`.
- **`src/App.jsx`**: Contains the `BrowserRouter` and `Routes`. It defines a `ProtectedLayout` component that wraps authenticated routes with the `Navbar` and a `main-content` container. It enforces Role-Based Access Control (RBAC) (e.g., only admins/pastors can see the Forecast page).

### Global State (`src/context/`)
- **`AuthContext.jsx`**: Provides a global `useAuth()` hook. It manages the `user` object (which includes their `role` like `admin`, `pastor`, `usher`, `member`) and handles the global loading state while checking authentication.

### API Integration (`src/api/`)
- **`client.js`**: An Axios instance configured to point to the backend API. It automatically attaches authentication credentials/tokens to headers for every request.

### Reusable Components (`src/components/`)
- **`Navbar.jsx`**: The sidebar navigation menu. It dynamically renders navigation links based on the current user's role and includes a user profile badge and logout button.
- **`AlertBanner.jsx`**: A stylized banner component used to display system alerts and ML-generated warnings (e.g., dropping attendance trends).
- **`ForecastChart.jsx`**: A complex wrapper around `recharts`. It renders the historical attendance data (solid lines) alongside the Machine Learning predicted future attendance (dashed lines) and confidence intervals (shaded areas).

### Pages (`src/pages/`)
- **`LoginPage.jsx`**: The authentication screen with an email/password form.
- **`DashboardPage.jsx`**: The main landing page after login. Displays high-level statistic cards (Active Groups, Active Alerts, SVR Models), an `AlertBanner`, and a table of registered groups.
- **`AttendancePage.jsx`**: A page for Ushers/Admins to log actual headcounts and RSVP data for specific group sessions.
- **`FeedbackPage.jsx`**: A page to log qualitative feedback (average ratings and response counts) for group sessions.
- **`ForecastPage.jsx`**: The core ML page. Allows users to select a group and view the `ForecastChart` component, comparing historical data against the AI's future predictions.
- **`AlertsPage.jsx`**: A dedicated view for admins/pastors to see a detailed list of all system-generated growth/decline alerts and acknowledge them.

---

## 4. Current Design System & Aesthetics (`src/index.css`)

The application currently uses a **"Rich Dark Theme"** with a strong emphasis on **Glassmorphism** and dynamic elements. 

If you are redesigning the UI, please maintain or elevate this premium, state-of-the-art aesthetic.

### Core Visual Elements:
- **Typography**: Uses `Outfit` for headings (giving a modern, geometric feel) and `Plus Jakarta Sans` for body text.
- **Color Palette (CSS Variables)**:
  - Backgrounds: Deep, rich darks (`#050505`) with translucent surface layers (`rgba(20, 20, 25, 0.6)`).
  - Accents: Soft Indigo (`--accent-primary`), Soft Fuchsia (`--accent-secondary`), Emerald (`--accent-success`), and Amber (`--accent-warning`).
- **Glassmorphism**: Extensive use of `backdrop-filter: blur()` on cards, the sidebar, and banners to create depth over an animated, pulsing background gradient.
- **Micro-animations**: Subtle hover states, translation effects on cards (`transform: translateY(-4px)`), glowing drop shadows on stats, and smooth page load animations (`fadeUp`).

### Existing CSS Utility Classes to Know:
- `.app-layout` / `.main-content`: Handles the sidebar layout.
- `.card` / `.stat-card`: Reusable glassmorphic containers.
- `.btn`, `.btn-primary`, `.btn-outline`: Standardized button styling with hover effects.
- `.form-input`, `.form-select`: Styled form controls with focus rings.
- `.table-wrapper`: A styled container for data tables.
- `.badge`: Small pill-shaped indicators for roles/categories.

---

## 5. Data Models (API Responses)

When designing your components, you should know what data structure to expect from the API. Here are the core data models:

- **User**: `{ id, name, email, role: 'admin'|'pastor'|'usher'|'member' }`
- **Group**: `{ id, name, category, leader: { name }, createdAt }`
- **Attendance**: `{ id, groupId, sessionDate, headcount, rsvpCount }`
- **Forecast Data Point**: `{ date, actual: number|null, predicted: number|null, lowerBound: number, upperBound: number }`
- **Alert**: `{ id, groupId, alertType: 'drop'|'growth'|'stable', message, recommendation, acknowledged }`

---

## 6. Your Workflow & Next Steps

As the UI/UX developer, here is how you should proceed:

1. **Review & Redesign**: Look at the current routing and page structure. You can use Figma to design new, better interfaces while keeping the premium dark theme/glassmorphism vibe (or propose a stunning alternative).
2. **Build the Components**: You can edit the files in `src/pages/` and `src/components/`, and update `src/index.css` (or utilize Tailwind if you prefer to migrate entirely to utility classes). 
3. **Use Mock Data**: You do not need to worry about the backend database or Python SVR microservice. Just hardcode mock data matching the structures in Section 5 into your React components to make the UI look complete.
4. **Handoff**: Once the frontend looks amazing, responsive, and polished, simply hand the codebase back. The engineering team (and AI) will handle hooking your beautiful UI back into the `api/client.js`, the `AuthContext`, and the backend ML data streams.
