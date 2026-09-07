# BhuNetra Landslide Risk Machine Learning Model

## Overview
This module contains the machine learning inference engine and geotechnical models calibrated for the North Eastern Region (NER) of India, covering Assam, Meghalaya, Sikkim, Arunachal Pradesh, Mizoram, Nagaland, Manipur, and Tripura.

## Architecture
1. **Inference Pipeline (`mlEngine.ts`)**:
   - Geotechnical Factor of Safety (FoS) estimation using Mohr-Coulomb failure criteria.
   - Multivariable hazard scoring based on rainfall accumulation, slope angles, soil pore saturation, and drainage toe erosion.
   - Dynamic explanation generator producing top contributing risk factors and actionable mitigations.

2. **External ML Microservice Client (`mlClient.ts`)**:
   - Interfaces with remote high-resolution DEM (Digital Elevation Model) grid services (`https://bhunetr.onrender.com`).
   - Supports 3x3 local mesh elevation and slope extraction.
   - Automatically falls back to internal physics-based ML calculations if network latency or service degradation occurs.

3. **Calibrated Parameters (`modelParameters.ts`)**:
   - NER Himalayan lithology modifiers (e.g. shale, clay, phyllite vs. gneiss/granite).
   - IMD rainfall categorization thresholds (Heavy >= 64.5mm, Very Heavy >= 115.5mm).
   - Factor of Safety boundaries (<1.0 imminent failure, 1.0–1.25 unstable, >1.3 stable).
