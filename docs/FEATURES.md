# Features Specification — PlantCare

## 1. Dashboard (`src/modules/dashboard.js`)
- Dynamic greeting with user display name and current local date.
- Live KPI cards: Total Plants, Tasks Due Today, Overdue Tasks, Completed Tasks.
- Weekly Care Progress bar and 7-day **Chart.js** comparison chart (Completed vs Scheduled Due).
- Upcoming Care Activities queue with one-click task completion.
- Recent Plant Activity log showing recently completed tasks and calculated next due dates.
- Quick Add Plant and Quick Schedule Task buttons.
- Fresh-install empty state offering "Add First Plant" or "Load Demo Data (5 Plants)".

## 2. Plant Management (`src/modules/plants.js`)
- Full Create, Read, Update, Delete (CRUD) lifecycle.
- Search by plant name, variety/type, category, or location.
- Category filter (Indoor plants, Outdoor plants, Flowering plants, Succulents, Herbs, Trees, Vegetables) and Location filter (Balcony, Living room, Bedroom, Kitchen, Garden, Terrace).
- Plant photograph upload stored in **IndexedDB** with preview and MIME/size validation.
- Individual Plant Detail View displaying full botanical metadata, plant-specific schedule history, and growth diary logs.
- Confirmation dialog before deletion, with safe cascade cleanup of tasks, growth entries, and IndexedDB images.

## 3. Smart Care Scheduler & Calendar (`src/modules/scheduler.js`)
- Supports 7 activity types: Watering, Fertilising, Pruning, Repotting, Sunlight check, General maintenance, Custom activity.
- Repeat options: One-time, Every day, Every 2 days, Every 3 days, Every week, Every 2 weeks, Every month, Custom N-day interval.
- Monthly calendar grid, Weekly 7-column schedule view, and Daily Task List for any selected date.
- Colour-coded task chips (`overdue`, `due_today`, `upcoming`, `completed`, `skipped`).
- Pause and resume recurring schedules without deleting them.
- Local-calendar date math (`dateUtils.js`) preventing timezone shifts and accurately clamping month ends (including leap years).

## 4. Priority-Based Reminder Engine (`src/modules/reminders.js`, `src/services/engine.js`)
- Automatic live classification:
  - **High Priority:** Overdue (`dueDate < today`, never auto-completed).
  - **Medium Priority:** Due Today (`dueDate === today`).
  - **Normal Priority:** Upcoming (`dueDate > today`).
- Deterministic sorting by Priority → Due Date → Scheduled Time.
- Actions: Complete, Snooze (+1 day), Reschedule (custom date/time), Skip (no reward points).
- Optional Web Notifications API integration while PlantCare is open.

## 5. Plant Growth Diary (`src/modules/growth.js`)
- Chronological visual timeline filtered by plant or all plants.
- Upload growth photographs (stored in IndexedDB) with observation date and notes.
- Interactive **Before-and-After Comparison** panel allowing users to pair any two logged entries side by side.
- Explicit notice that tracking reflects user-logged photos and notes rather than automated measurement.

## 6. Rule-Based Plant Care Recommendation Engine (`src/modules/recommendations.js`)
- Structured static dataset (`src/data/plantDatabase.js`) covering 10 plants: **Tulsi, Rose, Aloe Vera, Money Plant, Snake Plant, Spider Plant, Peace Lily, Basil, Hibiscus, Jade Plant**, plus category fallbacks.
- Displays general watering guidance, sunlight preference, fertilising cadence, soil mix notes, and practical care tips.
- Clearly framed as general rule-based guidance (non-AI, non-sensor).
- One-click "Customise & Schedule" and "Add to My Plants" integration.

## 7. Rewards and Streaks (`src/modules/rewards.js`)
- +10 points per completed care task (duplicate-proof per `taskId`).
- +20 daily bonus points when all tasks due on a given day are completed (duplicate-proof per date).
- Current and longest daily care streaks calculated directly from `completedAt` dates.
- 7 milestone achievement badges including **7-Day Care Streak** and **30-Day Care Streak**.
- Transparent chronological reward points ledger.

## 8. Care Insights (`src/modules/insights.js`)
- Real-data KPIs and 3 **Chart.js** charts:
  - Weekly Completion Rate (Completed vs Due).
  - 30-Day Care Activity Trend.
  - Plant-Wise Activity Breakdown.
- Informative empty state when no plants or activities exist yet.

## 9. Settings & Data Portability (`src/modules/settings.js`)
- Customise display name, theme surface, date format, time format (12h/24h), and browser notification preference.
- Sample Demo Data loader and reset control.
- Complete JSON Export & Schema-Validated JSON Import (preserving IndexedDB images).
- Destructive Reset All Data with confirmation prompt.
- Clear explanation that data resides locally in the browser without cloud sync.
