# Climate Change: Regional Temperature Trends and Future Projections

DSC 106 final project by **Data Dumplings**: Jacey Chow, Weder Qin, Jingyun Xiong, Maggie Shao.

Live site: https://maggieshao596.github.io/climate-change-visualization/

## Research question

How have temperature trends varied across world regions, and which regions are projected to experience the greatest warming in the future?

## Current status (prototype)

The site has one interactive D3 line chart comparing five continents (North America, South America, Europe, Africa, Asia):

- Hover (or tap) the chart to see each continent's value for a year
- Click a continent in the legend to highlight it
- Switch between the historical (1950–2014) and future (2020–2099, SSP5-8.5) views
- Use the sliders to narrow the year range

**The chart currently shows illustrative demo values, not CMIP6 results.** The demo curves are generated in `script.js` and shifted so their 1951–1980 mean is 0, matching the baseline we plan to use.

## Planned data

- **Model:** CMIP6, CESM2-WACCM
- **Variable:** near-surface air temperature (`tas`)
- **Experiments:** `historical` (1950–2014) and `ssp585` (2020–2099)
- **Anomaly baseline:** 1951–1980, computed separately for each continent
- **Source:** [NOAA Public CMIP6 Dataset on Google Cloud](https://console.cloud.google.com/marketplace/product/noaa-public/cmip6)

Results will come from a single high-sensitivity model under a high-emissions scenario, so they sit at the upper end of CMIP6 projections and are not predictions.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and text |
| `style.css` | Styles |
| `script.js` | Demo data, chart, and interactions (D3 v7) |

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
