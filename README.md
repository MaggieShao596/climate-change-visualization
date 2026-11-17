# Climate Atlas — DSC 106 Final Project

A polished, single-large-visualization D3.js website with hover tooltips, clickable continent highlighting, dual-handle year filtering, historical/future switch, and temperature/CO₂ toggle.

## IMPORTANT: DATA
The ZIP intentionally **does not include actual CMIP6 or CO₂ data**, because no source CSV was provided. The site works immediately using **clearly marked illustrative demo values** so you can test the interactions. **Do not submit the demo values as research results.**

To use your real datasets, create a `data` folder and add:

- `data/temperature_historical.csv` (1950–2014)
- `data/temperature_future.csv` (2020–2099, SSP5-8.5)
- `data/co2_historical.csv` (optional)
- `data/co2_future.csv` (optional; only if you have a genuine projection dataset and its scenario matches)

Each CSV can be in long format:

```csv
year,continent,value
1950,Asia,0.12
1950,Africa,0.09
1951,Asia,0.18
```

or wide format:

```csv
year,Asia,Africa,Europe,North America,South America
1950,0.12,0.09,0.14,0.13,0.10
```

Continents: North America, South America, Europe, Africa, Asia.

**Units:** Temperature CSV values must be temperature anomalies in °C relative to a clearly specified baseline. CO₂ CSV values must be in **million metric tons CO₂ per year (Mt CO₂/year)**. If your emissions data is in tons, Gt, or per-capita values, convert it first and document the source. The current research proposal uses CMIP6 CESM2-WACCM historical and future temperatures, **not a CO₂ emissions dataset**. SSP5-8.5 is an emissions scenario, not an observed emissions series.

If a CSV is missing or cannot be parsed, the app visibly labels that view `ILLUSTRATIVE DEMO DATA`. Verify that it says `CSV DATA LOADED` for any view you plan to submit as evidence.

## Deploy to GitHub Pages
1. Upload `index.html`, `style.css`, `script.js`, and your `data/` folder to the root of your `climate-change-visualization` repository.
2. Repository → Settings → Pages → Deploy from branch → `main` → `/(root)` → Save.
3. Visit `https://maggieshao596.github.io/climate-change-visualization/` after deployment.
4. Check that the data badge says `CSV DATA LOADED` and verify tooltip values against the original data.

To test locally, run `python3 -m http.server 8000` in this directory, then open `http://localhost:8000`.

## Academic notes
- The historical and future charts are **model output**, not direct observations.
- The future scenario is **SSP5-8.5**, not a certainty or an emissions-vs-temperature causal test.
- Do not mix CO₂ series from an unrelated scenario without labeling them.
- Keep a data provenance paragraph on your final project page.
