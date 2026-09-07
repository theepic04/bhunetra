<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# BhuNetra — Landslide Risk Monitoring System NER

AI-Based Early Warning and Landslide Risk Monitoring System for the North Eastern Region (NER), India.

## Features
- **Real-Time Landslide Risk Monitoring**: Multi-sensor and meteorological tracking across 8 NER states.
- **AI Terrain Analysis**: Multi-modal vision analysis powered by Gemini with fallback geotechnical heuristic engine.
- **Geotechnical Hazard Models**: Mohr-Coulomb Factor of Safety (FoS) calculations, rainfall accumulation metrics, and soil saturation profiling.
- **Interactive Geospatial Maps**: High-risk zones, infrastructure impact tracking, and safe evacuation corridors.
- **Citizen & Authority Portals**: Multi-tier alert broadcasting, bilingual interfaces, and live telemetry.

## Run Locally

**Prerequisites:** Node.js (v20+) and npm

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Copy `.env.example` to `.env` or set `GEMINI_API_KEY`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`.

