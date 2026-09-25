const $=id=>document.getElementById(id);
function val(id){
  const raw=$(id).value||"";
  if(id==="overtimeHours" && typeof raw==="string" && raw.includes("h")){
    const m=raw.match(/(\d+(?:[.,]\d+)?)\s*h(?:\s*(\d+)\s*(?:m|min))?/i);
    if(m){
      const h=Number(m[1].replace(",","."));
      const mins=m[2]?Number(m[2]):0;
      return h+mins/60;
    }
  }
  return Number(raw)||0;
}
let mode="hourly";
let viewDate=new Date();
viewDate.setDate(1);
let selectedKey=null;
const STORAGE="msj-v4-2-days";

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
function calculate(){
  const rate=hourlyRate();
  const normal=mode==="monthly"?val("monthlySalary"):rate*val("normalHours");
  const overtime=rate*1.25*val("overtimeHours");
  const night=rate*(val("nightPercent")/100)*val("nightHours")+val("nightFixed")*val("nightDays");
  const meal=val("mealMonthly");
  const gross=normal+overtime+night+meal+val("otherAllowance");
  const deductions=gross*(val("deduction")/100);
  $("gross").textContent=money(gross);
  $("deductions").textContent=money(deductions);
  $("net").textContent=money(gross-deductions);
  $("rateOut").textContent=money(rate);
}
document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{
  mode=btn.dataset.mode;
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===btn));
  $("hourlyBox").classList.toggle("hidden",mode!=="hourly");
  $("monthlyBox").classList.toggle("hidden",mode!=="monthly");
  calculate();
});
$("calcBtn").onclick=calculate;
document.querySelectorAll("input").forEach(i=>i.addEventListener("input",()=>{if(i.closest(".card")&&i.id!=="dayNote")calculate();if(i.id.startsWith("time")||i.id.startsWith("lunch"))updateDaySummary()}));
$("prevMonth").onclick=()=>{viewDate.setMonth(viewDate.getMonth()-1);renderCalendar()};
$("nextMonth").onclick=()=>{viewDate.setMonth(viewDate.getMonth()+1);renderCalendar()};
$("saveDay").onclick=saveCurrentDay;
$("deleteDay").onclick=()=>{
  if(selectedKey&&dayData(selectedKey)){deleteData(selectedKey);renderCalendar();openDay(selectedKey)}
};
$("closeEditor").onclick=()=>{$("dayEditor").classList.add("hidden");selectedKey=null};
$("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("msj-theme",document.body.classList.contains("dark")?"dark":"light")};
if(localStorage.getItem("msj-theme")==="dark")document.body.classList.add("dark");
calculate();renderCalendar();

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
