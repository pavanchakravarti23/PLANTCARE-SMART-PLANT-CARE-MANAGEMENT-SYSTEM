# Project Overview — PlantCare

## 1. Introduction

**PlantCare – Smart Plant Care Management System** (*Grow Better, Care Smarter*) is an academic Computer Science & Engineering web application built to help home gardeners, students, and indoor plant owners maintain consistent, organised plant care routines without relying on proprietary IoT hardware or paid subscriptions.

## 2. Background & Motivation

Caring for multiple houseplants and balcony/garden plants involves overlapping intervals for watering, fertilising, pruning, repotting, and sunlight rotation. When managed mentally or with generic reminder apps:

- Overdue tasks blur together with future tasks.
- Recurring intervals drift or duplicate when tasks are completed late.
- Plant growth history is scattered across phone photo galleries without context.
- Beginners struggle to find sensible starting intervals for common plants like Tulsi, Aloe Vera, Money Plant, or Rose.

## 3. Objectives

- **Centralised Plant Inventory:** Maintain structured plant profiles (species, category, room/location, sunlight preference, watering/fertilising intervals, photographs, and notes).
- **Reliable Local-Date Scheduling:** Compute calendar views and recurring next due dates safely in local calendar time, accounting for month-end clamping and leap years.
- **Actionable Priority Engine:** Surface overdue tasks (`High`), today's tasks (`Medium`), and future tasks (`Normal`) sorted deterministically.
- **Visual Growth Logging:** Store user-uploaded growth photographs in IndexedDB and provide a chronological timeline plus side-by-side comparison.
- **Habit Reinforcement:** Encourage consistency via duplicate-proof points, streaks, and milestone badges.
- **Data Portability & Transparency:** Provide JSON backup export/import and clearly disclose local-only browser storage boundaries.

## 4. Scope & Non-Goals (Version 1.0)

### Included in Scope
- 9 functional modules: Dashboard, My Plants, Care Calendar, Reminders, Growth Diary, Recommendations, Rewards, Care Insights, and Settings.
- Dual client-side persistence (`localStorage` + `IndexedDB`).
- Optional sample data loader (5 plants + representative tasks) for live demonstrations.

### Explicitly Out of Scope
- Physical IoT moisture/light sensors.
- AI/ML image-based plant disease diagnosis.
- Cloud user authentication or multi-device cloud synchronisation.
- Paid external APIs.
