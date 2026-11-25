# Installation & Execution Guide — PlantCare

## 1. Prerequisites

- **Node.js:** v18.0 or newer (tested on Node.js v24.20.0)
- **npm:** v9.0 or newer (tested on npm 11.19.0)
- **Modern Web Browser:** Chrome, Edge, Firefox, or Safari with `localStorage` and `IndexedDB` enabled.

## 2. Installation Steps

```bash
# Clone the repository
git clone https://github.com/pavanchakravarti23/PLANTCARE-SMART-PLANT-CARE-MANAGEMENT-SYSTEM.git

# Navigate into the project directory
cd PLANTCARE-SMART-PLANT-CARE-MANAGEMENT-SYSTEM

# Install project dependencies
npm install
```

> **Windows PowerShell Note:** If PowerShell restricts `.ps1` script execution (`npm.ps1 cannot be loaded`), run `npm.cmd install` and `npm.cmd run dev` instead, or run from Command Prompt / Git Bash.

## 3. Running in Development Mode

```bash
npm run dev
```

Open the local URL printed by Vite (default: `http://localhost:5173`).

## 4. Running Automated Tests

```bash
npm test
```

## 5. Creating & Previewing a Production Build

```bash
# Build optimised static files into dist/
npm run build

# Preview the production bundle locally
npm run preview
```

## 6. Demonstrating the Application

1. On a fresh browser session, PlantCare displays a clean **empty state** with options to add your first plant or load the **Sample Garden (5 Plants)**.
2. Click **Load Sample Garden** to populate Tulsi, Rose, Aloe Vera, Money Plant, and Snake Plant along with overdue, today, upcoming, and completed sample tasks.
3. Visit **Settings** at any time to export a JSON backup, import a backup, reset demo data, or erase all local data.
