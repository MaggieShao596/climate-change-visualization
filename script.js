/* Climate Atlas — D3 v7. Replace demo data with your actual CSV files before submitting. */
const COLORS={"North America":"#8dd9c1","South America":"#f3b76b","Europe":"#91b8ff","Africa":"#df92ad","Asia":"#c4a3ff"};
const NAMES=Object.keys(COLORS);
const SOURCES={temperature:{historical:"data/temperature_historical.csv",future:"data/temperature_future.csv"},co2:{historical:"data/co2_historical.csv",future:"data/co2_future.csv"}};
const YEARS={historical:[1950,2014],future:[2020,2099]};
let state={metric:"temperature",period:"historical",focus:null,from:1950,to:2014};
let cache=new Map();let data=[];let demo=false;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const normalizeName=s=>{let n=String(s||"").trim().toLowerCase();return NAMES.find(x=>x.toLowerCase()===n)||null};
const numeric=v=>{if(v===null||v===undefined||String(v).trim()==="")return NaN;return +String(v).replace(/,/g,"")};
function normalize(rows){
  const out=[];
  for(const row of rows){
    const keys=Object.keys(row),get=(...aliases)=>{const k=keys.find(k=>aliases.includes(k.trim().toLowerCase().replace(/[\s_-]+/g,"")));return k?row[k]:undefined};
    const year=numeric(get("year","time"));
    const continent=normalizeName(get("continent","region","entity"));
    const value=numeric(get("value","anomaly","temperatureanomaly","tempanomaly","co2","co2emissions","emissions"));
    if(continent&&Number.isFinite(year)&&Number.isFinite(value))out.push({year,continent,value});
    // Also support wide CSV: year,Asia,Africa,Europe,North America,South America
    if(!continent&&Number.isFinite(year))for(const name of NAMES){const key=keys.find(k=>normalizeName(k)===name);if(key&&Number.isFinite(numeric(row[key])))out.push({year,continent:name,value:numeric(row[key])});}
  }
  return out.sort((a,b)=>a.year-b.year);
}
function makeDemo(metric,period){
  // Illustrative values only; not CMIP6 or observed emissions.
  const [start,end]=YEARS[period],result=[];
  const bases={"North America":.18,"South America":.1,"Europe":.14,"Africa":.12,"Asia":.17};
  const slopes={"North America":1.15,"South America":.85,"Europe":1.25,"Africa":1.05,"Asia":1.2};
  for(let year=start;year<=end;year++)for(let i=0;i<NAMES.length;i++){
    const continent=NAMES[i],t=(year-start)/(end-start),noise=Math.sin(year*.47+i*2.2)*.09+Math.sin(year*.16+i)*.06;
    let value;
    if(metric==="temperature")value=(period==="historical"?bases[continent]+slopes[continent]*t:1.15+slopes[continent]*3.4*t)+noise;
    else {const scale=[1.5,.65,1.2,.5,2.3][i];value=(period==="historical"?700+7000*t:8000+8000*t)*scale*(1+.05*Math.sin(year*.21+i));}
    result.push({year,continent,value});
  }
  return result;
}
async function load(){
  const key=`${state.metric}-${state.period}`;
  if(!cache.has(key)){
    let rows=[];let illustrative=false;
    try{const res=await fetch(SOURCES[state.metric][state.period],{cache:"no-store"});if(!res.ok)throw new Error(res.status);rows=normalize(d3.csvParse(await res.text()));if(!rows.length)throw new Error("No matching rows");}
    catch(e){illustrative=true;rows=makeDemo(state.metric,state.period);}
    cache.set(key,{rows,illustrative});
  }
  ({rows:data,illustrative:demo}=cache.get(key));
  const [min,max]=d3.extent(data,d=>d.year);state.from=min;state.to=max;state.focus=null;
  sync();render();
}
function sync(){
  $$('.tab').forEach(b=>{let active=b.dataset.metric===state.metric;b.classList.toggle('active',active);b.setAttribute('aria-selected',active)});
  $$('.period').forEach(b=>b.classList.toggle('active',b.dataset.period===state.period));
  const label=state.metric==='temperature'?'Temperature anomaly':'CO₂ emissions';
  const unit=state.metric==='temperature'?'°C':'Mt CO₂ / year';
  $('#metric-label').textContent=label;$('#metric-description').textContent=unit;
  $('#chart-title').textContent=label+' over time';
  $('#focus-label').textContent=state.focus||'All continents';
  $('#range-label').textContent=`${state.from}–${state.to}`;
  $('#data-status').textContent=demo?'⚠ ILLUSTRATIVE DEMO DATA':'● CSV DATA LOADED';
  $('#data-status').style.color=demo?'#f3cb8c':'#a9e8d0';
  $('#source-note').textContent=demo?'Illustrative demo data — NOT actual climate measurements':state.metric==='temperature'?'Source: CMIP6 · CESM2-WACCM (verify units and baseline)':'Source: supplied emissions CSV (verify provenance and units)';
  const [min,max]=d3.extent(data,d=>d.year);
  for(const id of ['from','to']){$('#'+id).min=min;$('#'+id).max=max;$('#'+id).value=state[id]}
  $('#from-label').textContent=state.from;$('#to-label').textContent=state.to;
  const span=max-min||1;$('#range-fill').style.left=`${(state.from-min)/span*100}%`;$('#range-fill').style.width=`${(state.to-state.from)/span*100}%`;
}
function render(){
  sync();
  const chart=$('#chart');chart.innerHTML='';
  const width=Math.max(330,chart.clientWidth),height=420;
  const m={top:20,right:24,bottom:54,left:68};
  const svg=d3.select(chart).append('svg').attr('viewBox',`0 0 ${width} ${height}`).attr('aria-label','Interactive line chart of climate data');
  const plot=data.filter(d=>d.year>=state.from&&d.year<=state.to);
  const x=d3.scaleLinear().domain([state.from,state.to]).range([m.left,width-m.right]);
  let ext=d3.extent(plot,d=>d.value);if(!Number.isFinite(ext[0]))ext=[0,1];
  const pad=Math.max(.05,(ext[1]-ext[0])*.15);
  const y=d3.scaleLinear().domain([Math.min(0,ext[0]-pad),ext[1]+pad]).nice().range([height-m.bottom,m.top]);
  svg.append('g').attr('class','grid').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-(width-m.left-m.right)).tickFormat(''));
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${height-m.bottom})`).call(d3.axisBottom(x).ticks(Math.min(8,state.to-state.from)).tickFormat(d3.format('d')));
  svg.append('g').attr('class','axis').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y).ticks(6));
  svg.append('text').attr('x',width/2).attr('y',height-7).attr('fill','#9db0c1').attr('text-anchor','middle').attr('font-size',12).text('Year');
  svg.append('text').attr('transform',`translate(17,${height/2}) rotate(-90)`).attr('fill','#9db0c1').attr('text-anchor','middle').attr('font-size',12).text(state.metric==='temperature'?'Temperature anomaly (°C)':'CO₂ emissions (Mt CO₂ / year)');
  const line=d3.line().defined(d=>Number.isFinite(d.value)).x(d=>x(d.year)).y(d=>y(d.value));
  for(const name of NAMES){
    const values=plot.filter(d=>d.continent===name);
    svg.append('path').datum(values).attr('class','series').attr('stroke',COLORS[name]).attr('d',line).attr('opacity',state.focus&&state.focus!==name?.13:1).attr('stroke-width',state.focus===name?4:3);
  }
  const focusLine=svg.append('line').attr('y1',m.top).attr('y2',height-m.bottom).attr('stroke','#e7f4ec').attr('stroke-dasharray','4 5').attr('opacity',0);
  const circles=svg.append('g');
  const overlay=svg.append('rect').attr('x',m.left).attr('y',m.top).attr('width',width-m.left-m.right).attr('height',height-m.top-m.bottom).attr('fill','transparent').style('cursor','crosshair');
  overlay.on('mousemove',function(event){
    const [px]=d3.pointer(event,this),year=Math.max(state.from,Math.min(state.to,Math.round(x.invert(px+m.left))));
    const selected=plot.filter(d=>d.year===year&&(!state.focus||d.continent===state.focus));
    focusLine.attr('x1',x(year)).attr('x2',x(year)).attr('opacity',1);
    circles.selectAll('circle').data(selected,d=>d.continent).join('circle').attr('cx',d=>x(d.year)).attr('cy',d=>y(d.value)).attr('r',5).attr('fill',d=>COLORS[d.continent]).attr('stroke','#101b29').attr('stroke-width',2);
    const html=`<strong>${year}</strong>`+selected.map(d=>`<div style="display:flex;justify-content:space-between;gap:20px;margin-top:4px"><span style="color:${COLORS[d.continent]};filter:brightness(.65)">●</span><span>${d.continent}</span><b>${d.value.toFixed(state.metric==='temperature'?2:0)} ${state.metric==='temperature'?'°C':'Mt'}</b></div>`).join('');
    const tip=$('#tooltip');tip.innerHTML=html;tip.classList.remove('hidden');tip.style.left=Math.min(event.clientX+18,window.innerWidth-260)+'px';tip.style.top=Math.max(10,event.clientY-30)+'px';
  }).on('mouseleave',()=>{focusLine.attr('opacity',0);circles.selectAll('*').remove();$('#tooltip').classList.add('hidden')});
  const legend=d3.select('#legend');legend.selectAll('*').remove();
  for(const name of NAMES){legend.append('button').attr('class',state.focus===name?'selected':'').html(`<span class="swatch" style="background:${COLORS[name]}"></span>${name}`).on('click',()=>{state.focus=state.focus===name?null:name;render()})}
}
$$('.tab').forEach(b=>b.addEventListener('click',()=>{state.metric=b.dataset.metric;load()}));
$$('.period').forEach(b=>b.addEventListener('click',()=>{state.period=b.dataset.period;load()}));
for(const id of ['from','to'])$('#'+id).addEventListener('input',e=>{const val=+e.target.value;if(id==='from')state.from=Math.min(val,state.to-1);else state.to=Math.max(val,state.from+1);render()});
$('#reset').addEventListener('click',()=>{const [a,b]=d3.extent(data,d=>d.year);state.from=a;state.to=b;state.focus=null;render()});
window.addEventListener('resize',()=>render());load();
