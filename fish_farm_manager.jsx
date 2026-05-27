import { useState, useEffect, useRef } from "react";

/* ─── CONSTANTS ─────────────────────────────────────────────── */
const SPECIES_DATA = {
  catfish: { name:"Catfish", feedRates:{fingerling:6,juvenile:4,growout:2.5,preharvest:1.5}, idealFCR:1.5, harvestWeightG:900, pricePerKg:12 },
  tilapia: { name:"Tilapia", feedRates:{fingerling:7,juvenile:4.5,growout:3,preharvest:1.5}, idealFCR:1.6, harvestWeightG:600, pricePerKg:10 },
  salmon:  { name:"Salmon",  feedRates:{fingerling:5,juvenile:3.5,growout:2,preharvest:1},   idealFCR:1.2, harvestWeightG:4000,pricePerKg:45 },
  carp:    { name:"Carp",    feedRates:{fingerling:6,juvenile:4,growout:2.5,preharvest:1.5}, idealFCR:1.7, harvestWeightG:800, pricePerKg:8 },
};
const STAGES = ["fingerling","juvenile","growout","preharvest"];
const STAGE_LABELS = {fingerling:"Fingerling",juvenile:"Juvenile",growout:"Grow-out",preharvest:"Pre-harvest"};
const STAGE_TASKS = {
  fingerling:["Check water temperature (26–30°C)","Feed 3× daily (starter pellets 0.5–1mm)","Monitor dissolved oxygen >5 mg/L","Check for disease signs daily","Maintain stocking density <200/m³","Remove dead fish immediately"],
  juvenile:  ["Feed 3× daily (grower pellets 2mm)","Weekly weight sampling (10 fish/pond)","Monitor pH (6.5–8.5)","Check ammonia levels weekly","Water exchange 20–30% weekly","Record growth data"],
  growout:   ["Feed 2–3× daily (finisher pellets 4–6mm)","Bi-weekly weight sampling","Monitor water quality parameters","Check for overcrowding signs","Adjust feed based on appetite & FCR","Inspect nets/pond walls"],
  preharvest:["Reduce feeding rate gradually","Stop feeding 24–48 h before harvest","Prepare harvest equipment & ice","Grade fish by size","Plan transport & market logistics","Record final biomass estimate"],
};
const WATER_PARAMS = [
  {key:"temperature",label:"Temperature (°C)",min:22,max:30,unit:"°C"},
  {key:"ph",label:"pH",min:6.5,max:8.5,unit:""},
  {key:"oxygen",label:"Dissolved O₂ (mg/L)",min:5,max:9,unit:"mg/L"},
  {key:"ammonia",label:"Ammonia (mg/L)",min:0,max:0.5,unit:"mg/L"},
  {key:"turbidity",label:"Turbidity (NTU)",min:0,max:40,unit:"NTU"},
];
const ACTIVITY_TYPES = ["Feeding","Water Change","Sampling","Medication","Stocking","Harvest","Maintenance","Observation","Grading","Fertilization"];
const EXPENSE_CATS = ["Feed","Labour","Medication","Equipment","Utilities","Transport","Other"];

const DEFAULT_PONDS = [
  {id:"p1",name:"Pond A",species:"catfish",stage:"growout",population:500,avgWeight:350,area:100,volume:50,stocked:daysAgo(60),status:"active",stockingCost:500},
  {id:"p2",name:"Pond B",species:"tilapia",stage:"juvenile",population:800,avgWeight:80,area:80,volume:40,stocked:daysAgo(30),status:"active",stockingCost:320},
];
const DEFAULT_FEED_STOCK = [{id:"fs1",brand:"AquaFeed Pro",type:"Grower",quantityKg:200,costPerKg:2.5,dateAdded:todayStr()}];
const DEFAULT_EXPENSES = [
  {id:"e1",pondId:"p1",category:"Feed",amount:500,date:daysAgo(55),note:"Initial feed purchase"},
  {id:"e2",pondId:"p1",category:"Labour",amount:200,date:daysAgo(30),note:"Monthly labour"},
  {id:"e3",pondId:"p2",category:"Feed",amount:320,date:daysAgo(25),note:"Grower pellets"},
  {id:"e4",pondId:"p2",category:"Medication",amount:80,date:daysAgo(10),note:"Vitamin supplement"},
];
const DEFAULT_WATER = [
  {id:"w1",pondId:"p1",date:daysAgo(6),temperature:27,ph:7.2,oxygen:6.5,ammonia:0.1,turbidity:18},
  {id:"w2",pondId:"p1",date:daysAgo(3),temperature:28,ph:7.0,oxygen:6.8,ammonia:0.15,turbidity:22},
  {id:"w3",pondId:"p1",date:todayStr(),temperature:29,ph:6.9,oxygen:5.8,ammonia:0.3,turbidity:35},
  {id:"w4",pondId:"p2",date:daysAgo(5),temperature:26,ph:7.5,oxygen:7.0,ammonia:0.05,turbidity:12},
  {id:"w5",pondId:"p2",date:todayStr(),temperature:27,ph:7.3,oxygen:6.9,ammonia:0.08,turbidity:15},
];
const DEFAULT_ACTIVITIES = [
  {id:"a1",pondId:"p1",type:"Feeding",quantity:8.75,unit:"kg",date:daysAgo(2),status:"done",note:"Morning feed"},
  {id:"a2",pondId:"p1",type:"Sampling",quantity:10,unit:"pcs",date:daysAgo(7),status:"done",note:"Avg weight 340g"},
  {id:"a3",pondId:"p1",type:"Water Change",quantity:30,unit:"%",date:daysAgo(5),status:"done",note:""},
  {id:"a4",pondId:"p2",type:"Feeding",quantity:3.84,unit:"kg",date:daysAgo(1),status:"done",note:""},
  {id:"a5",pondId:"p2",type:"Medication",quantity:2,unit:"L",date:daysAgo(10),status:"done",note:"Vitamin C dosing"},
];
const DEFAULT_GROWTH = {
  p1:[{date:daysAgo(60),weight:12},{date:daysAgo(45),weight:80},{date:daysAgo(30),weight:180},{date:daysAgo(14),weight:280},{date:todayStr(),weight:350}],
  p2:[{date:daysAgo(30),weight:12},{date:daysAgo(14),weight:45},{date:todayStr(),weight:80}],
};

function daysAgo(n){return new Date(Date.now()-n*86400000).toISOString().split("T")[0];}
function todayStr(){return new Date().toISOString().split("T")[0];}
function uid(){return Math.random().toString(36).slice(2,9);}

/* ─── COLORS ─────────────────────────────────────────────────── */
const C = {
  green:"#16a34a",yellow:"#d97706",red:"#dc2626",teal:"#0d9488",blue:"#2563eb",purple:"#7c3aed",muted:"#6b7280",
  bg:"var(--color-background-primary)",bgSec:"var(--color-background-secondary)",
  border:"var(--color-border-tertiary)",borderSec:"var(--color-border-secondary)",
  text:"var(--color-text-primary)",textSec:"var(--color-text-secondary)",
};

/* ─── HELPERS ────────────────────────────────────────────────── */
function getStatus(val,min,max){
  const m=(max-min)*0.2;
  if(val<min-m||val>max+m)return"red";
  if(val<min||val>max)return"yellow";
  return"green";
}
function calcDailyFeed(p){
  if(!p)return 0;
  const sp=SPECIES_DATA[p.species]||SPECIES_DATA.catfish;
  const rate=sp.feedRates[p.stage]||3;
  return((p.avgWeight*p.population)/1000)*(rate/100);
}
function calcBiomass(p){return(p.avgWeight*p.population)/1000;}
function calcEstRevenue(p){
  const sp=SPECIES_DATA[p.species]||SPECIES_DATA.catfish;
  return(calcBiomass(p)*sp.pricePerKg);
}

/* ─── UI ATOMS ───────────────────────────────────────────────── */
function Badge({color="blue",children}){
  const maps={green:["#dcfce7","#166534"],yellow:["#fef9c3","#92400e"],red:["#fee2e2","#991b1b"],blue:["#dbeafe","#1e40af"],purple:["#ede9fe","#5b21b6"],gray:["#f3f4f6","#374151"]};
  const [bg,tc]=maps[color]||maps.blue;
  return <span style={{background:bg,color:tc,fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{children}</span>;
}
function Card({children,style={}}){
  return <div style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"1rem 1.25rem",...style}}>{children}</div>;
}
function MetricCard({label,value,unit="",color,icon,sub}){
  return(
    <div style={{background:C.bgSec,borderRadius:8,padding:"0.75rem 1rem"}}>
      <div style={{fontSize:12,color:C.textSec,marginBottom:4,display:"flex",alignItems:"center",gap:5}}>
        {icon&&<i className={`ti ${icon}`} style={{fontSize:14}} aria-hidden/>}{label}
      </div>
      <div style={{fontSize:22,fontWeight:500,color:color||C.text}}>
        {value}<span style={{fontSize:13,fontWeight:400,marginLeft:3,color:C.textSec}}>{unit}</span>
      </div>
      {sub&&<div style={{fontSize:11,color:C.textSec,marginTop:2}}>{sub}</div>}
    </div>
  );
}
function SectionHead({icon,title,action}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
      <div style={{fontSize:14,fontWeight:500,display:"flex",alignItems:"center",gap:6}}>
        {icon&&<i className={`ti ${icon}`} style={{fontSize:16,color:C.teal}} aria-hidden/>}{title}
      </div>
      {action}
    </div>
  );
}
function Btn({onClick,children,variant="outline",color}){
  const styles={
    primary:{background:"#ccfbf1",color:"#0f766e",border:`0.5px solid ${C.teal}`},
    outline:{background:C.bgSec,color:C.textSec,border:`0.5px solid ${C.border}`},
    danger: {background:"#fee2e2",color:"#991b1b",border:"0.5px solid #fca5a5"},
  };
  return(
    <button onClick={onClick} style={{padding:"7px 14px",fontSize:13,borderRadius:8,cursor:"pointer",...(styles[variant]||styles.outline)}}>
      {children}
    </button>
  );
}
function ProgressBar({pct,color}){
  return(
    <div style={{height:6,background:C.bgSec,borderRadius:3,overflow:"hidden"}}>
      <div style={{width:`${Math.min(100,Math.max(0,pct))}%`,height:"100%",background:color||C.teal,borderRadius:3,transition:"width .4s"}}/>
    </div>
  );
}
function Modal({title,onClose,children,wide}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"1rem"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.bg,borderRadius:14,padding:"1.25rem",width:"100%",maxWidth:wide?620:480,maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <div style={{fontSize:15,fontWeight:500}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.textSec,fontSize:18}}><i className="ti ti-x" aria-hidden/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function FormRow({label,children,span}){
  return(
    <label style={{display:"flex",flexDirection:"column",gap:4,fontSize:12,color:C.textSec,gridColumn:span?"span 2":undefined}}>
      {label}{children}
    </label>
  );
}
function Sel({value,onChange,options}){
  return(
    <select value={value} onChange={e=>onChange(e.target.value)} style={{fontSize:13}}>
      {options.map(([v,l])=><option key={v} value={v}>{l}</option>)}
    </select>
  );
}

/* ─── TABS ───────────────────────────────────────────────────── */
function Tabs({tabs,active,onChange}){
  return(
    <div style={{display:"flex",gap:2,background:C.bgSec,borderRadius:8,padding:3,marginBottom:"1.5rem",flexWrap:"wrap"}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)} style={{
          padding:"7px 13px",fontSize:12,fontWeight:active===t.id?500:400,border:"none",borderRadius:6,cursor:"pointer",
          background:active===t.id?C.bg:"transparent",color:active===t.id?C.text:C.textSec,transition:"all .15s",
        }}>
          {t.icon&&<i className={`ti ${t.icon}`} style={{fontSize:13,marginRight:4,verticalAlign:-2}} aria-hidden/>}{t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── MINI SPARKLINE (SVG) ───────────────────────────────────── */
function Sparkline({data,color="#0d9488",width=120,height=36}){
  if(!data||data.length<2)return null;
  const vals=data.map(d=>d.y);
  const mn=Math.min(...vals),mx=Math.max(...vals);
  const range=mx-mn||1;
  const pts=data.map((d,i)=>{
    const x=(i/(data.length-1))*width;
    const y=height-((d.y-mn)/range)*(height-4)-2;
    return`${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return(
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d,i)=>{
        const x=(i/(data.length-1))*width;
        const y=height-((d.y-mn)/range)*(height-4)-2;
        return i===data.length-1?<circle key={i} cx={x} cy={y} r="3" fill={color}/>:null;
      })}
    </svg>
  );
}

/* ─── CHART (Canvas bar/line via Chart.js) ───────────────────── */
function BarChart({labels,datasets,height=220}){
  const ref=useRef();
  const chartRef=useRef();
  useEffect(()=>{
    if(!ref.current||!window.Chart)return;
    if(chartRef.current)chartRef.current.destroy();
    chartRef.current=new window.Chart(ref.current,{
      type:"bar",
      data:{labels,datasets:datasets.map(d=>({...d,borderRadius:4,borderSkipped:false}))},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:datasets.length>1,position:"top",labels:{boxWidth:10,font:{size:11}}}},scales:{x:{grid:{display:false},ticks:{font:{size:11}}},y:{grid:{color:"rgba(0,0,0,0.04)"},ticks:{font:{size:11}}}}},
    });
    return()=>chartRef.current?.destroy();
  },[labels,datasets]);
  return <div style={{position:"relative",height}}><canvas ref={ref} role="img" aria-label="Bar chart"/></div>;
}
function LineChart({labels,datasets,height=200}){
  const ref=useRef();
  const chartRef=useRef();
  useEffect(()=>{
    if(!ref.current||!window.Chart)return;
    if(chartRef.current)chartRef.current.destroy();
    chartRef.current=new window.Chart(ref.current,{
      type:"line",
      data:{labels,datasets:datasets.map(d=>({tension:0.4,pointRadius:3,...d}))},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:datasets.length>1,position:"top",labels:{boxWidth:10,font:{size:11}}}},scales:{x:{grid:{display:false},ticks:{font:{size:11}}},y:{grid:{color:"rgba(0,0,0,0.04)"},ticks:{font:{size:11}}}}},
    });
    return()=>chartRef.current?.destroy();
  },[labels,datasets]);
  return <div style={{position:"relative",height}}><canvas ref={ref} role="img" aria-label="Line chart"/></div>;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════ */
export default function FishFarm(){
  const [tab,setTab]=useState("dashboard");
  const [ponds,setPonds]=useState(DEFAULT_PONDS);
  const [activities,setActivities]=useState(DEFAULT_ACTIVITIES);
  const [waterLogs,setWaterLogs]=useState(DEFAULT_WATER);
  const [feedStock,setFeedStock]=useState(DEFAULT_FEED_STOCK);
  const [expenses,setExpenses]=useState(DEFAULT_EXPENSES);
  const [growthLogs,setGrowthLogs]=useState(DEFAULT_GROWTH);
  const [selectedPond,setSelectedPond]=useState("p1");
  const [modal,setModal]=useState(null);

  // persist
  useEffect(()=>{
    try{const s=localStorage.getItem("ff2");if(s){const d=JSON.parse(s);setPonds(d.ponds||DEFAULT_PONDS);setActivities(d.activities||DEFAULT_ACTIVITIES);setWaterLogs(d.waterLogs||DEFAULT_WATER);setFeedStock(d.feedStock||DEFAULT_FEED_STOCK);setExpenses(d.expenses||DEFAULT_EXPENSES);setGrowthLogs(d.growthLogs||DEFAULT_GROWTH);}}catch{}
  },[]);
  useEffect(()=>{
    try{localStorage.setItem("ff2",JSON.stringify({ponds,activities,waterLogs,feedStock,expenses,growthLogs}));}catch{}
  },[ponds,activities,waterLogs,feedStock,expenses,growthLogs]);

  const pond=ponds.find(p=>p.id===selectedPond)||ponds[0];
  const totalFeedKg=feedStock.reduce((s,f)=>s+f.quantityKg,0);
  const totalDailyFeed=ponds.filter(p=>p.status==="active").reduce((s,p)=>s+calcDailyFeed(p),0);
  const daysLeft=Math.floor(totalFeedKg/Math.max(0.1,totalDailyFeed));

  const TABS=[
    {id:"dashboard",label:"Dashboard",icon:"ti-layout-dashboard"},
    {id:"ponds",label:"Ponds",icon:"ti-ripple"},
    {id:"activities",label:"Activities",icon:"ti-clipboard-list"},
    {id:"water",label:"Water Quality",icon:"ti-droplet"},
    {id:"feed",label:"Feed",icon:"ti-grain"},
    {id:"analytics",label:"Analytics",icon:"ti-chart-bar"},
    {id:"finance",label:"Finance",icon:"ti-currency-dollar"},
    {id:"health",label:"Health",icon:"ti-stethoscope"},
  ];

  const close=()=>setModal(null);
  const addPond=p=>setPonds(ps=>[...ps,{...p,id:uid()}]);
  const editPond=p=>setPonds(ps=>ps.map(x=>x.id===p.id?p:x));
  const addActivity=a=>setActivities(as=>[{...a,id:uid()},...as]);
  const addWater=w=>setWaterLogs(wl=>[{...w,id:uid()},...wl]);
  const addFeedStock=f=>setFeedStock(fs=>[...fs,{...f,id:uid()}]);
  const addExpense=e=>setExpenses(es=>[{...e,id:uid()},...es]);
  const addGrowth=(pid,g)=>setGrowthLogs(gl=>({...gl,[pid]:[...(gl[pid]||[]),{...g,id:uid()}].sort((a,b)=>a.date.localeCompare(b.date))}));

  return(
    <>
      {/* Chart.js CDN */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" async/>
      <div style={{fontFamily:"var(--font-sans)",color:C.text,maxWidth:880,margin:"0 auto",padding:"1.5rem 1rem"}}>
        <h2 className="sr-only">Fish Farm Management System</h2>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.25rem",flexWrap:"wrap",gap:10}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:500,margin:0,display:"flex",alignItems:"center",gap:8}}>
              <i className="ti ti-fish" style={{fontSize:20,color:C.teal}} aria-hidden/>AquaManager
            </h1>
            <p style={{fontSize:12,color:C.textSec,margin:"3px 0 0"}}>{new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {ponds.map(p=>(
              <button key={p.id} onClick={()=>setSelectedPond(p.id)} style={{
                padding:"5px 12px",fontSize:12,border:`0.5px solid ${selectedPond===p.id?C.teal:C.border}`,
                borderRadius:8,background:selectedPond===p.id?"#ccfbf1":C.bgSec,
                color:selectedPond===p.id?"#0f766e":C.textSec,cursor:"pointer",
              }}>{p.name}</button>
            ))}
            <Btn onClick={()=>setModal("addPond")} variant="outline"><i className="ti ti-plus" style={{fontSize:13}} aria-hidden/></Btn>
          </div>
        </div>

        <Tabs tabs={TABS} active={tab} onChange={setTab}/>

        {/* ── DASHBOARD ─────────────────────────────────────── */}
        {tab==="dashboard"&&<Dashboard pond={pond} ponds={ponds} activities={activities} waterLogs={waterLogs} feedStock={feedStock} totalFeedKg={totalFeedKg} totalDailyFeed={totalDailyFeed} daysLeft={daysLeft} expenses={expenses} setModal={setModal}/>}

        {/* ── PONDS ─────────────────────────────────────────── */}
        {tab==="ponds"&&<PondsTab ponds={ponds} selectedPond={selectedPond} setModal={setModal} setPonds={setPonds}/>}

        {/* ── ACTIVITIES ────────────────────────────────────── */}
        {tab==="activities"&&<ActivitiesTab pond={pond} ponds={ponds} activities={activities} setActivities={setActivities} setModal={setModal}/>}

        {/* ── WATER ─────────────────────────────────────────── */}
        {tab==="water"&&<WaterTab pond={pond} ponds={ponds} waterLogs={waterLogs} setWaterLogs={setWaterLogs} setModal={setModal}/>}

        {/* ── FEED ──────────────────────────────────────────── */}
        {tab==="feed"&&<FeedTab ponds={ponds} feedStock={feedStock} setFeedStock={setFeedStock} totalFeedKg={totalFeedKg} totalDailyFeed={totalDailyFeed} daysLeft={daysLeft} setModal={setModal}/>}

        {/* ── ANALYTICS ─────────────────────────────────────── */}
        {tab==="analytics"&&<AnalyticsTab pond={pond} ponds={ponds} activities={activities} waterLogs={waterLogs} growthLogs={growthLogs} expenses={expenses} setModal={setModal} addGrowth={addGrowth}/>}

        {/* ── FINANCE ───────────────────────────────────────── */}
        {tab==="finance"&&<FinanceTab ponds={ponds} expenses={expenses} setExpenses={setExpenses} setModal={setModal} addExpense={addExpense}/>}

        {/* ── HEALTH ────────────────────────────────────────── */}
        {tab==="health"&&<HealthTab ponds={ponds} waterLogs={waterLogs} activities={activities} totalFeedKg={totalFeedKg} daysLeft={daysLeft}/>}

        {/* ── MODALS ────────────────────────────────────────── */}
        {modal==="addPond"&&<PondForm onSave={p=>{addPond(p);close();}} onClose={close}/>}
        {modal==="editPond"&&<PondForm pond={pond} onSave={p=>{editPond(p);close();}} onClose={close}/>}
        {modal==="addActivity"&&<ActivityForm ponds={ponds} defaultPond={selectedPond} onSave={a=>{addActivity(a);close();}} onClose={close}/>}
        {modal==="addWater"&&<WaterForm ponds={ponds} defaultPond={selectedPond} onSave={w=>{addWater(w);close();}} onClose={close}/>}
        {modal==="feedCalc"&&<FeedCalculator ponds={ponds} onClose={close}/>}
        {modal==="addFeedStock"&&<FeedStockForm onSave={f=>{addFeedStock(f);close();}} onClose={close}/>}
        {modal==="addExpense"&&<ExpenseForm ponds={ponds} defaultPond={selectedPond} onSave={e=>{addExpense(e);close();}} onClose={close}/>}
        {modal==="addGrowth"&&<GrowthForm ponds={ponds} defaultPond={selectedPond} onSave={(pid,g)=>{addGrowth(pid,g);close();}} onClose={close}/>}
        {modal==="harvest"&&<HarvestPlanner pond={pond} expenses={expenses} onClose={close}/>}
      </div>
    </>
  );
}

/* ═══ DASHBOARD ═══════════════════════════════════════════════ */
function Dashboard({pond,ponds,activities,waterLogs,feedStock,totalFeedKg,totalDailyFeed,daysLeft,expenses,setModal}){
  const activePonds=ponds.filter(p=>p.status==="active");
  const totalFish=ponds.reduce((s,p)=>s+p.population,0);
  const latestWater=waterLogs.filter(w=>w.pondId===pond?.id).slice(-1)[0];
  const recentActs=activities.filter(a=>a.pondId===pond?.id).slice(0,5);
  const totalExpenses=expenses.filter(e=>e.pondId===pond?.id).reduce((s,e)=>s+(+e.amount||0),0);
  const estRevenue=pond?calcEstRevenue(pond):0;
  const pnl=estRevenue-totalExpenses;

  const waterAlerts=pond&&latestWater?WATER_PARAMS.filter(wp=>{const v=parseFloat(latestWater[wp.key]);return!isNaN(v)&&getStatus(v,wp.min,wp.max)!=="green";}):[]; 

  return(
    <div>
      {/* KPI strip */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:"1.25rem"}}>
        <MetricCard label="Active Ponds" value={activePonds.length} icon="ti-ripple"/>
        <MetricCard label="Total Fish" value={totalFish.toLocaleString()} icon="ti-fish" color={C.teal}/>
        <MetricCard label="Feed Stock" value={totalFeedKg.toFixed(0)} unit="kg" icon="ti-grain" color={daysLeft<7?C.red:C.text} sub={`~${daysLeft} days left`}/>
        <MetricCard label="Today's Feed" value={totalDailyFeed.toFixed(1)} unit="kg/day" icon="ti-clock"/>
        <MetricCard label="Est. P&L" value={`GHS ${Math.round(pnl).toLocaleString()}`} color={pnl>=0?C.green:C.red} icon="ti-trending-up" sub={pond?.name}/>
      </div>

      {/* Alerts banner */}
      {(daysLeft<7||waterAlerts.length>0)&&(
        <div style={{background:"#fee2e2",border:"0.5px solid #fca5a5",borderRadius:10,padding:"10px 14px",marginBottom:"1.25rem",display:"flex",gap:10,alignItems:"flex-start"}}>
          <i className="ti ti-alert-triangle" style={{color:C.red,fontSize:18,flexShrink:0}} aria-hidden/>
          <div style={{fontSize:12}}>
            {daysLeft<7&&<div style={{color:"#991b1b",marginBottom:4}}>Feed stock critical — only {daysLeft} days remaining.</div>}
            {waterAlerts.map(wp=>{const v=parseFloat(latestWater[wp.key]);return<div key={wp.key} style={{color:"#7f1d1d"}}>{pond.name}: {wp.label.split(" (")[0]} = {v}{wp.unit} (out of range)</div>;})}
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
        {/* Stage tracker */}
        {pond&&(
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:500}}>{pond.name} — Stage</div>
              <Badge color="green">{STAGE_LABELS[pond.stage]}</Badge>
            </div>
            <div style={{display:"flex",gap:0,marginBottom:8}}>
              {STAGES.map((s,i)=>(
                <div key={s} style={{flex:1,textAlign:"center"}}>
                  <div style={{height:8,background:STAGES.indexOf(pond.stage)>=i?C.teal:C.bgSec,borderRadius:i===0?"4px 0 0 4px":i===STAGES.length-1?"0 4px 4px 0":0}}/>
                  <div style={{fontSize:10,color:C.textSec,marginTop:3}}>{STAGE_LABELS[s]}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:12,color:C.textSec,display:"flex",gap:16,flexWrap:"wrap"}}>
              <span><i className="ti ti-fish" style={{marginRight:3,fontSize:13}} aria-hidden/>{pond.population.toLocaleString()} fish</span>
              <span><i className="ti ti-weight" style={{marginRight:3,fontSize:13}} aria-hidden/>avg {pond.avgWeight}g</span>
              <span><i className="ti ti-calendar" style={{marginRight:3,fontSize:13}} aria-hidden/>stocked {pond.stocked}</span>
            </div>
          </Card>
        )}

        {/* Today's tasks */}
        {pond&&(
          <Card>
            <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>
              <i className="ti ti-clipboard-check" style={{marginRight:6,color:C.blue}} aria-hidden/>Today's Tasks
            </div>
            {STAGE_TASKS[pond.stage].map((task,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:5,fontSize:12}}>
                <i className="ti ti-circle-check" style={{color:C.teal,fontSize:13,marginTop:1,flexShrink:0}} aria-hidden/>
                <span style={{color:C.textSec}}>{task}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Water quick view */}
      {latestWater&&(
        <Card style={{marginBottom:"1rem"}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>
            <i className="ti ti-droplet" style={{marginRight:6,color:C.blue}} aria-hidden/>Latest Water Reading — {latestWater.date}
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {WATER_PARAMS.map(wp=>{
              const v=parseFloat(latestWater[wp.key]);
              if(isNaN(v))return null;
              const st=getStatus(v,wp.min,wp.max);
              return(
                <div key={wp.key} style={{background:C.bgSec,borderRadius:8,padding:"8px 12px",borderLeft:`3px solid ${C[st]}`,minWidth:90}}>
                  <div style={{fontSize:10,color:C.textSec}}>{wp.label.split(" (")[0]}</div>
                  <div style={{fontSize:16,fontWeight:500,color:C[st]}}>{v}{wp.unit}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent activities */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:500}}><i className="ti ti-activity" style={{marginRight:6,color:C.muted}} aria-hidden/>Recent Activities — {pond?.name}</div>
          <Btn onClick={()=>setModal("addActivity")} variant="primary"><i className="ti ti-plus" style={{fontSize:13}} aria-hidden/> Log</Btn>
        </div>
        {recentActs.length===0?<p style={{fontSize:12,color:C.textSec,textAlign:"center",padding:"1rem 0"}}>No activities yet.</p>:
          recentActs.map(a=>(
            <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`0.5px solid ${C.border}`}}>
              <span style={{fontSize:12,display:"flex",gap:8,alignItems:"center"}}>
                <Badge color={a.status==="done"?"green":a.status==="missed"?"red":"yellow"}>{a.type}</Badge>
                <span style={{color:C.textSec}}>{a.note||""} {a.quantity?`(${a.quantity}${a.unit})`:""}  </span>
              </span>
              <span style={{fontSize:11,color:C.textSec}}>{a.date}</span>
            </div>
          ))
        }
      </Card>
    </div>
  );
}

/* ═══ PONDS TAB ═══════════════════════════════════════════════ */
function PondsTab({ponds,selectedPond,setModal,setPonds}){
  return(
    <div>
      <SectionHead icon="ti-ripple" title={`${ponds.length} ponds registered`} action={<Btn onClick={()=>setModal("addPond")} variant="primary"><i className="ti ti-plus" style={{fontSize:13}} aria-hidden/> Add Pond</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"1rem"}}>
        {ponds.map(p=>{
          const sp=SPECIES_DATA[p.species]||SPECIES_DATA.catfish;
          const biomass=calcBiomass(p).toFixed(1);
          const daily=calcDailyFeed(p).toFixed(2);
          const stageIdx=STAGES.indexOf(p.stage);
          const pct=((stageIdx+0.5)/STAGES.length)*100;
          return(
            <Card key={p.id}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{fontWeight:500,fontSize:15}}>{p.name}</div>
                  <div style={{fontSize:12,color:C.textSec}}>{sp.name} · {p.area} m²</div>
                </div>
                <div style={{display:"flex",gap:5,alignItems:"flex-start"}}>
                  <Badge color={p.status==="active"?"green":p.status==="treatment"?"yellow":"gray"}>{p.status}</Badge>
                  <button onClick={()=>setModal("editPond")} style={{background:"none",border:"none",cursor:"pointer",color:C.textSec,padding:2}}><i className="ti ti-edit" style={{fontSize:14}} aria-hidden/></button>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.textSec,marginBottom:3}}>
                  <span>Stage: {STAGE_LABELS[p.stage]}</span><span>{Math.round(pct)}%</span>
                </div>
                <ProgressBar pct={pct} color={C.teal}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                {[["Population",p.population.toLocaleString()],["Biomass",`${biomass} kg`],["Avg weight",`${p.avgWeight}g`],["Daily feed",`${daily} kg`,C.teal]].map(([l,v,col])=>(
                  <div key={l} style={{background:C.bgSec,borderRadius:6,padding:"7px 10px"}}>
                    <div style={{fontSize:10,color:C.textSec}}>{l}</div>
                    <div style={{fontSize:15,fontWeight:500,color:col||C.text}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:C.textSec,display:"flex",justifyContent:"space-between"}}>
                <span>Stocked: {p.stocked}</span>
                <span>Vol: {p.volume} m³</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ ACTIVITIES TAB ══════════════════════════════════════════ */
function ActivitiesTab({pond,ponds,activities,setActivities,setModal}){
  const [filter,setFilter]=useState("all");
  const pondActs=activities.filter(a=>a.pondId===pond?.id);
  const filtered=filter==="all"?pondActs:pondActs.filter(a=>a.type===filter);
  return(
    <div>
      <SectionHead icon="ti-clipboard-list" title={`${pondActs.length} activities — ${pond?.name}`}
        action={<Btn onClick={()=>setModal("addActivity")} variant="primary"><i className="ti ti-plus" style={{fontSize:13}} aria-hidden/> Log Activity</Btn>}/>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:"1rem"}}>
        {["all",...ACTIVITY_TYPES].map(t=>(
          <button key={t} onClick={()=>setFilter(t)} style={{padding:"4px 10px",fontSize:11,borderRadius:20,border:`0.5px solid ${filter===t?C.teal:C.border}`,background:filter===t?"#ccfbf1":"transparent",color:filter===t?"#0f766e":C.textSec,cursor:"pointer"}}>{t==="all"?"All":t}</button>
        ))}
      </div>
      <Card>
        {filtered.length===0?<p style={{fontSize:13,color:C.textSec,textAlign:"center",padding:"2rem 0"}}>No activities match this filter.</p>:
          filtered.slice().reverse().map(a=>(
            <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`0.5px solid ${C.border}`}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <Badge color={a.status==="done"?"green":a.status==="missed"?"red":"yellow"}>{a.status}</Badge>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{a.type}{a.quantity?` — ${a.quantity} ${a.unit||""}`:""}</div>
                  {a.note&&<div style={{fontSize:11,color:C.textSec}}>{a.note}</div>}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,color:C.textSec}}>{a.date}</div>
                <button onClick={()=>setActivities(as=>as.filter(x=>x.id!==a.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:11}}>remove</button>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  );
}

/* ═══ WATER TAB ═══════════════════════════════════════════════ */
function WaterTab({pond,ponds,waterLogs,setWaterLogs,setModal}){
  const pondLogs=waterLogs.filter(w=>w.pondId===pond?.id).slice().reverse();
  const latest=pondLogs[0];
  return(
    <div>
      <SectionHead icon="ti-droplet" title={`Water Quality — ${pond?.name}`}
        action={<Btn onClick={()=>setModal("addWater")} variant="primary"><i className="ti ti-plus" style={{fontSize:13}} aria-hidden/> Log Reading</Btn>}/>
      {latest&&(
        <div style={{marginBottom:"1rem"}}>
          <div style={{fontSize:12,color:C.textSec,marginBottom:8}}>Latest: {latest.date}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
            {WATER_PARAMS.map(wp=>{
              const v=parseFloat(latest[wp.key]);
              if(isNaN(v))return null;
              const st=getStatus(v,wp.min,wp.max);
              return(
                <div key={wp.key} style={{background:C.bgSec,borderRadius:8,padding:"10px 12px",borderLeft:`3px solid ${C[st]}`}}>
                  <div style={{fontSize:11,color:C.textSec}}>{wp.label.split(" (")[0]}</div>
                  <div style={{fontSize:20,fontWeight:500,color:C[st]}}>{v}{wp.unit}</div>
                  <div style={{fontSize:10,color:C.textSec}}>Range: {wp.min}–{wp.max}</div>
                  <Badge color={st}>{st}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Card>
        <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>Reading History</div>
        {pondLogs.length===0?<p style={{fontSize:13,color:C.textSec,textAlign:"center",padding:"1.5rem 0"}}>No readings yet for {pond?.name}.</p>:(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",fontSize:11,borderCollapse:"collapse",tableLayout:"fixed"}}>
              <thead>
                <tr style={{color:C.textSec,borderBottom:`0.5px solid ${C.border}`}}>
                  <th style={{textAlign:"left",padding:"5px 0",fontWeight:500}}>Date</th>
                  {WATER_PARAMS.map(wp=><th key={wp.key} style={{textAlign:"center",fontWeight:500,padding:"5px 3px"}}>{wp.label.split(" (")[0]}</th>)}
                  <th style={{width:50}}></th>
                </tr>
              </thead>
              <tbody>
                {pondLogs.map(w=>(
                  <tr key={w.id} style={{borderBottom:`0.5px solid ${C.border}`}}>
                    <td style={{padding:"7px 0",color:C.textSec,fontSize:11}}>{w.date}</td>
                    {WATER_PARAMS.map(wp=>{const v=parseFloat(w[wp.key]);const st=isNaN(v)?"muted":getStatus(v,wp.min,wp.max);return<td key={wp.key} style={{textAlign:"center",padding:"7px 3px",color:isNaN(v)?C.textSec:C[st],fontWeight:st!=="green"&&!isNaN(v)?500:400}}>{isNaN(v)?"—":v}</td>;})}
                    <td style={{textAlign:"right"}}><button onClick={()=>setWaterLogs(wl=>wl.filter(x=>x.id!==w.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:11}}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ═══ FEED TAB ════════════════════════════════════════════════ */
function FeedTab({ponds,feedStock,setFeedStock,totalFeedKg,totalDailyFeed,daysLeft,setModal}){
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:"1rem",flexWrap:"wrap"}}>
        <Btn onClick={()=>setModal("feedCalc")} variant="primary"><i className="ti ti-calculator" style={{marginRight:4,fontSize:13}} aria-hidden/>Feed Calculator</Btn>
        <Btn onClick={()=>setModal("addFeedStock")} variant="outline"><i className="ti ti-plus" style={{marginRight:4,fontSize:13}} aria-hidden/>Add Stock</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:"1.25rem"}}>
        <MetricCard label="Total Stock" value={totalFeedKg.toFixed(1)} unit="kg" icon="ti-archive" color={daysLeft<7?C.red:C.text}/>
        <MetricCard label="Daily Requirement" value={totalDailyFeed.toFixed(1)} unit="kg/day" icon="ti-calendar"/>
        <MetricCard label="Days Remaining" value={daysLeft} unit="days" icon="ti-clock" color={daysLeft<7?C.red:daysLeft<14?C.yellow:C.green}/>
        <MetricCard label="Feed Cost Est." value={`GHS ${(feedStock.reduce((s,f)=>s+f.quantityKg*f.costPerKg,0)).toFixed(0)}`} icon="ti-currency-dollar"/>
      </div>

      <Card style={{marginBottom:"1rem"}}>
        <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Daily Feed Requirements by Pond</div>
        {ponds.map(p=>{
          const sp=SPECIES_DATA[p.species]||SPECIES_DATA.catfish;
          const rate=sp.feedRates[p.stage];
          const biomass=calcBiomass(p);
          const daily=(biomass*rate/100);
          const sessions=p.stage==="fingerling"?3:3;
          const perSession=daily/sessions;
          const pct=(daily/Math.max(0.1,totalDailyFeed))*100;
          return(
            <div key={p.id} style={{marginBottom:"1rem",paddingBottom:"1rem",borderBottom:`0.5px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontWeight:500,fontSize:13}}>{p.name} <span style={{fontWeight:400,fontSize:11,color:C.textSec}}>({sp.name}, {STAGE_LABELS[p.stage]}, {rate}% BW/day)</span></div>
                <Badge color="green">{daily.toFixed(2)} kg/day</Badge>
              </div>
              <ProgressBar pct={pct} color={C.teal}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:8}}>
                {[`Biomass: ${biomass.toFixed(1)}kg`,`${sessions}x sessions`,`${perSession.toFixed(2)}kg each`,`GHS ${(daily*(feedStock[0]?.costPerKg||2.5)).toFixed(2)}/day`].map((v,i)=>(
                  <div key={i} style={{background:C.bgSec,borderRadius:5,padding:"5px 8px",fontSize:10,color:C.textSec}}>{v}</div>
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      <Card>
        <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Feed Inventory</div>
        {feedStock.length===0?<p style={{fontSize:13,color:C.textSec,textAlign:"center",padding:"1rem"}}>No stock recorded.</p>:
          feedStock.map(f=>(
            <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`0.5px solid ${C.border}`}}>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{f.brand} <span style={{fontWeight:400,color:C.textSec}}>({f.type})</span></div>
                <div style={{fontSize:11,color:C.textSec}}>Added {f.dateAdded} · GHS {f.costPerKg}/kg · Total: GHS {(f.quantityKg*f.costPerKg).toFixed(2)}</div>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{fontSize:15,fontWeight:500,color:f.quantityKg<30?C.red:C.teal}}>{f.quantityKg} kg</div>
                <button onClick={()=>setFeedStock(fs=>fs.filter(x=>x.id!==f.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:12}}>×</button>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  );
}

/* ═══ ANALYTICS TAB ═══════════════════════════════════════════ */
function AnalyticsTab({pond,ponds,activities,waterLogs,growthLogs,expenses,setModal,addGrowth}){
  const [view,setView]=useState("growth");
  const growth=growthLogs[pond?.id]||[];

  // Growth chart data
  const growthLabels=growth.map(g=>g.date);
  const growthDatasets=[{label:`${pond?.name} weight (g)`,data:growth.map(g=>g.weight),borderColor:"#0d9488",backgroundColor:"rgba(13,148,136,0.08)",fill:true}];

  // Water trend
  const pondWater=waterLogs.filter(w=>w.pondId===pond?.id).slice().reverse().slice(-10);
  const waterLabels=pondWater.map(w=>w.date);
  const waterDatasets=WATER_PARAMS.slice(0,3).map((wp,i)=>({
    label:wp.label.split(" (")[0],
    data:pondWater.map(w=>parseFloat(w[wp.key])||null),
    borderColor:["#0d9488","#2563eb","#7c3aed"][i],
    backgroundColor:"transparent",
  }));

  // Feed vs growth efficiency
  const feedActs=activities.filter(a=>a.pondId===pond?.id&&a.type==="Feeding");
  const totalFeedUsed=feedActs.reduce((s,a)=>s+(+a.quantity||0),0);
  const biomass=pond?calcBiomass(pond):0;
  const fcr=totalFeedUsed>0&&biomass>0?(totalFeedUsed/biomass).toFixed(2):null;
  const sp=pond?SPECIES_DATA[pond.species]||SPECIES_DATA.catfish:null;

  // Activity breakdown
  const actTypes={};
  activities.filter(a=>a.pondId===pond?.id).forEach(a=>{actTypes[a.type]=(actTypes[a.type]||0)+1;});

  // Survival rate (assume start pop from stocking activity or use current)
  const stockAct=activities.find(a=>a.pondId===pond?.id&&a.type==="Stocking");
  const startPop=stockAct?+stockAct.quantity:pond?.population||0;
  const survivalRate=pond&&startPop>0?((pond.population/startPop)*100).toFixed(1):null;

  return(
    <div>
      <SectionHead icon="ti-chart-bar" title={`Analytics — ${pond?.name}`}
        action={<Btn onClick={()=>setModal("addGrowth")} variant="primary"><i className="ti ti-plus" style={{fontSize:13}} aria-hidden/> Log Growth</Btn>}/>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:"1.25rem"}}>
        <MetricCard label="Current Biomass" value={biomass.toFixed(1)} unit="kg" icon="ti-fish"/>
        <MetricCard label="FCR" value={fcr||"—"} icon="ti-refresh" color={fcr&&sp&&parseFloat(fcr)>sp.idealFCR+0.3?C.red:fcr?C.green:C.muted} sub={sp?`Ideal: ${sp.idealFCR}`:""} />
        <MetricCard label="Feed Used" value={totalFeedUsed.toFixed(1)} unit="kg" icon="ti-grain"/>
        {survivalRate&&<MetricCard label="Survival Rate" value={survivalRate} unit="%" icon="ti-heart" color={parseFloat(survivalRate)>80?C.green:C.yellow}/>}
      </div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:6,marginBottom:"1rem",flexWrap:"wrap"}}>
        {[["growth","Growth Curve"],["water","Water Trends"],["activity","Activity Log"],["harvest","Harvest Forecast"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{padding:"5px 12px",fontSize:12,borderRadius:20,border:`0.5px solid ${view===v?C.teal:C.border}`,background:view===v?"#ccfbf1":"transparent",color:view===v?"#0f766e":C.textSec,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      {view==="growth"&&(
        <Card>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Weight Growth Over Time (g)</div>
          {growth.length<2?<p style={{fontSize:12,color:C.textSec,textAlign:"center",padding:"2rem 0"}}>Log at least 2 growth readings to see the curve.</p>:<LineChart labels={growthLabels} datasets={growthDatasets} height={220}/>}
          {growth.length>0&&(
            <div style={{marginTop:"1rem",display:"flex",gap:12,flexWrap:"wrap"}}>
              {growth.map((g,i)=>(
                <div key={i} style={{background:C.bgSec,borderRadius:6,padding:"6px 10px",fontSize:11}}>
                  <div style={{color:C.textSec}}>{g.date}</div>
                  <div style={{fontWeight:500}}>{g.weight}g</div>
                  {i>0&&<div style={{color:C.teal}}>+{g.weight-growth[i-1].weight}g</div>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {view==="water"&&(
        <Card>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Water Parameter Trends (last 10 readings)</div>
          {pondWater.length<2?<p style={{fontSize:12,color:C.textSec,textAlign:"center",padding:"2rem 0"}}>Log more water readings to see trends.</p>:<LineChart labels={waterLabels} datasets={waterDatasets} height={220}/>}
        </Card>
      )}

      {view==="activity"&&(
        <Card>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Activity Distribution</div>
          {Object.keys(actTypes).length===0?<p style={{fontSize:12,color:C.textSec,textAlign:"center",padding:"2rem 0"}}>No activities logged yet.</p>:(
            <>
              <BarChart
                labels={Object.keys(actTypes)}
                datasets={[{label:"Count",data:Object.values(actTypes),backgroundColor:"#0d9488"}]}
                height={200}/>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:"1rem"}}>
                {Object.entries(actTypes).map(([t,n])=>(
                  <div key={t} style={{background:C.bgSec,borderRadius:6,padding:"6px 10px",fontSize:11}}>
                    <span style={{color:C.textSec}}>{t}: </span><span style={{fontWeight:500}}>{n}×</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {view==="harvest"&&pond&&<HarvestForecast pond={pond} expenses={expenses} setModal={setModal}/>}
    </div>
  );
}

function HarvestForecast({pond,expenses,setModal}){
  const sp=SPECIES_DATA[pond.species]||SPECIES_DATA.catfish;
  const currentBiomass=calcBiomass(pond);
  const targetWeight=sp.harvestWeightG;
  const remaining=Math.max(0,targetWeight-pond.avgWeight);
  const dailyGain=remaining>0?Math.round(remaining/30):0;
  const daysToHarvest=remaining>0?Math.ceil(remaining/(dailyGain||3)):0;
  const harvestBiomass=(targetWeight*pond.population)/1000;
  const estRevenue=harvestBiomass*sp.pricePerKg;
  const totalExp=expenses.filter(e=>e.pondId===pond.id).reduce((s,e)=>s+(+e.amount||0),0);
  const margin=estRevenue-totalExp;
  const marginPct=estRevenue>0?((margin/estRevenue)*100).toFixed(1):0;

  return(
    <Card>
      <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Harvest Forecast — {pond.name}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:"1rem"}}>
        <MetricCard label="Target weight" value={targetWeight} unit="g" icon="ti-target"/>
        <MetricCard label="Current avg" value={pond.avgWeight} unit="g" icon="ti-fish"/>
        <MetricCard label="Days to harvest" value={daysToHarvest||"Ready!"} icon="ti-calendar" color={daysToHarvest===0?C.green:C.text}/>
        <MetricCard label="Harvest biomass" value={harvestBiomass.toFixed(0)} unit="kg" icon="ti-package"/>
        <MetricCard label="Est. revenue" value={`GHS ${Math.round(estRevenue).toLocaleString()}`} color={C.green} icon="ti-currency-dollar"/>
        <MetricCard label="Expenses" value={`GHS ${Math.round(totalExp).toLocaleString()}`} color={C.muted} icon="ti-receipt"/>
        <MetricCard label="Est. margin" value={`GHS ${Math.round(margin).toLocaleString()}`} color={margin>=0?C.green:C.red} icon="ti-trending-up" sub={`${marginPct}% margin`}/>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textSec,marginBottom:4}}>
          <span>Growth progress to harvest weight</span><span>{Math.round((pond.avgWeight/targetWeight)*100)}%</span>
        </div>
        <ProgressBar pct={(pond.avgWeight/targetWeight)*100} color={daysToHarvest===0?C.green:C.teal}/>
      </div>
      {daysToHarvest===0&&(
        <div style={{background:"#dcfce7",border:"0.5px solid #86efac",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#166534",fontWeight:500}}>
          🎉 Fish have reached harvest weight! Plan your harvest soon.
        </div>
      )}
      <Btn onClick={()=>setModal("harvest")} variant="primary" style={{marginTop:10}}>
        <i className="ti ti-package" style={{marginRight:4,fontSize:13}} aria-hidden/>Open Harvest Planner
      </Btn>
    </Card>
  );
}

/* ═══ FINANCE TAB ═════════════════════════════════════════════ */
function FinanceTab({ponds,expenses,setExpenses,setModal,addExpense}){
  const [selPond,setSelPond]=useState("all");
  const filtered=selPond==="all"?expenses:expenses.filter(e=>e.pondId===selPond);
  const totalExp=filtered.reduce((s,e)=>s+(+e.amount||0),0);
  const byCategory={};
  filtered.forEach(e=>{byCategory[e.category]=(byCategory[e.category]||0)+(+e.amount||0);});
  const estRevAll=ponds.filter(p=>selPond==="all"||p.id===selPond).reduce((s,p)=>s+calcEstRevenue(p),0);
  const pnl=estRevAll-totalExp;

  // Monthly spending
  const monthly={};
  filtered.forEach(e=>{const m=e.date.slice(0,7);monthly[m]=(monthly[m]||0)+(+e.amount||0);});
  const mLabels=Object.keys(monthly).sort();
  const mVals=mLabels.map(m=>monthly[m]);

  return(
    <div>
      <SectionHead icon="ti-currency-dollar" title="Farm Finance"
        action={<Btn onClick={()=>setModal("addExpense")} variant="primary"><i className="ti ti-plus" style={{fontSize:13}} aria-hidden/> Add Expense</Btn>}/>

      <div style={{display:"flex",gap:6,marginBottom:"1rem",flexWrap:"wrap"}}>
        {[["all","All Ponds"],...ponds.map(p=>[p.id,p.name])].map(([v,l])=>(
          <button key={v} onClick={()=>setSelPond(v)} style={{padding:"4px 12px",fontSize:12,borderRadius:20,border:`0.5px solid ${selPond===v?C.teal:C.border}`,background:selPond===v?"#ccfbf1":"transparent",color:selPond===v?"#0f766e":C.textSec,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:"1.25rem"}}>
        <MetricCard label="Total Expenses" value={`GHS ${Math.round(totalExp).toLocaleString()}`} icon="ti-receipt" color={C.red}/>
        <MetricCard label="Est. Revenue" value={`GHS ${Math.round(estRevAll).toLocaleString()}`} icon="ti-trending-up" color={C.green}/>
        <MetricCard label="Est. P&L" value={`GHS ${Math.round(pnl).toLocaleString()}`} color={pnl>=0?C.green:C.red} icon="ti-chart-line" sub={pnl>=0?"In the green":"In the red"}/>
      </div>

      {pnl<0&&(
        <div style={{background:"#fee2e2",border:"0.5px solid #fca5a5",borderRadius:10,padding:"10px 14px",marginBottom:"1rem",fontSize:13,color:"#991b1b"}}>
          <i className="ti ti-alert-triangle" style={{marginRight:8}} aria-hidden/>You are currently <strong>in the red</strong>. Expenses exceed estimated revenue by GHS {Math.round(Math.abs(pnl)).toLocaleString()}.
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
        <Card>
          <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>Expenses by Category</div>
          {Object.keys(byCategory).length===0?<p style={{fontSize:12,color:C.textSec}}>No data.</p>:(
            <>
              {Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>{
                const pct=(amt/Math.max(1,totalExp))*100;
                return(
                  <div key={cat} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                      <span>{cat}</span><span style={{fontWeight:500}}>GHS {Math.round(amt).toLocaleString()} ({pct.toFixed(0)}%)</span>
                    </div>
                    <ProgressBar pct={pct} color={cat==="Feed"?C.teal:cat==="Labour"?C.blue:cat==="Medication"?C.yellow:C.muted}/>
                  </div>
                );
              })}
            </>
          )}
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>Monthly Spending</div>
          {mLabels.length===0?<p style={{fontSize:12,color:C.textSec}}>No data.</p>:
            <BarChart labels={mLabels.map(m=>m.slice(5))} datasets={[{label:"GHS",data:mVals,backgroundColor:"#2563eb"}]} height={180}/>
          }
        </Card>
      </div>

      <Card>
        <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>Expense Log</div>
        {filtered.length===0?<p style={{fontSize:12,color:C.textSec,textAlign:"center",padding:"1rem"}}>No expenses recorded.</p>:
          [...filtered].reverse().map(e=>{
            const p=ponds.find(x=>x.id===e.pondId);
            return(
              <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <Badge color="gray">{e.category}</Badge>
                  <div>
                    <div style={{fontSize:13}}>{e.note||e.category}</div>
                    <div style={{fontSize:11,color:C.textSec}}>{p?.name} · {e.date}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{fontWeight:500,color:C.red}}>GHS {(+e.amount||0).toLocaleString()}</div>
                  <button onClick={()=>setExpenses(es=>es.filter(x=>x.id!==e.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:12}}>×</button>
                </div>
              </div>
            );
          })
        }
      </Card>
    </div>
  );
}

/* ═══ HEALTH TAB ══════════════════════════════════════════════ */
function HealthTab({ponds,waterLogs,activities,totalFeedKg,daysLeft}){
  const alerts=[];
  if(daysLeft<7)alerts.push({level:"red",msg:`Feed stock critical — ${daysLeft} days remaining`,icon:"ti-alert-triangle"});
  else if(daysLeft<14)alerts.push({level:"yellow",msg:`Feed stock running low — ${daysLeft} days remaining`,icon:"ti-alert-circle"});

  ponds.forEach(p=>{
    const latest=waterLogs.filter(w=>w.pondId===p.id).slice(-1)[0];
    if(!latest){alerts.push({level:"yellow",msg:`No water reading for ${p.name}`,icon:"ti-droplet-off"});return;}
    WATER_PARAMS.forEach(wp=>{
      const v=parseFloat(latest[wp.key]);
      if(!isNaN(v)){
        const st=getStatus(v,wp.min,wp.max);
        if(st==="red")alerts.push({level:"red",msg:`${p.name}: ${wp.label.split(" (")[0]} critical (${v}${wp.unit})`,icon:"ti-alert-triangle"});
        else if(st==="yellow")alerts.push({level:"yellow",msg:`${p.name}: ${wp.label.split(" (")[0]} borderline (${v}${wp.unit})`,icon:"ti-alert-circle"});
      }
    });
  });
  if(alerts.length===0)alerts.push({level:"green",msg:"All systems normal — farm is healthy!",icon:"ti-circle-check"});

  const DISEASES=[
    {name:"White Spot (Ich)",symptoms:"White spots on body/fins, rubbing against surfaces",treatment:"Salt bath 3g/L, raise temp to 28°C, formalin treatment"},
    {name:"Fin Rot",symptoms:"Frayed or disintegrating fins, reddish edges",treatment:"Improve water quality, antibiotics if severe"},
    {name:"Dropsy",symptoms:"Bloated belly, raised scales, lethargy",treatment:"Isolate fish, antibiotic treatment, check water quality"},
    {name:"Gill Disease",symptoms:"Gasping at surface, pale/brown gills, reduced appetite",treatment:"Increase aeration, check dissolved oxygen, KMnO₄ bath"},
    {name:"Columnaris",symptoms:"Grey-white lesions, frayed fins, saddle-shaped patches",treatment:"Salt bath, oxytetracycline, improve pond hygiene"},
    {name:"Saprolegnia (Fungal)",symptoms:"Cotton-like white growth on wounds or eggs",treatment:"Salt bath, malachite green (where legal), improve water"},
  ];

  const DOSAGE_CALC_ITEMS=[
    {compound:"Salt (NaCl)",dose:"3g/L for treatment bath",note:"10–15 min immersion"},
    {compound:"Potassium Permanganate",dose:"2–4 mg/L pond treatment",note:"Remove fish if distress observed"},
    {compound:"Lime (CaO)",dose:"150–200 kg/ha for pond liming",note:"Apply when pond is dry"},
  ];

  return(
    <div>
      <SectionHead icon="ti-stethoscope" title="Health & Alerts"/>
      <Card style={{marginBottom:"1rem"}}>
        <div style={{fontSize:13,fontWeight:500,marginBottom:10}}><i className="ti ti-bell" style={{marginRight:6,color:C.blue}} aria-hidden/>Active Alerts</div>
        {alerts.map((a,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 10px",borderRadius:8,marginBottom:5,background:a.level==="red"?"#fee2e2":a.level==="yellow"?"#fef9c3":"#dcfce7"}}>
            <i className={`ti ${a.icon}`} style={{fontSize:16,color:C[a.level],flexShrink:0,marginTop:1}} aria-hidden/>
            <span style={{fontSize:13,color:a.level==="red"?"#991b1b":a.level==="yellow"?"#92400e":"#166534"}}>{a.msg}</span>
          </div>
        ))}
      </Card>

      <Card style={{marginBottom:"1rem"}}>
        <div style={{fontSize:13,fontWeight:500,marginBottom:10}}><i className="ti ti-first-aid-kit" style={{marginRight:6,color:C.muted}} aria-hidden/>Common Disease Reference</div>
        {DISEASES.map((d,i)=>(
          <div key={i} style={{marginBottom:10,paddingBottom:10,borderBottom:`0.5px solid ${C.border}`}}>
            <div style={{fontWeight:500,fontSize:13,marginBottom:3,color:C.red}}>{d.name}</div>
            <div style={{fontSize:12,color:C.textSec,marginBottom:3}}><span style={{color:C.text,fontWeight:500}}>Symptoms: </span>{d.symptoms}</div>
            <div style={{fontSize:12,color:C.textSec}}><span style={{color:C.text,fontWeight:500}}>Treatment: </span>{d.treatment}</div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{fontSize:13,fontWeight:500,marginBottom:10}}><i className="ti ti-calculator" style={{marginRight:6,color:C.muted}} aria-hidden/>Common Treatment Dosages</div>
        {DOSAGE_CALC_ITEMS.map((d,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"7px 0",borderBottom:`0.5px solid ${C.border}`,gap:12}}>
            <div style={{fontSize:13,fontWeight:500}}>{d.compound}</div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:12,color:C.teal,fontWeight:500}}>{d.dose}</div>
              <div style={{fontSize:11,color:C.textSec}}>{d.note}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ═══ FORMS ═══════════════════════════════════════════════════ */
function PondForm({pond,onSave,onClose}){
  const [f,setF]=useState(pond||{name:"",species:"catfish",stage:"fingerling",population:500,avgWeight:10,area:100,volume:50,stocked:todayStr(),status:"active",stockingCost:0});
  const s=(k,v)=>setF(x=>({...x,[k]:v}));
  return(
    <Modal title={pond?"Edit Pond":"Add New Pond"} onClose={onClose}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FormRow label="Pond Name" span><input value={f.name} onChange={e=>s("name",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Species"><Sel value={f.species} onChange={v=>s("species",v)} options={Object.entries(SPECIES_DATA).map(([k,v])=>[k,v.name])}/></FormRow>
        <FormRow label="Stage"><Sel value={f.stage} onChange={v=>s("stage",v)} options={STAGES.map(x=>[x,STAGE_LABELS[x]])}/></FormRow>
        <FormRow label="Population"><input type="number" value={f.population} onChange={e=>s("population",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Avg Weight (g)"><input type="number" value={f.avgWeight} onChange={e=>s("avgWeight",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Area (m²)"><input type="number" value={f.area} onChange={e=>s("area",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Volume (m³)"><input type="number" value={f.volume} onChange={e=>s("volume",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Stocking Date"><input type="date" value={f.stocked} onChange={e=>s("stocked",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Stocking Cost (GHS)"><input type="number" value={f.stockingCost} onChange={e=>s("stockingCost",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Status"><Sel value={f.status} onChange={v=>s("status",v)} options={[["active","Active"],["fallow","Fallow"],["harvested","Harvested"],["treatment","Under Treatment"]]}/></FormRow>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:"1rem"}}>
        <Btn onClick={onClose} variant="outline">Cancel</Btn>
        <Btn onClick={()=>onSave({...f,population:+f.population,avgWeight:+f.avgWeight,area:+f.area,volume:+f.volume,stockingCost:+f.stockingCost})} variant="primary">Save Pond</Btn>
      </div>
    </Modal>
  );
}

function ActivityForm({ponds,defaultPond,onSave,onClose}){
  const [f,setF]=useState({pondId:defaultPond,type:"Feeding",quantity:"",unit:"kg",note:"",date:todayStr(),status:"done"});
  const s=(k,v)=>setF(x=>({...x,[k]:v}));
  return(
    <Modal title="Log Activity" onClose={onClose}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FormRow label="Pond"><Sel value={f.pondId} onChange={v=>s("pondId",v)} options={ponds.map(p=>[p.id,p.name])}/></FormRow>
        <FormRow label="Activity Type"><Sel value={f.type} onChange={v=>s("type",v)} options={ACTIVITY_TYPES.map(t=>[t,t])}/></FormRow>
        <FormRow label="Quantity"><input type="number" value={f.quantity} onChange={e=>s("quantity",e.target.value)} placeholder="e.g. 5" style={{fontSize:13}}/></FormRow>
        <FormRow label="Unit"><Sel value={f.unit} onChange={v=>s("unit",v)} options={[["kg","kg"],["L","L"],["pcs","pcs"],["g","g"],["mg/L","mg/L"],["%","%"]]}/></FormRow>
        <FormRow label="Date"><input type="date" value={f.date} onChange={e=>s("date",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Status"><Sel value={f.status} onChange={v=>s("status",v)} options={[["done","Done"],["delayed","Delayed"],["missed","Missed"]]}/></FormRow>
        <FormRow label="Notes" span><textarea value={f.note} onChange={e=>s("note",e.target.value)} rows={2} style={{fontSize:13,resize:"vertical"}} placeholder="Optional..."/></FormRow>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:"1rem"}}>
        <Btn onClick={onClose} variant="outline">Cancel</Btn>
        <Btn onClick={()=>onSave(f)} variant="primary">Log Activity</Btn>
      </div>
    </Modal>
  );
}

function WaterForm({ponds,defaultPond,onSave,onClose}){
  const [f,setF]=useState({pondId:defaultPond,date:todayStr(),temperature:"",ph:"",oxygen:"",ammonia:"",turbidity:""});
  const s=(k,v)=>setF(x=>({...x,[k]:v}));
  return(
    <Modal title="Log Water Quality Reading" onClose={onClose} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FormRow label="Pond"><Sel value={f.pondId} onChange={v=>s("pondId",v)} options={ponds.map(p=>[p.id,p.name])}/></FormRow>
        <FormRow label="Date"><input type="date" value={f.date} onChange={e=>s("date",e.target.value)} style={{fontSize:13}}/></FormRow>
        {WATER_PARAMS.map(wp=>(
          <FormRow key={wp.key} label={wp.label}><input type="number" step="0.01" value={f[wp.key]} onChange={e=>s(wp.key,e.target.value)} placeholder={`${wp.min}–${wp.max}`} style={{fontSize:13}}/></FormRow>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:"1rem"}}>
        <Btn onClick={onClose} variant="outline">Cancel</Btn>
        <Btn onClick={()=>onSave(f)} variant="primary">Save Reading</Btn>
      </div>
    </Modal>
  );
}

function FeedStockForm({onSave,onClose}){
  const [f,setF]=useState({brand:"",type:"Grower",quantityKg:"",costPerKg:"",dateAdded:todayStr()});
  const s=(k,v)=>setF(x=>({...x,[k]:v}));
  return(
    <Modal title="Add Feed Stock" onClose={onClose}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FormRow label="Brand / Product" span><input value={f.brand} onChange={e=>s("brand",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Feed Type"><Sel value={f.type} onChange={v=>s("type",v)} options={[["Starter","Starter (0.5–1mm)"],["Grower","Grower (2–3mm)"],["Finisher","Finisher (4–6mm)"],["General","General"]]}/></FormRow>
        <FormRow label="Quantity (kg)"><input type="number" value={f.quantityKg} onChange={e=>s("quantityKg",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Cost/kg (GHS)"><input type="number" step="0.01" value={f.costPerKg} onChange={e=>s("costPerKg",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Date Added"><input type="date" value={f.dateAdded} onChange={e=>s("dateAdded",e.target.value)} style={{fontSize:13}}/></FormRow>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:"1rem"}}>
        <Btn onClick={onClose} variant="outline">Cancel</Btn>
        <Btn onClick={()=>onSave({...f,quantityKg:+f.quantityKg,costPerKg:+f.costPerKg})} variant="primary">Add Stock</Btn>
      </div>
    </Modal>
  );
}

function ExpenseForm({ponds,defaultPond,onSave,onClose}){
  const [f,setF]=useState({pondId:defaultPond,category:"Feed",amount:"",date:todayStr(),note:""});
  const s=(k,v)=>setF(x=>({...x,[k]:v}));
  return(
    <Modal title="Add Expense" onClose={onClose}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FormRow label="Pond"><Sel value={f.pondId} onChange={v=>s("pondId",v)} options={ponds.map(p=>[p.id,p.name])}/></FormRow>
        <FormRow label="Category"><Sel value={f.category} onChange={v=>s("category",v)} options={EXPENSE_CATS.map(c=>[c,c])}/></FormRow>
        <FormRow label="Amount (GHS)"><input type="number" step="0.01" value={f.amount} onChange={e=>s("amount",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Date"><input type="date" value={f.date} onChange={e=>s("date",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Description" span><textarea value={f.note} onChange={e=>s("note",e.target.value)} rows={2} style={{fontSize:13,resize:"vertical"}}/></FormRow>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:"1rem"}}>
        <Btn onClick={onClose} variant="outline">Cancel</Btn>
        <Btn onClick={()=>onSave({...f,amount:+f.amount})} variant="primary">Add Expense</Btn>
      </div>
    </Modal>
  );
}

function GrowthForm({ponds,defaultPond,onSave,onClose}){
  const [f,setF]=useState({pondId:defaultPond,date:todayStr(),weight:"",population:""});
  const s=(k,v)=>setF(x=>({...x,[k]:v}));
  return(
    <Modal title="Log Growth Sample" onClose={onClose}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FormRow label="Pond"><Sel value={f.pondId} onChange={v=>s("pondId",v)} options={ponds.map(p=>[p.id,p.name])}/></FormRow>
        <FormRow label="Date"><input type="date" value={f.date} onChange={e=>s("date",e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Avg Weight (g)"><input type="number" value={f.weight} onChange={e=>s("weight",e.target.value)} placeholder="e.g. 250" style={{fontSize:13}}/></FormRow>
        <FormRow label="Population (optional)"><input type="number" value={f.population} onChange={e=>s("population",e.target.value)} style={{fontSize:13}}/></FormRow>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:"1rem"}}>
        <Btn onClick={onClose} variant="outline">Cancel</Btn>
        <Btn onClick={()=>onSave(f.pondId,{date:f.date,weight:+f.weight,population:+f.population||undefined})} variant="primary">Log Growth</Btn>
      </div>
    </Modal>
  );
}

function FeedCalculator({ponds,onClose}){
  const [species,setSpecies]=useState("catfish");
  const [stage,setStage]=useState("growout");
  const [pop,setPop]=useState(500);
  const [wt,setWt]=useState(300);
  const [sessions,setSessions]=useState(3);
  const [cpk,setCpk]=useState(2.5);
  const sp=SPECIES_DATA[species];
  const rate=sp.feedRates[stage];
  const biomass=(wt*pop)/1000;
  const daily=(biomass*rate)/100;
  const perSess=daily/sessions;
  const weekly=daily*7;
  const monthly=daily*30;
  const dailyCost=daily*cpk;
  const TIMES={1:["8:00 AM"],2:["7:00 AM","5:00 PM"],3:["7:00 AM","12:00 PM","5:00 PM"],4:["6:00 AM","10:00 AM","2:00 PM","6:00 PM"]};
  return(
    <Modal title="Feed Calculator" onClose={onClose} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:"1rem"}}>
        <FormRow label="Species"><Sel value={species} onChange={setSpecies} options={Object.entries(SPECIES_DATA).map(([k,v])=>[k,v.name])}/></FormRow>
        <FormRow label="Stage"><Sel value={stage} onChange={setStage} options={STAGES.map(s=>[s,STAGE_LABELS[s]])}/></FormRow>
        <FormRow label="Population"><input type="number" value={pop} onChange={e=>setPop(+e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Avg Weight (g)"><input type="number" value={wt} onChange={e=>setWt(+e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Sessions/day"><input type="number" min="1" max="5" value={sessions} onChange={e=>setSessions(+e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Feed cost (GHS/kg)"><input type="number" step="0.1" value={cpk} onChange={e=>setCpk(+e.target.value)} style={{fontSize:13}}/></FormRow>
      </div>
      <div style={{background:C.bgSec,borderRadius:10,padding:"1rem",marginBottom:"1rem"}}>
        <div style={{fontSize:12,color:C.textSec,marginBottom:10}}>Feeding rate for <strong>{sp.name}</strong> at <strong>{STAGE_LABELS[stage]}</strong>: <strong>{rate}% BW/day</strong></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[["Biomass",`${biomass.toFixed(1)} kg`,""],["Daily Feed",`${daily.toFixed(2)} kg`,`${perSess.toFixed(2)} kg × ${sessions}×`],["Weekly",`${weekly.toFixed(1)} kg`,""],["Monthly",`${Math.round(monthly)} kg`,""],["Daily Cost",`GHS ${dailyCost.toFixed(2)}`,""],["Monthly Cost",`GHS ${Math.round(dailyCost*30)}`,""]].map(([l,v,s])=>(
            <div key={l} style={{background:C.bg,borderRadius:8,padding:"10px 12px",border:`0.5px solid ${C.border}`}}>
              <div style={{fontSize:10,color:C.textSec}}>{l}</div>
              <div style={{fontSize:15,fontWeight:500,color:C.teal,margin:"3px 0"}}>{v}</div>
              {s&&<div style={{fontSize:10,color:C.textSec}}>{s}</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{background:"#fefce8",border:"0.5px solid #fef08a",borderRadius:8,padding:"10px 14px",marginBottom:"1rem"}}>
        <div style={{fontSize:12,color:"#92400e",fontWeight:500}}>Ideal FCR for {sp.name}: {sp.idealFCR}</div>
        <div style={{fontSize:11,color:"#a16207",marginTop:2}}>FCR above {sp.idealFCR+0.3} indicates poor feed conversion — check feed quality and fish health.</div>
      </div>
      <div style={{background:C.bgSec,borderRadius:8,padding:"10px 14px"}}>
        <div style={{fontSize:12,fontWeight:500,marginBottom:8}}>Recommended Schedule</div>
        {(TIMES[Math.min(sessions,4)]||TIMES[3]).map((t,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:`0.5px solid ${C.border}`}}>
            <span style={{color:C.textSec}}>Session {i+1} — {t}</span>
            <span style={{fontWeight:500}}>{perSess.toFixed(2)} kg</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function HarvestPlanner({pond,expenses,onClose}){
  const sp=SPECIES_DATA[pond.species]||SPECIES_DATA.catfish;
  const biomass=calcBiomass(pond);
  const harvestBiomass=(sp.harvestWeightG*pond.population)/1000;
  const totalExp=expenses.filter(e=>e.pondId===pond.id).reduce((s,e)=>s+(+e.amount||0),0);
  const [price,setPrice]=useState(sp.pricePerKg);
  const [mortality,setMortality]=useState(5);
  const [opCost,setOpCost]=useState(50);
  const survPop=Math.round(pond.population*(1-mortality/100));
  const harvestKg=(sp.harvestWeightG*survPop)/1000;
  const revenue=harvestKg*price;
  const totalCost=totalExp+opCost;
  const margin=revenue-totalCost;
  return(
    <Modal title={`Harvest Planner — ${pond.name}`} onClose={onClose} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:"1rem"}}>
        <FormRow label="Market price (GHS/kg)"><input type="number" step="0.5" value={price} onChange={e=>setPrice(+e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Expected mortality (%)"><input type="number" min="0" max="50" value={mortality} onChange={e=>setMortality(+e.target.value)} style={{fontSize:13}}/></FormRow>
        <FormRow label="Harvest op. cost (GHS)"><input type="number" value={opCost} onChange={e=>setOpCost(+e.target.value)} style={{fontSize:13}}/></FormRow>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:"1rem"}}>
        {[["Surviving fish",`${survPop.toLocaleString()} pcs`,"",""],["Harvest biomass",`${harvestKg.toFixed(0)} kg`,"",""],["Gross revenue",`GHS ${Math.round(revenue).toLocaleString()}`,C.green,""],["Total costs",`GHS ${Math.round(totalCost).toLocaleString()}`,C.red,""],["Net margin",`GHS ${Math.round(margin).toLocaleString()}`,margin>=0?C.green:C.red,margin>=0?"Profitable":"Loss-making"]].map(([l,v,col,s])=>(
          <div key={l} style={{background:C.bgSec,borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:C.textSec}}>{l}</div>
            <div style={{fontSize:15,fontWeight:500,color:col||C.text,margin:"3px 0"}}>{v}</div>
            {s&&<div style={{fontSize:10,fontWeight:500,color:col}}>{s}</div>}
          </div>
        ))}
      </div>
      {margin<0&&<div style={{background:"#fee2e2",border:"0.5px solid #fca5a5",borderRadius:8,padding:"10px 14px",marginBottom:"1rem",fontSize:13,color:"#991b1b"}}>⚠ At current prices, this harvest will be a loss. Consider waiting for better market prices or reducing costs.</div>}
      {margin>0&&<div style={{background:"#dcfce7",border:"0.5px solid #86efac",borderRadius:8,padding:"10px 14px",marginBottom:"1rem",fontSize:13,color:"#166534"}}>✓ This harvest is projected to be profitable at GHS {price}/kg market price.</div>}
      <div style={{fontSize:12,color:C.textSec,marginBottom:6}}>Break-even price: <strong>GHS {harvestKg>0?(totalCost/harvestKg).toFixed(2):0}/kg</strong></div>
      <Btn onClick={onClose} variant="outline">Close</Btn>
    </Modal>
  );
}
