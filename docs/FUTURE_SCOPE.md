# Future Scope — PlantCare

While Version 1.0 of PlantCare intentionally focuses on reliable, hardware-free, local-first plant care management, the modular architecture provides clear extension paths for future iterations:

1. **Progressive Web App (PWA) & Service Worker Caching:**
   Add an audited Service Worker (`sw.js`) and Web App Manifest for installable mobile/desktop usage and full offline asset caching.
2. **Optional Cloud Synchronisation & Multi-Device Backup:**
   Integrate opt-in encrypted cloud backup or user accounts so gardeners can synchronise schedules and growth photos across phone and laptop.
3. **Seasonal & Local Weather Integration:**
   Adjust suggested watering intervals dynamically using open meteorological forecasts (e.g., delaying outdoor watering ahead of rain or shortening intervals during heatwaves).
4. **Expanded Botanical Knowledge Base:**
   Grow the rule-based plant care dataset with regional Indian/global ornamentals, vegetables, fruit trees, and seasonal pruning calendars.
5. **Optional IoT Sensor Telemetry Adapter:**
   Introduce an optional MQTT/HTTP adapter module for hobbyist ESP32/soil-moisture sensors without making hardware mandatory.
6. **Multi-Language Localisation (i18n):**
   Externalise UI strings to support regional languages for broader home-gardener accessibility.
