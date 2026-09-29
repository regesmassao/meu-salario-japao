const $=id=>document.getElementById(id);
const val=id=>{
  const raw=String($(id).value||"").trim();
  if(id==="overtimeHours" && /h/i.test(raw)){
    const m=raw.match(/^(\d+)h(?:\s*(\d+)min)?$/i);
    if(m)return Number(m[1])+(Number(m[2]||0)/60);
  }
  return Number(raw||0);
};
let mode="hourly";
let viewDate=new Date();
viewDate.setDate(1);
let selectedKey=null;
const STORAGE="msj-v4-2-days";
const MONTHLY_STORAGE="msj-v4-3-months";

function money(n){return "¥"+Math.round(n).toLocaleString("ja-JP")}
function timeMinutes(t){
  if(!t)return null;
  const [h,m]=t.split(":").map(Number);
  return h*60+m;
}
function duration(a,b){
  if(a==null||b==null)return 0;
  let d=b-a;
  if(d<0)d+=1440;
  return d;
}
function dayData(key){
  return JSON.parse(localStorage.getItem(STORAGE+"-"+key)||"null");
}
function saveData(key,data){localStorage.setItem(STORAGE+"-"+key,JSON.stringify(data))}
function deleteData(key){localStorage.removeItem(STORAGE+"-"+key)}
function keyFor(y,m,d){return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`}
function parseKey(key){const [y,m,d]=key.split("-").map(Number);return {y,m:m-1,d}}

function nightOverlap(a,b){
  if(a==null||b==null)return 0;
  const parts=b>=a?[[a,b]]:[[a,1440],[0,b]];
  let n=0;
  for(const [x,y] of parts){
    n+=Math.max(0,Math.min(y,300)-Math.max(x,0));
    n+=Math.max(0,Math.min(y,1440)-Math.max(x,1320));
  }
  return n;
}
function calcDay(data){
  const start=timeMinutes(data.in), out=timeMinutes(data.out);
  if(start==null||out==null)return {hours:0,worked:0,break:0,normal:0,overtime:0,night:0,nightDay:false};
  const total=duration(start,out);
  const lunchOut=timeMinutes(data.lunchOut), lunchIn=timeMinutes(data.lunchIn);
  const breakM=(lunchOut!=null&&lunchIn!=null)?duration(lunchOut,lunchIn):0;
  const worked=Math.max(0,total-breakM);
  let nightM=nightOverlap(start,out);
  if(lunchOut!=null&&lunchIn!=null)nightM=Math.max(0,nightM-nightOverlap(lunchOut,lunchIn));
  return {hours:worked/60,worked,break:breakM,normal:Math.min(worked,480)/60,overtime:Math.max(0,worked-480)/60,night:nightM/60,nightDay:nightM>0};
}
function fmtHours(h){
  const total=Math.round(h*60);
  return `${Math.floor(total/60)}h ${String(total%60).padStart(2,"0")}m`;
}
function fmtHoursShort(h){
  const total=Math.round(h*60);
  const hours=Math.floor(total/60), mins=total%60;
  return mins ? `${hours}h ${mins}min` : `${hours}h`;
}
function monthLabel(){
  $("monthLabel").textContent=viewDate.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
}
function renderCalendar(){
  monthLabel();
  const grid=$("calendarGrid"); grid.innerHTML="";
  const y=viewDate.getFullYear(),m=viewDate.getMonth();
  const first=new Date(y,m,1).getDay();
  const count=new Date(y,m+1,0).getDate();
  const prevCount=new Date(y,m,0).getDate();
  const total=Math.ceil((first+count)/7)*7;
  for(let i=0;i<total;i++){
    let d=i-first+1, yy=y, mm=m, other=false;
    if(d<1){d=prevCount+d;mm=m-1;other=true;if(mm<0){mm=11;yy--}}
    else if(d>count){d=d-count;mm=m+1;other=true;if(mm>11){mm=0;yy++}}
    const key=keyFor(yy,mm,d), data=dayData(key);
    const b=document.createElement("button");
    b.textContent=d;
    if(other)b.classList.add("other");
    const today=new Date();
    if(yy===today.getFullYear()&&mm===today.getMonth()&&d===today.getDate())b.classList.add("today");
    if(data)b.classList.add("hasData");
    b.onclick=()=>openDay(key);
    grid.appendChild(b);
  }
  renderHistory();
}
function openDay(key){
  selectedKey=key;
  const {y,m,d}=parseKey(key);
  const data=dayData(key)||{};
  $("editorDate").textContent=new Date(y,m,d).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"});
  $("timeIn").value=data.in||"";
  $("lunchOut").value=data.lunchOut||"";
  $("lunchIn").value=data.lunchIn||"";
  $("timeOut").value=data.out||"";
  $("dayNote").value=data.note||"";
  $("dayEditor").classList.remove("hidden");
  updateDaySummary();
  $("dayEditor").scrollIntoView({behavior:"smooth",block:"nearest"});
}
function updateDaySummary(){
  const data={in:$("timeIn").value,lunchOut:$("lunchOut").value,lunchIn:$("lunchIn").value,out:$("timeOut").value};
  const c=calcDay(data);
  const br=c.break?` · intervalo ${fmtHours(c.break/60)}`:"";
  const extra=c.overtime?` · Extra: ${fmtHours(c.overtime)}`:"";
  const night=c.night?` · 🌙 Noturno: ${fmtHours(c.night)}`:"";
  const nd=c.nightDay?" · 1 dia noturno":"";
  $("daySummary").textContent=c.worked?`⏱️ Trabalhado: ${fmtHours(c.hours)}${br}${extra}${night}${nd}`:"Preencha entrada e saída para calcular.";
}
function saveCurrentDay(){
  if(!selectedKey)return;
  const data={in:$("timeIn").value,lunchOut:$("lunchOut").value,lunchIn:$("lunchIn").value,out:$("timeOut").value,note:$("dayNote").value.trim()};
  if(!data.in||!data.out){alert("Informe pelo menos a entrada e a saída.");return}
  saveData(selectedKey,data);
  renderCalendar();
  renderDashboard();
  openDay(selectedKey);
}
function renderHistory(){
  const y=viewDate.getFullYear(),m=viewDate.getMonth(),count=new Date(y,m+1,0).getDate();
  const h=$("history");h.innerHTML="";
  let total=0,normalTotal=0,overtimeTotal=0,nightTotal=0,nightDays=0,days=0;
  for(let d=1;d<=count;d++){
    const key=keyFor(y,m,d),data=dayData(key);
    if(!data)continue;
    const c=calcDay(data); if(!c.worked)continue;
    days++;total+=c.hours;normalTotal+=c.normal;overtimeTotal+=c.overtime;nightTotal+=c.night;if(c.nightDay)nightDays++;
    const row=document.createElement("div");row.className="row";
    const date=document.createElement("div");date.textContent=String(d).padStart(2,"0")+"/"+String(m+1).padStart(2,"0");
    const times=document.createElement("div");times.textContent=`${data.in} → ${data.out}${data.note?" · "+data.note:""}`;
    const hours=document.createElement("div");hours.className="hours";hours.textContent=fmtHours(c.hours);
    row.append(date,times,hours);row.onclick=()=>openDay(key);row.style.cursor="pointer";h.appendChild(row);
  }
  if(!days)h.innerHTML='<div class="empty">Nenhum dia registrado neste mês.</div>';
  $("monthTotals").textContent=`${days} dia(s) · ${fmtHours(total)} · Normais: ${fmtHours(normalTotal)} · Extras: ${fmtHours(overtimeTotal)} · Noturnas: ${fmtHours(nightTotal)} · Dias noturnos: ${nightDays}`;
  $("normalHours").value=normalTotal.toFixed(2);
  $("overtimeHours").value=fmtHoursShort(overtimeTotal);
  $("nightHours").value=nightTotal.toFixed(2);
  $("nightDays").value=String(nightDays);
  calculate();
}

function hourlyRate(){
  return mode==="monthly" ? val("monthlySalary")/Math.max(1,val("baseHours")) : val("hourlyRate");
}
function monthlyKey(date=viewDate){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
}
function monthName(key){
  const [y,m]=key.split("-").map(Number);
  return new Date(y,m-1,1).toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}).replace(".", "");
}
function monthlySnapshot(key){
  try{return JSON.parse(localStorage.getItem(MONTHLY_STORAGE+"-"+key)||"null")}catch(e){return null}
}
function saveMonthlySnapshot(key,data){
  localStorage.setItem(MONTHLY_STORAGE+"-"+key,JSON.stringify(data));
}
function deductionValues(gross){
  const detailed=$("deductionMode")?.value==="detailed";
  if(!detailed){
    const total=gross*(val("deduction")/100);
    return {mandatory:total,other:0,total};
  }
  const mandatory=val("employmentInsurance")+val("incomeTax");
  const other=val("advanceSalary")+val("utilities")+val("rentDeduction")+val("otherDeduction");
  return {mandatory,other,total:mandatory+other};
}
function currentCalculatedValues(){
  const rate=hourlyRate();
  const normal=mode==="monthly"?val("monthlySalary"):rate*val("normalHours");
  const overtime=rate*1.25*val("overtimeHours");
  const night=rate*(val("nightPercent")/100)*val("nightHours")+val("nightFixed")*val("nightDays");
  const meal=val("mealMonthly");
  const gross=normal+overtime+night+meal+val("otherAllowance");
  const d=deductionValues(gross);
  return {gross,net:gross-d.total,mandatory:d.mandatory,otherDeductions:d.other,deductions:d.total};
}
function monthStats(key){
  const [y,m]=key.split("-").map(Number);
  const count=new Date(y,m,0).getDate();
  let hours=0,overtime=0,night=0,nightDays=0,days=0;
  for(let d=1;d<=count;d++){
    const data=dayData(`${key}-${String(d).padStart(2,"0")}`);
    if(!data)continue;
    const c=calcDay(data);
    if(!c.worked)continue;
    days++; hours+=c.hours; overtime+=c.overtime; night+=c.night;
    if(c.nightDay)nightDays++;
  }
  const snap=monthlySnapshot(key);
  let gross=snap?.gross??null, net=snap?.net??null;
  // Se o mês selecionado ainda não tem snapshot, usa o cálculo atualmente
  // exibido na calculadora. Isso evita que o painel fique vazio depois de
  // atualizar o aplicativo, sem alterar os dados históricos já salvos.
  if(gross==null && key===monthlyKey() && days>0){
    const current=currentCalculatedValues();
    if(current.gross>0){gross=current.gross;net=current.net;}
  }
  return {key,days,hours,overtime,night,nightDays,gross,net};
}
function changeText(current,previous){
  if(current==null||previous==null||previous===0)return "—";
  const pct=((current-previous)/previous)*100;
  if(Math.abs(pct)<0.005)return "0.00%";
  return `${pct>0?"▲ +":"▼ −"}${Math.abs(pct).toFixed(2)}%`;
}
function metricValue(v,format){
  if(v==null)return "—";
  if(format==="money")return money(v);
  if(format==="hours")return fmtHours(v);
  return Math.round(v).toLocaleString("pt-BR");
}
function renderMetricCard(label,values,format){
  const current=values[values.length-1]?.value??null;
  const previous=values.length>1?values[values.length-2]?.value??null:null;
  return `<div class="metricCard">
    <div class="metricTitle">${label}</div>
    <strong>${metricValue(current,format)}</strong>
    <span>${changeText(current,previous)}</span>
  </div>`;
}
function renderChart(title,items,format){
  const numeric=items.map(x=>x.value).filter(v=>typeof v==="number");
  const max=Math.max(...numeric,1);
  const bars=items.map(x=>{
    const h=x.value==null?0:Math.max(5,(x.value/max)*100);
    const display=metricValue(x.value,format);
    const change=x.change;
    return `<div class="barItem">
      <div class="barValue">${display}</div>
      <div class="barTrack"><div class="barFill" style="height:${h}%"></div></div>
      <div class="barLabel">${x.label}</div>
      <div class="barChange">${change}</div>
    </div>`;
  }).join("");
  return `<div class="chartBox"><h4>${title}</h4><div class="bars">${bars}</div></div>`;
}
function renderDashboard(){
  const dash=$("monthlyDashboard");
  if(!dash)return;
  const months=[];
  // No iPhone, seis meses dão uma leitura muito mais clara sem esconder
  // os valores. O mês selecionado no calendário fica sempre por último.
  for(let i=5;i>=0;i--){
    const d=new Date(viewDate.getFullYear(),viewDate.getMonth()-i,1);
    months.push(monthStats(monthlyKey(d)));
  }
  const labels=months.map(x=>monthName(x.key));
  const make=(field,format)=>months.map((x,i)=>({
    label:labels[i],value:x[field],
    change:i===0?"—":changeText(x[field],months[i-1][field])
  }));
  const latest=months[months.length-1];
  dash.innerHTML=`
    <div class="sectionHead dashboardHead">
      <div><h2>📈 Evolução mensal</h2><p>Comparação automática com o mês anterior.</p></div>
    </div>
    <div class="metricGrid">
      ${renderMetricCard("💴 Bruto mensal",make("gross","money"),"money")}
      ${renderMetricCard("💰 Líquido mensal",make("net","money"),"money")}
      ${renderMetricCard("⏱️ Horas trabalhadas",make("hours","hours"),"hours")}
      ${renderMetricCard("➕ Horas extras",make("overtime","hours"),"hours")}
      ${renderMetricCard("🌙 Horas noturnas",make("night","hours"),"hours")}
      ${renderMetricCard("📅 Dias trabalhados",make("days","number"),"number")}
    </div>
    ${renderChart("💴 Bruto por mês",make("gross","money"),"money")}
    ${renderChart("💰 Líquido por mês",make("net","money"),"money")}
    ${renderChart("⏱️ Horas trabalhadas por mês",make("hours","hours"),"hours")}
    ${renderChart("➕ Horas extras por mês",make("overtime","hours"),"hours")}
    ${renderChart("🌙 Horas noturnas por mês",make("night","hours"),"hours")}
    ${renderChart("📅 Dias trabalhados por mês",make("days","number"),"number")}
    <div class="dashboardNote">Mostrando os últimos 6 meses até <strong>${monthName(monthlyKey())}</strong>. As horas e dias vêm do calendário. Bruto e líquido usam o valor salvo em cada mês; no mês selecionado, se ainda não houver histórico salvo, o painel usa o cálculo atual da calculadora.</div>`;
}
function calculate(saveSnapshot=false){
  const rate=hourlyRate();
  const normal=mode==="monthly"?val("monthlySalary"):rate*val("normalHours");
  const overtime=rate*1.25*val("overtimeHours");
  const night=rate*(val("nightPercent")/100)*val("nightHours")+val("nightFixed")*val("nightDays");
  const meal=val("mealMonthly");
  const gross=normal+overtime+night+meal+val("otherAllowance");
  const d=deductionValues(gross);
  const net=gross-d.total;
  $("gross").textContent=money(gross);
  const detailed=$("deductionMode")?.value==="detailed";
  $("mandatoryLabel").textContent=detailed?"Descontos obrigatórios":"Descontos estimados";
  $("mandatoryDeductions").textContent=money(d.mandatory);
  $("otherDeductions").textContent=money(d.other);
  $("deductions").textContent=money(d.total);
  $("net").textContent=money(net);
  $("rateOut").textContent=money(rate);
  if(saveSnapshot){
    saveMonthlySnapshot(monthlyKey(),{
      gross,net,mandatoryDeductions:d.mandatory,otherDeductions:d.other,deductions:d.total,updatedAt:Date.now(),
      mode,deductionMode:$("deductionMode")?.value||"percent",
      normalHours:val("normalHours"),
      overtimeHours:val("overtimeHours"),
      nightHours:val("nightHours"),
      nightDays:val("nightDays")
    });
    renderDashboard();
  }
}
document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{
  mode=btn.dataset.mode;
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===btn));
  $("hourlyBox").classList.toggle("hidden",mode!=="hourly");
  $("monthlyBox").classList.toggle("hidden",mode!=="monthly");
  calculate();
});
$("deductionMode").onchange=()=>{
  $("detailedDeductions").classList.toggle("hidden",$("deductionMode").value!=="detailed");
  calculate();
};
$("calcBtn").onclick=()=>calculate(true);
document.querySelectorAll("input").forEach(i=>i.addEventListener("input",()=>{if(i.closest(".card")&&i.id!=="dayNote")calculate();if(i.id.startsWith("time")||i.id.startsWith("lunch"))updateDaySummary()}));
$("prevMonth").onclick=()=>{viewDate.setMonth(viewDate.getMonth()-1);renderCalendar();renderDashboard()};
$("nextMonth").onclick=()=>{viewDate.setMonth(viewDate.getMonth()+1);renderCalendar();renderDashboard()};
$("saveDay").onclick=saveCurrentDay;
$("deleteDay").onclick=()=>{
  if(selectedKey&&dayData(selectedKey)){deleteData(selectedKey);renderCalendar();renderDashboard();openDay(selectedKey)}
};
$("closeEditor").onclick=()=>{$("dayEditor").classList.add("hidden");selectedKey=null};
$("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("msj-theme",document.body.classList.contains("dark")?"dark":"light")};
if(localStorage.getItem("msj-theme")==="dark")document.body.classList.add("dark");
calculate();renderCalendar();renderDashboard();

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
