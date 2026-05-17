import re

with open('c:/Users/victo/.gemini/antigravity/scratch/congregate/docs/as_is_documentation.md', 'r', encoding='utf-8') as f:
    content = f.read()

# 6.4 Dashboard Page
dashboard_new = """### 6.4 Dashboard Page

**File:** `client/src/pages/DashboardPage.tsx`

**Access:** All roles.

**Data fetched on mount:**
- `GET /api/groups` → group list
- `GET /api/admin/stats` → `{ memberCount, groupCount, activeAlerts }`
- `GET /api/alerts` → finds first `alertType === 'drop'` for critical banner
- `GET /api/ml/accuracy` → SVR accuracy metrics
- `GET /api/admin/recent?limit=4` → recent attendance logs

**Components:**

1. **Page header** — "Good day, [FirstName]" greeting + current date (locale: `en-KE`).
2. **Alert banner** — shown if a `drop` alert exists; displays message, recommendation, "View Alerts" button. Styled as `notice notice-warn`.
3. **Bento stat cards (4):**
   - Total Members (from API `memberCount`)
   - Active Groups (from API `groupCount`)
   - Active Alerts (from API `activeAlerts`)
   - SVR Accuracy — dynamically derived from overall MAE via `/api/ml/accuracy`
4. **View toggle** — Cards / Table (inline tab strip).
5. **Cards view** — CSS grid. Each card shows: group name, status tag, dynamic member count and trend based on API data, and a 10-point sparkline generated programmatically.
6. **Table view** — `data-tbl` table with columns: Group, Category, Leader, Members, Trend, Status.
7. **Right sidebar (300px):**
   - Quick Actions: Log Attendance, Submit Feedback, AI Forecast, Manage Alerts
   - SVR Model Health: progress bars generated from real model accuracy data via `/api/ml/accuracy`.
   - Recent Activity: dynamically fetched from `/api/admin/recent`.
"""

content = re.sub(r'### 6\.4 Dashboard Page.*?(?=### 6\.5)', dashboard_new, content, flags=re.DOTALL)

# 6.5 Attendance Page
attendance_new = """### 6.5 Attendance Page

**File:** `client/src/pages/AttendancePage.tsx`

**Access:** usher, pastor (via nav), admin.

**Two tabs:** Log Session | History

**Log Session tab — form fields:**
- **Onboarding Banner:** "New to the system? Start by importing your existing records via Data Import before logging new sessions."
- Faith Group (dropdown, from `GET /api/groups`)
- Session Date (date picker, defaults today, max = today)
- Headcount (number input, min 0, required)
- RSVP Count (number input, min 0, optional)
- Session Notes (textarea, UI-only)
- Submit and Clear buttons

**Validation:**
- Warning if headcount > RSVP count
- Duplicate detection: overwrite confirmation modal

**Real-time Rate Preview panel:**
- Shows `rate = headcount / rsvpCount * 100` with progress bar.

**History tab:**
- Group selector dropdown
- `GET /api/attendance/:groupId`
- Table: Date, Headcount, RSVP, Rate
- Export CSV button
"""

content = re.sub(r'### 6\.5 Attendance Page.*?(?=### 6\.6)', attendance_new, content, flags=re.DOTALL)

# 6.6 Forecast Page
forecast_new = """### 6.6 Forecast Page

**File:** `client/src/pages/ForecastPage.tsx`

**Access:** pastor, admin only.

**Data flow:**
1. On mount: `GET /api/groups` and `GET /api/ml/accuracy`.
2. On group change: `GET /api/forecast?group=<id>` → receives `{ forecast, alert, historical }`.
3. Builds chart data.
4. Fetches forecasts for all groups in parallel for comparison table.

**Components:**

1. **Control row (glass panel):**
   - Group selector dropdown
   - KPI strip: Current attendance, 6-Week Predicted, Outlook %, Accuracy (dynamically derived)
2. **Forecast chart (Recharts AreaChart):**
   - X-axis: session dates
   - Series: `actual`, `predicted`, `hi`/`lo` confidence band
3. **Model Details (collapsible panel):**
   - Shows MAE, RMSE, Best Params, and Last Trained timestamp fetched from `/api/ml/accuracy`.
4. **Insight cards (3-column bento):**
   - Trend Direction, Confidence Interval, AI Recommendation
5. **Insufficient data empty state:** Needs at least 5 records or prompts user to use Data Import.
6. **All Groups Comparison table:** Group, Latest Actual, SVR Predicted, Change, Confidence Range.
"""

content = re.sub(r'### 6\.6 Forecast Page.*?(?=### 6\.7)', forecast_new, content, flags=re.DOTALL)

# 6.8 Feedback Page
feedback_new = """### 6.8 Feedback Page

**File:** `client/src/pages/FeedbackPage.tsx`

**Access:** All roles.

**Two tabs:** Submit | History

**Submit tab:**
- Faith Group (dropdown)
- Session Date
- Average Session Rating (1–5 star widget)
- Number of Respondents
- Key Themes / Notes
- Submit and Clear buttons

**Right sidebar:**
- Top Rated panel: dynamically fetches top groups based on feedback history.

**History tab:**
- Table: Group, Date, Avg Rating, Responses, Sentiment tag
"""

content = re.sub(r'### 6\.8 Feedback Page.*?(?=### 6\.9)', feedback_new, content, flags=re.DOTALL)

# 6.9 Settings Page
settings_new = """### 6.9 Settings Page

**File:** `client/src/pages/SettingsPage.tsx`

**Access:** admin, pastor.

**Sidebar tabs:** My Profile | Notifications | ML Parameters | About System

**Profile tab:** Name and email inputs, Church Profile saving capabilities hooked to API.
**Notifications tab:** Checkbox toggles for system alerts.
**ML Parameters tab (admin-only):** Manual Retrain section.
**About System tab:** System metadata and scoping rules for Nairobi evangelical churches.
"""

content = re.sub(r'### 6\.9 Settings Page.*?(?=### 6\.10)', settings_new, content, flags=re.DOTALL)

# 6.10 Import Page
import_new = """### 6.10 Import Page

**File:** `client/src/pages/ImportPage.tsx`

**Access:** admin only.

**4-step wizard:**

**Step 1 — Upload CSV:**
- Faith Group selector
- Textarea for CSV paste / Load 6-Month Sample
- "Map Columns →" button

**Step 2 — Church Profile:**
- Column Mapping (matching CSV headers to expected system fields)
- Church Profile form: Church Name, Active Membership, Primary Location, Years of Digital Records, Tech Stack.
- Saves profile demographic data via `POST /api/church/profile`.

**Step 3 — Review:**
- Table preview of mapped rows.
- "⚡ Import N Rows & Train SVR" button (calls `POST /api/admin/import`).

**Step 4 — Done:**
- Success celebration with import stats.
- Notice that SVR Retraining was triggered.

---

"""

content = re.sub(r'### 6\.10 Import Page.*?(?=## 7\.)', import_new, content, flags=re.DOTALL)

with open('c:/Users/victo/.gemini/antigravity/scratch/congregate/docs/as_is_documentation.md', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated as_is_documentation.md")
