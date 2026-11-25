# Technology Stack — PlantCare

| Layer | Technology | Version / Standard | Role in PlantCare |
| :--- | :--- | :--- | :--- |
| **Markup** | HTML5 | Living Standard | Semantic application shell, accessible landmarks, forms, and dialogs |
| **Styling** | CSS3 | Custom Properties, Grid, Flexbox | Botanical minimal UI, responsive tablet/mobile layouts, status tokens |
| **Language** | JavaScript | ES6+ Modules | Modular application architecture without heavy framework overhead |
| **Build Tool** | Vite | `^6.0.3` | Fast HMR development server and optimised production bundling |
| **Data Visualisation** | Chart.js | `^4.4.7` | Weekly care progress, 30-day activity trends, plant-wise bar charts |
| **Icons** | Lucide | `^0.468.0` | Tree-shaken, crisp vector SVG icons replacing emoji clutter |
| **Structured Storage** | Web LocalStorage | Browser API | Lightweight JSON persistence for plants, tasks, rewards, and settings |
| **Media Storage** | IndexedDB | Browser API | Asynchronous local storage for uploaded plant and growth photographs |
| **Alerts** | Web Notifications API | Browser API | Optional desktop alerts while the app is open (with permission checks) |
| **Testing** | Vitest + JSDOM | `^2.1.8` / `^25.0.1` | Automated unit and integration tests for scheduling, reminders, storage, and rules |
| **Version Control** | Git & GitHub | Git 2.x | Feature-branch workflow and source management |

## Why Vanilla ES6+ Instead of a Heavy Framework?

- **Academic Clarity:** Undergraduate CSE evaluators can inspect every DOM update, event listener, storage call, and pure state transition directly without framework abstraction layers.
- **Zero External API Costs:** Works completely offline after bundling, requiring no paid API keys, backend servers, or external databases.
- **Clean Separation of Concerns:** Pure business rules in `src/services/engine.js` and `src/utils/dateUtils.js` remain testable in Node/JSDOM independently of UI rendering.
