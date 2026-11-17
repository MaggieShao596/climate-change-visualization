// Climate explorer: one line chart of temperature anomaly by continent.
// The values below are ILLUSTRATIVE DEMO DATA, not CMIP6 results.

const CONTINENTS = [
  { name: "North America", color: "#4C8178", slope: 1.15, phase: 0.2 },
  { name: "South America", color: "#B39569", slope: 0.83, phase: 1.4 },
  { name: "Europe",        color: "#6E8DAA", slope: 1.25, phase: 2.7 },
  { name: "Africa",        color: "#B47F89", slope: 0.95, phase: 0.9 },
  { name: "Asia",          color: "#8C80A7", slope: 1.18, phase: 3.4 }
];

const PERIODS = {
  historical: { first: 1950, last: 2014, note: "Historical · 1950–2014" },
  future:     { first: 2020, last: 2099, note: "Future · 2020–2099 · SSP5-8.5" }
};

const BASELINE = { first: 1951, last: 1980 };
const DEMO_START = 1950;
const DEMO_END = 2099;

const LAYOUT = {
  maxHeight: 470,
  minHeight: 280,
  aspect: 0.45,
  labelBreakpoint: 640,
  labelGap: 15,
  tooltipWidth: 210
};

const chart = document.getElementById("chart");
const tooltip = document.getElementById("tooltip");

let state = {
  period: "historical",
  selected: null,
  start: PERIODS.historical.first,
  end: PERIODS.historical.last
};

function setState(changes) {
  state = { ...state, ...changes };
  render();
}

/* ---------- Demo data ---------- */

// One continuous demo series per continent (1950–2099), shifted so the
// 1951–1980 mean is 0 — the same anomaly baseline we plan to use for CMIP6.
function demoValue(continent, index, year) {
  const elapsed = year - DEMO_START;
  const trend = 0.00022 * elapsed * elapsed * continent.slope;
  const wave =
    Math.sin(elapsed * 0.28 + continent.phase) * 0.30 +
    Math.sin(elapsed * 0.09 + index) * 0.12;
  return trend + wave;
}

function buildDemoData() {
  const years = d3.range(DEMO_START, DEMO_END + 1);

  return CONTINENTS.flatMap((continent, index) => {
    const raw = years.map(year => ({
      year,
      continent: continent.name,
      value: demoValue(continent, index, year)
    }));
    const baseline = d3.mean(
      raw.filter(d => d.year >= BASELINE.first && d.year <= BASELINE.last),
      d => d.value
    );
    return raw.map(d => ({ ...d, value: d.value - baseline }));
  });
}

const DEMO_DATA = buildDemoData();

function colorOf(name) {
  return CONTINENTS.find(c => c.name === name).color;
}

/* ---------- Controls ---------- */

function setPressed(id, isOn) {
  const button = document.getElementById(id);
  button.classList.toggle("active", isOn);
  button.setAttribute("aria-pressed", String(isOn));
}

function updateControls() {
  setPressed("histBtn", state.period === "historical");
  setPressed("futureBtn", state.period === "future");

  document.getElementById("chartNote").textContent =
    PERIODS[state.period].note + " · Illustrative demo data";

  const { first, last } = PERIODS[state.period];
  const startInput = document.getElementById("startYear");
  const endInput = document.getElementById("endYear");

  startInput.min = first;
  startInput.max = last - 1;
  startInput.value = state.start;

  endInput.min = first + 1;
  endInput.max = last;
  endInput.value = state.end;

  document.getElementById("rangeLabel").textContent =
    state.start + " – " + state.end;
}

function drawLegend() {
  const legend = d3.select("#legend");

  legend.selectAll("button")
    .data(CONTINENTS, c => c.name)
    .join(enter => {
      const button = enter.append("button");
      button.append("span").attr("class", "dot").style("background", c => c.color);
      button.append("span").text(c => c.name);
      return button;
    })
    .classed("selected", c => state.selected === c.name)
    .attr("aria-pressed", c => String(state.selected === c.name))
    .style("opacity", c => (state.selected && state.selected !== c.name ? 0.4 : 1))
    .on("click", (event, c) => {
      setState({ selected: state.selected === c.name ? null : c.name });
    });
}

/* ---------- Chart pieces ---------- */

function chartSize() {
  const width = Math.max(chart.clientWidth, 280);
  const height = Math.round(
    Math.min(LAYOUT.maxHeight, Math.max(LAYOUT.minHeight, width * LAYOUT.aspect))
  );
  const showLabels = width >= LAYOUT.labelBreakpoint;
  const margin = {
    top: 20,
    right: showLabels ? 112 : 14,
    bottom: 40,
    left: width < LAYOUT.labelBreakpoint ? 52 : 62
  };
  return { width, height, margin, showLabels };
}

function makeScales(data, size) {
  const { width, height, margin } = size;
  const x = d3.scaleLinear()
    .domain([state.start, state.end])
    .range([margin.left, width - margin.right]);

  const [low, high] = d3.extent(data, d => d.value);
  const pad = Math.max((high - low) * 0.12, 0.25);
  const y = d3.scaleLinear()
    .domain([Math.min(low - pad, 0), high + pad])
    .nice()
    .range([height - margin.bottom, margin.top]);

  return { x, y };
}

function drawAxes(svg, scales, size) {
  const { width, height, margin } = size;
  const { x, y } = scales;
  const xTicks = Math.min(width < LAYOUT.labelBreakpoint ? 4 : 8, state.end - state.start);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(xTicks).tickFormat(d3.format("d")))
    .call(g => g.select(".domain").attr("stroke", "#bdcec5"));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line")
      .attr("stroke", "#e0eae4")
      .attr("stroke-dasharray", "4,6"));

  // Solid line at 0 = the 1951–1980 baseline.
  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", "#9fb5ab")
    .attr("stroke-width", 1.2);

  svg.append("text")
    .attr("class", "axis-title")
    .attr("transform", `translate(14,${(margin.top + height - margin.bottom) / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .text("Temperature anomaly vs. 1951–1980 (°C)");
}

function lineOpacity(name) {
  return state.selected && state.selected !== name ? 0.14 : 0.95;
}

function drawLines(svg, seriesList, scales) {
  const line = d3.line()
    .x(d => scales.x(d.year))
    .y(d => scales.y(d.value))
    .curve(d3.curveMonotoneX);

  svg.append("g")
    .selectAll("path")
    .data(seriesList)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", s => colorOf(s.name))
    .attr("stroke-width", s => (state.selected === s.name ? 5 : 3.3))
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("opacity", s => lineOpacity(s.name))
    .attr("d", s => line(s.values));
}

// Spread end-of-line labels apart so they never overlap.
function dodgeLabels(labels, gap) {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  return sorted.reduce((placed, label) => {
    const prev = placed[placed.length - 1];
    const y = prev ? Math.max(label.y, prev.y + gap) : label.y;
    return [...placed, { ...label, y }];
  }, []);
}

function drawLineLabels(svg, seriesList, scales, size) {
  const raw = seriesList.map(s => {
    const last = s.values[s.values.length - 1];
    return { name: s.name, y: scales.y(last.value) };
  });

  svg.append("g")
    .selectAll("text")
    .data(dodgeLabels(raw, LAYOUT.labelGap))
    .join("text")
    .attr("class", "line-label")
    .attr("x", size.width - size.margin.right + 8)
    .attr("y", d => d.y)
    .attr("dy", "0.35em")
    .attr("fill", d => colorOf(d.name))
    .attr("opacity", d => lineOpacity(d.name))
    .text(d => d.name);
}

/* ---------- Hover / touch ---------- */

function tooltipHtml(year, values) {
  const rows = [...values]
    .sort((a, b) => b.value - a.value)
    .map(d =>
      `<div class="tooltip-row"><span><span class="dot" style="background:${colorOf(d.continent)}"></span>` +
      `${d.continent}</span><span>${d.value >= 0 ? "+" : ""}${d.value.toFixed(2)} °C</span></div>`
    )
    .join("");
  return `<strong>${year}</strong>${rows}`;
}

function placeTooltip(event) {
  const bounds = chart.getBoundingClientRect();
  const left = Math.min(event.clientX - bounds.left + 14, bounds.width - LAYOUT.tooltipWidth);
  tooltip.style.left = Math.max(0, left) + "px";
  tooltip.style.top = Math.max(0, event.clientY - bounds.top - 70) + "px";
}

function addHover(svg, data, scales, size) {
  const { height, margin, width } = size;
  const { x, y } = scales;

  const guide = svg.append("line")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#a0b9ae")
    .attr("stroke-dasharray", "4,5")
    .style("display", "none");

  const points = svg.append("g");

  const show = function(event) {
    // d3.pointer already returns SVG coordinates — no margin offset needed.
    const [px] = d3.pointer(event, this);
    const year = Math.max(state.start, Math.min(state.end, Math.round(x.invert(px))));
    const values = data.filter(d =>
      d.year === year && (!state.selected || d.continent === state.selected)
    );

    guide.attr("x1", x(year)).attr("x2", x(year)).style("display", null);

    points.selectAll("circle")
      .data(values, d => d.continent)
      .join("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.value))
      .attr("r", 5)
      .attr("fill", d => colorOf(d.continent))
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    tooltip.innerHTML = tooltipHtml(year, values);
    tooltip.style.opacity = "1";
    placeTooltip(event);
  };

  hideHover = () => {
    tooltip.style.opacity = "0";
    guide.style("display", "none");
    points.selectAll("*").remove();
  };

  svg.append("rect")
    .attr("class", "hover-surface")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "transparent")
    .on("pointermove pointerdown", show)
    .on("pointerleave", event => {
      // On touch screens keep the tooltip after the finger lifts;
      // it closes when the user taps outside the chart.
      if (event.pointerType !== "touch") hideHover();
    });
}

let hideHover = () => {};

document.addEventListener("pointerdown", event => {
  if (!chart.contains(event.target)) hideHover();
});

/* ---------- Render ---------- */

function render() {
  updateControls();
  drawLegend();

  hideHover();
  d3.select(chart).select("svg").remove();

  const size = chartSize();
  const data = DEMO_DATA.filter(d => d.year >= state.start && d.year <= state.end);
  const seriesList = CONTINENTS.map(c => ({
    name: c.name,
    values: data.filter(d => d.continent === c.name)
  }));
  const scales = makeScales(data, size);

  const svg = d3.select(chart)
    .insert("svg", ":first-child")
    .attr("width", size.width)
    .attr("height", size.height)
    .attr("viewBox", `0 0 ${size.width} ${size.height}`)
    .attr("role", "img")
    .attr("aria-label", "Line chart of illustrative temperature anomalies by continent");

  drawAxes(svg, scales, size);
  drawLines(svg, seriesList, scales);
  if (size.showLabels) {
    drawLineLabels(svg, seriesList, scales, size);
  }
  addHover(svg, data, scales, size);
}

/* ---------- Events ---------- */

function switchPeriod(next) {
  const { first, last } = PERIODS[next];
  setState({ period: next, start: first, end: last, selected: null });
}

document.getElementById("histBtn").onclick = () => switchPeriod("historical");
document.getElementById("futureBtn").onclick = () => switchPeriod("future");

document.getElementById("startYear").oninput = function() {
  setState({ start: Math.min(Number(this.value), state.end - 1) });
};

document.getElementById("endYear").oninput = function() {
  setState({ end: Math.max(Number(this.value), state.start + 1) });
};

let resizeFrame = null;
new ResizeObserver(() => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(render);
}).observe(chart);

render();
