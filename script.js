// Prototype values: verify these numbers against your team's original proposal.
// Temperature change in degrees Celsius (historical comparison).
const data = [
  {continent:'Europe', warming:1.69},
  {continent:'North America', warming:1.57},
  {continent:'Asia', warming:0.95},
  {continent:'Africa', warming:0.88},
  {continent:'South America', warming:0.62}
];
const select = document.querySelector('#continent-select');
const description = document.querySelector('#chart-description');
const tooltip = document.querySelector('#tooltip');
const margin = {top:15,right:72,bottom:43,left:135};
const width=930,height=360;
const innerWidth=width-margin.left-margin.right;
const innerHeight=height-margin.top-margin.bottom;
const svg=d3.select('#chart').append('svg').attr('viewBox',`0 0 ${width} ${height}`);
const plot=svg.append('g').attr('transform',`translate(${margin.left},${margin.top})`);
const x=d3.scaleLinear().domain([0,2]).range([0,innerWidth]);
const y=d3.scaleBand().domain(data.map(d=>d.continent)).range([0,innerHeight]).padding(.25);
plot.append('g').attr('class','axis').attr('transform',`translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>`${d}°C`));
plot.append('g').attr('class','axis').call(d3.axisLeft(y).tickSize(0)).selectAll('text').attr('dx','-.65em');
plot.selectAll('.grid').data(x.ticks(5)).join('line').attr('x1',d=>x(d)).attr('x2',d=>x(d)).attr('y1',0).attr('y2',innerHeight).attr('stroke','#e9eff1');
const bars=plot.selectAll('.bar').data(data).join('rect').attr('class','bar')
  .attr('x',0).attr('y',d=>y(d.continent)).attr('height',y.bandwidth())
  .attr('width',d=>x(d.warming)).attr('rx',5)
  .on('mousemove',(event,d)=>{
    tooltip.hidden=false;
    tooltip.textContent=`${d.continent}: +${d.warming.toFixed(2)}°C historical warming`;
    tooltip.style.left=`${Math.min(event.clientX+14,window.innerWidth-270)}px`;
    tooltip.style.top=`${Math.max(10,event.clientY-55)}px`;
  })
  .on('mouseleave',()=>{tooltip.hidden=true;})
  .on('click',(_,d)=>{select.value=d.continent;update();});
plot.selectAll('.value-label').data(data).join('text').attr('class','value-label')
  .attr('x',d=>x(d.warming)+9).attr('y',d=>y(d.continent)+y.bandwidth()/2+5)
  .text(d=>`+${d.warming.toFixed(2)}°C`);
function update(){
  const selected=select.value;
  bars.attr('fill',d=>selected==='All'||selected===d.continent?'#168a99':'#b9d1d7')
    .attr('opacity',d=>selected==='All'||selected===d.continent?1:.55);
  if(selected==='All'){
    description.textContent='Europe shows the largest warming in this prototype comparison. Choose a continent to focus on its result.';
  }else{
    const item=data.find(d=>d.continent===selected);
    description.textContent=`${item.continent} shows +${item.warming.toFixed(2)}°C of modeled historical warming in the prototype comparison.`;
  }
}
select.addEventListener('change',update);
update();
