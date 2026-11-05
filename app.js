const $=id=>document.getElementById(id);
const val=id=>{
  const el=$(id);
  if(!el)return 0;
  const raw=String(el.value||"").trim();
  if(id==="overtimeHours" && /h/i.test(raw)){
    const m=raw.match(/^(\d+)h(?:\s*(\d+)min)?$/i);
    if(m)return Number(m[1])+(Number(m[2]||0)/60);
  }
  const n=Number(raw||0);
  return Number.isFinite(n)?n:0;
};
let mode="hourly";
let viewDate=new Date();
viewDate.setDate(1);
let selectedKey=null;
// ---------- Funcionários ----------
// Cada funcionário tem seus próprios dias, meses e configurações.
// O funcionário "principal" usa as chaves históricas do app, então
// nenhum dado já salvo muda de lugar. Funcionários novos ganham um
// prefixo próprio (msj-func-<id>-...).
const EMPLOYEES_KEY="msj-employees";
const ACTIVE_EMPLOYEE_KEY="msj-activeEmployee";
const EMPLOYEE_COLORS=["#2563eb","#db2777","#059669","#d97706","#7c3aed","#0891b2"];
function loadEmployees(){
  try{
    const list=JSON.parse(localStorage.getItem(EMPLOYEES_KEY)||"null");
    if(Array.isArray(list)&&list.length&&list.every(e=>e&&e.id&&e.name))return list;
  }catch(e){}
  return [{id:"principal",name:"Reges",color:EMPLOYEE_COLORS[0]}];
}
const employees=loadEmployees();
function saveEmployees(){localStorage.setItem(EMPLOYEES_KEY,JSON.stringify(employees))}
let activeEmployee=employees.find(e=>e.id===localStorage.getItem(ACTIVE_EMPLOYEE_KEY))||employees[0];
function employeeBases(emp){
  if(emp.id==="principal")return {days:"msj-v4-2-days",months:"msj-v4-3-months",settings:"msj-"};
  return {days:`msj-func-${emp.id}-days`,months:`msj-func-${emp.id}-months`,settings:`msj-func-${emp.id}-`};
}
const ACTIVE_BASES=employeeBases(activeEmployee);
const STORAGE=ACTIVE_BASES.days;
const MONTHLY_STORAGE=ACTIVE_BASES.months;
const SETTINGS_PREFIX=ACTIVE_BASES.settings;
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

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
function dayDataFor(bases,key){
  try{return JSON.parse(localStorage.getItem(bases.days+"-"+key)||"null")}catch(e){return null}
}
function dayData(key){return dayDataFor(ACTIVE_BASES,key)}
function saveData(key,data){localStorage.setItem(STORAGE+"-"+key,JSON.stringify(data))}
function deleteData(key){localStorage.removeItem(STORAGE+"-"+key)}
// ---------- Backup (exportar/importar) ----------
// Todos os dados do app vivem no localStorage com o prefixo "msj-":
// dias (msj-v4-2-days-*), meses (msj-v4-3-months-*) e configurações.
// O backup guarda as chaves e valores exatamente como estão, para a
// restauração ser fiel ao original.
const BACKUP_PREFIX="msj-";
function collectBackup(){
  const data={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith(BACKUP_PREFIX))data[k]=localStorage.getItem(k);
  }
  return {app:"meu-salario-japao",version:1,exportedAt:new Date().toISOString(),data};
}
function countBackupDays(data){
  // Conta os dias de TODOS os funcionários (cada um no seu prefixo).
  return Object.keys(data||{}).filter(k=>k.includes("-days-")).length;
}
function applyBackup(backup){
  if(!backup||typeof backup!=="object"||!backup.data||typeof backup.data!=="object"){
    throw new Error("invalid backup");
  }
  const keys=Object.keys(backup.data).filter(k=>k.startsWith(BACKUP_PREFIX));
  const current=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith(BACKUP_PREFIX))current.push(k);
  }
  current.forEach(k=>localStorage.removeItem(k));
  keys.forEach(k=>localStorage.setItem(k,String(backup.data[k])));
  return keys.length;
}
function exportBackup(){
  const backup=collectBackup();
  const days=countBackupDays(backup.data);
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="meu-salario-japao-backup-"+new Date().toISOString().slice(0,10)+".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  $("backupStatus").textContent=`Backup exportado com ${days} dia(s) registrados. Guarde o arquivo em local seguro.`;
}
function importBackupFile(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const backup=JSON.parse(String(reader.result||""));
      const days=countBackupDays(backup.data);
      const when=backup.exportedAt?new Date(backup.exportedAt).toLocaleDateString("pt-BR"):"data desconhecida";
      if(!confirm(`Importar o backup de ${when}, com ${days} dia(s) registrados? Os dados atuais serão substituídos pelos do arquivo.`))return;
      applyBackup(backup);
      $("backupStatus").textContent="Backup importado com sucesso. Recarregando o app…";
      setTimeout(()=>location.reload(),600);
    }catch(e){
      alert("Arquivo de backup inválido. Nada foi alterado.");
    }
  };
  reader.readAsText(file);
}
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
function dayBreaks(data){
  // Formato novo: data.breaks = [{out,in}, ...]. Formato antigo (um almoço
  // só, lunchOut/lunchIn) continua valendo para os dias já salvos.
  if(Array.isArray(data.breaks)&&data.breaks.length)return data.breaks;
  if(data.lunchOut||data.lunchIn)return [{out:data.lunchOut||"",in:data.lunchIn||""}];
  return [];
}
function calcDay(data){
  const start=timeMinutes(data.in), out=timeMinutes(data.out);
  if(start==null||out==null)return {hours:0,worked:0,break:0,normal:0,overtime:0,night:0,nightDay:false};
  const total=duration(start,out);
  let breakM=0;
  let nightM=nightOverlap(start,out);
  for(const b of dayBreaks(data)){
    const bOut=timeMinutes(b.out), bIn=timeMinutes(b.in);
    if(bOut==null||bIn==null)continue;
    breakM+=duration(bOut,bIn);
    nightM-=nightOverlap(bOut,bIn);
  }
  const worked=Math.max(0,total-breakM);
  nightM=Math.max(0,nightM);
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
function addBreakRow(outVal="",inVal=""){
  const row=document.createElement("div");
  row.className="breakRow";
  const out=document.createElement("input");
  out.type="time";out.value=outVal;out.setAttribute("aria-label","Início do intervalo");
  const inn=document.createElement("input");
  inn.type="time";inn.value=inVal;inn.setAttribute("aria-label","Fim do intervalo");
  const del=document.createElement("button");
  del.type="button";del.className="smallBtn";del.textContent="✕";
  del.setAttribute("aria-label","Remover intervalo");
  del.onclick=()=>{row.remove();updateDaySummary()};
  out.addEventListener("input",updateDaySummary);
  inn.addEventListener("input",updateDaySummary);
  row.append(out,inn,del);
  $("breaksList").appendChild(row);
}
function collectBreaks(){
  const breaks=[];
  for(const row of $("breaksList").children){
    const inputs=row.querySelectorAll("input");
    if(inputs.length<2)continue;
    const out=inputs[0].value, inn=inputs[1].value;
    if(out||inn)breaks.push({out,in:inn});
  }
  return breaks;
}
function openDay(key){
  selectedKey=key;
  const {y,m,d}=parseKey(key);
  const data=dayData(key)||{};
  $("editorDate").textContent=new Date(y,m,d).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"});
  $("timeIn").value=data.in||"";
  $("timeOut").value=data.out||"";
  $("breaksList").innerHTML="";
  const breaks=dayBreaks(data);
  if(breaks.length)breaks.forEach(b=>addBreakRow(b.out||"",b.in||""));
  else addBreakRow();
  $("dayNote").value=data.note||"";
  $("dayEditor").classList.remove("hidden");
  updateDaySummary();
  $("dayEditor").scrollIntoView({behavior:"smooth",block:"nearest"});
}
function updateDaySummary(){
  const data={in:$("timeIn").value,out:$("timeOut").value,breaks:collectBreaks()};
  const c=calcDay(data);
  const br=c.break?` · intervalo ${fmtHours(c.break/60)}`:"";
  const extra=c.overtime?` · Extra: ${fmtHours(c.overtime)}`:"";
  const night=c.night?` · 🌙 Noturno: ${fmtHours(c.night)}`:"";
  const nd=c.nightDay?" · 1 dia noturno":"";
  $("daySummary").textContent=c.worked?`⏱️ Trabalhado: ${fmtHours(c.hours)}${br}${extra}${night}${nd}`:"Preencha entrada e saída para calcular.";
}
function saveCurrentDay(){
  if(!selectedKey)return;
  const breaks=collectBreaks();
  // lunchOut/lunchIn espelham o primeiro intervalo, para versões antigas
  // do app continuarem lendo o dia de forma aproximada.
  const data={in:$("timeIn").value,out:$("timeOut").value,breaks,lunchOut:breaks[0]?.out||"",lunchIn:breaks[0]?.in||"",note:$("dayNote").value.trim()};
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
function snapshotFor(bases,key){
  try{return JSON.parse(localStorage.getItem(bases.months+"-"+key)||"null")}catch(e){return null}
}
function monthlySnapshot(key){return snapshotFor(ACTIVE_BASES,key)}
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
function bonusMonths(){
  const s=Number($("bonusSummerMonth")?.value||7);
  const w=Number($("bonusWinterMonth")?.value||12);
  return [s,w];
}
function bonusForMonth(date=viewDate){
  // O bônus é variável: 2 parcelas ao ano (verão e inverno), cada uma com
  // valor próprio preenchido à mão. Só entra no bruto do mês em que cai.
  const m=date.getMonth()+1;
  const [s,w]=bonusMonths();
  let total=0;
  if(m===s)total+=val("summerBonus");
  if(m===w)total+=val("winterBonus");
  return total;
}
function currentCalculatedValues(){
  const rate=hourlyRate();
  const normal=mode==="monthly"?val("monthlySalary"):rate*val("normalHours");
  const overtime=rate*1.25*val("overtimeHours");
  const night=rate*(val("nightPercent")/100)*val("nightHours")+val("nightFixed")*val("nightDays");
  const meal=val("mealMonthly");
  const bonus=bonusForMonth();
  const gross=normal+overtime+night+meal+val("otherAllowance")+bonus;
  const d=deductionValues(gross);
  return {gross,net:gross-d.total,mandatory:d.mandatory,otherDeductions:d.other,deductions:d.total,bonus};
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
// Estatísticas de um mês para um funcionário qualquer (usado no painel
// do casal). As horas vêm dos dias dele; bruto/líquido vêm do snapshot
// salvo ou de uma estimativa com as configurações salvas dele.
function storedNum(prefix,id){
  const raw=String(localStorage.getItem(prefix+id)??"").trim();
  if(id==="overtimeHours"&&/h/i.test(raw)){
    const m=raw.match(/^(\d+)h(?:\s*(\d+)min)?$/i);
    if(m)return Number(m[1])+(Number(m[2]||0)/60);
  }
  const n=Number(raw||0);
  return Number.isFinite(n)?n:0;
}
function estimateFor(emp,agg,date){
  const p=employeeBases(emp).settings;
  const modeE=localStorage.getItem(p+"mode")==="monthly"?"monthly":"hourly";
  const rate=modeE==="monthly"
    ? storedNum(p,"monthlySalary")/Math.max(1,storedNum(p,"baseHours"))
    : storedNum(p,"hourlyRate");
  const normal=modeE==="monthly"?storedNum(p,"monthlySalary"):rate*agg.normal;
  const overtime=rate*1.25*agg.overtime;
  const night=rate*(storedNum(p,"nightPercent")/100)*agg.night+storedNum(p,"nightFixed")*agg.nightDays;
  const sm=Number(localStorage.getItem(p+"bonusSummerMonth")||7);
  const wm=Number(localStorage.getItem(p+"bonusWinterMonth")||12);
  let bonus=0;
  const mm=date.getMonth()+1;
  if(mm===sm)bonus+=storedNum(p,"summerBonus");
  if(mm===wm)bonus+=storedNum(p,"winterBonus");
  const gross=normal+overtime+night+storedNum(p,"mealMonthly")+storedNum(p,"otherAllowance")+bonus;
  if(gross<=0)return null;
  let deductions;
  if(localStorage.getItem(p+"deductionMode")==="detailed"){
    deductions=storedNum(p,"employmentInsurance")+storedNum(p,"incomeTax")+storedNum(p,"advanceSalary")+storedNum(p,"utilities")+storedNum(p,"rentDeduction")+storedNum(p,"otherDeduction");
  }else{
    deductions=gross*(storedNum(p,"deduction")/100);
  }
  return {gross,net:gross-deductions,fromMonthly:modeE==="monthly"};
}
function monthStatsFor(emp,key){
  const bases=employeeBases(emp);
  const [y,m]=key.split("-").map(Number);
  const count=new Date(y,m,0).getDate();
  let hours=0,normal=0,overtime=0,night=0,nightDays=0,days=0;
  for(let d=1;d<=count;d++){
    const data=dayDataFor(bases,`${key}-${String(d).padStart(2,"0")}`);
    if(!data)continue;
    const c=calcDay(data);
    if(!c.worked)continue;
    days++; hours+=c.hours; normal+=c.normal; overtime+=c.overtime; night+=c.night;
    if(c.nightDay)nightDays++;
  }
  let gross=null,net=null;
  const snap=snapshotFor(bases,key);
  if(snap){gross=snap.gross??null;net=snap.net??null;}
  else{
    const est=estimateFor(emp,{normal,overtime,night,nightDays},new Date(y,m-1,1));
    if(est&&(days>0||est.fromMonthly)){gross=est.gross;net=est.net;}
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
    return `<div class="barItem" data-month="${x.key}" title="Ver os dias deste mês">
      <div class="barValue">${display}</div>
      <div class="barTrack"><div class="barFill" style="height:${h}%"></div></div>
      <div class="barLabel">${x.label}</div>
      <div class="barChange">${change}</div>
    </div>`;
  }).join("");
  return `<div class="chartBox"><h4>${title}</h4><div class="bars">${bars}</div></div>`;
}
function openMonth(key){
  // Toque num mês dos gráficos: o calendário e o histórico de jornada
  // passam a mostrar esse mês (dias, entrada/saída e intervalos).
  const [y,m]=key.split("-").map(Number);
  viewDate=new Date(y,m-1,1);
  renderCalendar();
  renderDashboard();
  $("calendarGrid").scrollIntoView({behavior:"smooth",block:"start"});
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
    label:labels[i],value:x[field],key:x.key,
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
    <div class="dashboardNote">Mostrando os últimos 6 meses até <strong>${monthName(monthlyKey())}</strong>. As horas e dias vêm do calendário. Bruto e líquido usam o valor salvo em cada mês; no mês selecionado, se ainda não houver histórico salvo, o painel usa o cálculo atual da calculadora. <strong>Toque em um mês em qualquer gráfico</strong> para abrir os dias dele no controle de jornada (entrada, saída e intervalos).</div>`;
  dash.querySelectorAll("[data-month]").forEach(el=>{
    el.onclick=()=>openMonth(el.dataset.month);
  });
  renderCouple();
}
function renderPairChart(title,labels,series,format){
  const all=series.flatMap(s=>s.values).filter(v=>typeof v==="number");
  const max=Math.max(...all,1);
  const groups=labels.map((lab,i)=>{
    const cols=series.map(s=>{
      const v=s.values[i];
      const h=v==null?0:Math.max(5,(v/max)*100);
      return `<div class="pairCol"><div class="barValue">${metricValue(v,format)}</div><div class="pairTrack"><div class="pairFill" style="height:${h}%;background:${s.color}"></div></div></div>`;
    }).join("");
    return `<div class="barItem" data-month="${series[0].keys[i]}" title="Ver os dias deste mês"><div class="pairWrap">${cols}</div><div class="barLabel">${lab}</div></div>`;
  }).join("");
  const legend=series.map(s=>`<span class="legendItem"><span class="dot" style="background:${s.color}"></span>${esc(s.name)}</span>`).join("");
  return `<div class="chartBox"><h4>${title}</h4><div class="legend">${legend}</div><div class="bars">${groups}</div></div>`;
}
function renderCouple(){
  const box=$("coupleDashboard");
  if(!box)return;
  const months=[];
  for(let i=5;i>=0;i--){
    const d=new Date(viewDate.getFullYear(),viewDate.getMonth()-i,1);
    months.push(monthlyKey(d));
  }
  const labels=months.map(monthName);
  const perEmp=employees.map(emp=>({
    emp,
    stats:months.map(k=>emp.id===activeEmployee.id?monthStats(k):monthStatsFor(emp,k))
  }));
  const sel=perEmp.map(({emp,stats})=>({emp,s:stats[stats.length-1]}));
  const totalNet=sel.reduce((a,{s})=>a+(s.net||0),0);
  const missing=sel.filter(({s})=>s.net==null).map(({emp})=>emp.name);
  const cards=sel.map(({emp,s})=>`<div class="metricCard">
      <div class="metricTitle"><span class="dot" style="background:${emp.color}"></span> ${esc(emp.name)}${emp.id===activeEmployee.id?" (ativo)":""}</div>
      <strong>${s.net==null?"—":money(s.net)}</strong>
      <span>bruto ${s.gross==null?"—":money(s.gross)} · ${s.days} dia(s) no mês</span>
    </div>`).join("");
  const series=field=>perEmp.map(({emp,stats})=>({
    name:emp.name,color:emp.color,values:stats.map(s=>s[field]),keys:months
  }));
  const manage=employees.map(e=>`<div class="empRow">
      <span class="dot" style="background:${e.color}"></span>
      <strong>${esc(e.name)}</strong>${e.id===activeEmployee.id?'<span class="empBadge">ativo</span>':""}
      <span class="empBtns"><button type="button" class="smallBtn" data-act="rename" data-id="${e.id}">Renomear</button>${e.id!=="principal"?`<button type="button" class="smallBtn" data-act="delete" data-id="${e.id}">Excluir</button>`:""}</span>
    </div>`).join("");
  box.innerHTML=`
    <div class="sectionHead dashboardHead">
      <div><h2>👥 Funcionários — visão do casal</h2><p>Líquido de cada funcionário no mês selecionado e o total dos dois juntos.</p></div>
    </div>
    <div class="metricGrid">
      ${cards}
      <div class="metricCard totalCard">
        <div class="metricTitle">💑 Total do casal — ${monthName(monthlyKey())}</div>
        <strong>${money(totalNet)}</strong>
        <span>${missing.length?"sem dados de "+missing.map(esc).join(", "):"soma dos líquidos do mês selecionado"}</span>
      </div>
    </div>
    ${renderPairChart("💴 Bruto por mês",labels,series("gross"),"money")}
    ${renderPairChart("💰 Líquido por mês",labels,series("net"),"money")}
    <div class="dashboardNote">Últimos 6 meses até <strong>${monthName(monthlyKey())}</strong>, cada funcionário na sua cor. Meses passados usam o valor salvo ao tocar em <strong>Calcular</strong>; sem valor salvo, o painel estima pelas configurações e dias de cada funcionário. Toque num mês para abrir os dias do funcionário ativo.</div>
    <h4 class="empManageTitle">⚙️ Gerenciar funcionários</h4>
    ${manage}
    <button id="addEmployee" type="button" class="smallBtn">＋ Adicionar funcionário</button>`;
  box.querySelectorAll("[data-month]").forEach(el=>{
    el.onclick=()=>openMonth(el.dataset.month);
  });
  box.querySelectorAll("[data-act]").forEach(btn=>{
    btn.onclick=()=>{
      if(btn.dataset.act==="rename")renameEmployee(btn.dataset.id);
      else deleteEmployee(btn.dataset.id);
    };
  });
  const add=$("addEmployee");
  if(add)add.onclick=addEmployee;
}
function renderEmployeeSelect(){
  const sel=$("employeeSelect");
  if(!sel)return;
  sel.innerHTML=employees.map(e=>`<option value="${e.id}"${e.id===activeEmployee.id?" selected":""}>${esc(e.name)}</option>`).join("");
}
function setActiveEmployee(id){
  if(!employees.some(e=>e.id===id))return;
  localStorage.setItem(ACTIVE_EMPLOYEE_KEY,id);
  location.reload();
}
function addEmployee(){
  const name=(prompt("Nome do funcionário:")||"").trim();
  if(!name)return;
  const id="f"+Date.now().toString(36);
  employees.push({id,name,color:EMPLOYEE_COLORS[employees.length%EMPLOYEE_COLORS.length]});
  saveEmployees();
  renderEmployeeSelect();
  renderDashboard();
}
function renameEmployee(id){
  const emp=employees.find(e=>e.id===id);
  if(!emp)return;
  const name=(prompt("Novo nome:",emp.name)||"").trim();
  if(!name)return;
  emp.name=name;
  saveEmployees();
  renderEmployeeSelect();
  renderDashboard();
}
function deleteEmployee(id){
  const emp=employees.find(e=>e.id===id);
  if(!emp)return;
  if(emp.id==="principal"){alert("O funcionário principal não pode ser excluído.");return;}
  if(emp.id===activeEmployee.id){alert("Troque o funcionário ativo antes de excluir este.");return;}
  if(!confirm(`Excluir ${emp.name} e todos os dados dele(a)? Não tem volta — exporte um backup antes, se precisar.`))return;
  const bases=employeeBases(emp);
  const prefixes=[bases.settings,bases.days+"-",bases.months+"-"];
  const doomed=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&prefixes.some(p=>k.startsWith(p)))doomed.push(k);
  }
  doomed.forEach(k=>localStorage.removeItem(k));
  employees.splice(employees.findIndex(e=>e.id===id),1);
  saveEmployees();
  renderEmployeeSelect();
  renderDashboard();
}
function calculate(saveSnapshot=false){
  const rate=hourlyRate();
  const normal=mode==="monthly"?val("monthlySalary"):rate*val("normalHours");
  const overtime=rate*1.25*val("overtimeHours");
  const night=rate*(val("nightPercent")/100)*val("nightHours")+val("nightFixed")*val("nightDays");
  const meal=val("mealMonthly");
  const bonus=bonusForMonth();
  const gross=normal+overtime+night+meal+val("otherAllowance")+bonus;
  const d=deductionValues(gross);
  const net=gross-d.total;
  $("bonusOut").textContent=money(bonus);
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
      gross,net,bonus,mandatoryDeductions:d.mandatory,otherDeductions:d.other,deductions:d.total,updatedAt:Date.now(),
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
  localStorage.setItem(SETTINGS_PREFIX+"mode",mode);
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===btn));
  $("hourlyBox").classList.toggle("hidden",mode!=="hourly");
  $("monthlyBox").classList.toggle("hidden",mode!=="monthly");
  calculate();
});
$("deductionMode").onchange=()=>{
  $("detailedDeductions").classList.toggle("hidden",$("deductionMode").value!=="detailed");
  calculate();
};
// Configurações da calculadora salvas por funcionário. Para o
// funcionário principal o prefixo é o histórico "msj-", então os
// valores já salvos (bônus etc.) continuam valendo sem migração.
const SETTINGS_FIELDS=["hourlyRate","monthlySalary","baseHours","nightPercent","nightFixed","mealMonthly","otherAllowance","summerBonus","winterBonus","deduction","employmentInsurance","incomeTax","advanceSalary","utilities","rentDeduction","otherDeduction"];
SETTINGS_FIELDS.forEach(id=>{
  const el=$(id); if(!el)return;
  const saved=localStorage.getItem(SETTINGS_PREFIX+id);
  if(saved!=null)el.value=saved;
  el.addEventListener("input",()=>localStorage.setItem(SETTINGS_PREFIX+id,el.value));
});
["bonusSummerMonth","bonusWinterMonth"].forEach(id=>{
  const el=$(id); if(!el)return;
  const saved=localStorage.getItem(SETTINGS_PREFIX+id);
  if(saved)el.value=saved;
  el.onchange=()=>{localStorage.setItem(SETTINGS_PREFIX+id,el.value);calculate()};
});
(()=>{
  const el=$("deductionMode");
  if(el){
    const saved=localStorage.getItem(SETTINGS_PREFIX+"deductionMode");
    if(saved)el.value=saved;
    $("detailedDeductions").classList.toggle("hidden",el.value!=="detailed");
    el.addEventListener("change",()=>localStorage.setItem(SETTINGS_PREFIX+"deductionMode",el.value));
  }
  const savedMode=localStorage.getItem(SETTINGS_PREFIX+"mode");
  if(savedMode==="monthly"||savedMode==="hourly"){
    mode=savedMode;
    document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.mode===mode));
    $("hourlyBox").classList.toggle("hidden",mode!=="hourly");
    $("monthlyBox").classList.toggle("hidden",mode!=="monthly");
  }
})();
$("calcBtn").onclick=()=>calculate(true);
document.querySelectorAll("input").forEach(i=>i.addEventListener("input",()=>{if(i.closest(".card")&&i.id!=="dayNote")calculate();if(i.id.startsWith("time"))updateDaySummary()}));
$("addBreak").onclick=()=>addBreakRow();
$("prevMonth").onclick=()=>{viewDate.setMonth(viewDate.getMonth()-1);renderCalendar();renderDashboard()};
$("nextMonth").onclick=()=>{viewDate.setMonth(viewDate.getMonth()+1);renderCalendar();renderDashboard()};
$("saveDay").onclick=saveCurrentDay;
$("deleteDay").onclick=()=>{
  if(selectedKey&&dayData(selectedKey)){deleteData(selectedKey);renderCalendar();renderDashboard();openDay(selectedKey)}
};
$("closeEditor").onclick=()=>{$("dayEditor").classList.add("hidden");selectedKey=null};
renderEmployeeSelect();
$("employeeSelect").onchange=e=>setActiveEmployee(e.target.value);
$("exportBackup").onclick=exportBackup;
$("importBackup").onclick=()=>$("importFile").click();
$("importFile").addEventListener("change",e=>{
  const f=e.target.files&&e.target.files[0];
  if(f)importBackupFile(f);
  e.target.value="";
});
$("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("msj-theme",document.body.classList.contains("dark")?"dark":"light")};
if(localStorage.getItem("msj-theme")==="dark")document.body.classList.add("dark");
calculate();renderCalendar();renderDashboard();

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
