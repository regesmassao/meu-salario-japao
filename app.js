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
  $("monthLabel").textContent=viewDate.toLocaleDateString(currentLang,{month:"long",year:"numeric"});
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
  $("editorDate").textContent=new Date(y,m,d).toLocaleDateString(currentLang,{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"});
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
  const br=c.break?` · ${t("break")} ${fmtHours(c.break/60)}`:"";
  const extra=c.overtime?` · ${t("extra")}: ${fmtHours(c.overtime)}`:"";
  const night=c.night?` · 🌙 ${t("nights")}: ${fmtHours(c.night)}`:"";
  const nd=c.nightDay?" · 1 dia noturno":"";
  $("daySummary").textContent=c.worked?`⏱️ ${t("worked")}: ${fmtHours(c.hours)}${br}${extra}${night}${nd}`:t("fillTimes");
}
function saveCurrentDay(){
  if(!selectedKey)return;
  const data={in:$("timeIn").value,lunchOut:$("lunchOut").value,lunchIn:$("lunchIn").value,out:$("timeOut").value,note:$("dayNote").value.trim()};
  if(!data.in||!data.out){alert(t("needTimes"));return}
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
  if(!days)h.innerHTML=`<div class="empty">${t("empty")}</div>`;
  $("monthTotals").textContent=`${days} ${t("days")} · ${fmtHours(total)} · ${t("normal")}: ${fmtHours(normalTotal)} · ${t("extra")}: ${fmtHours(overtimeTotal)} · ${t("nights")}: ${fmtHours(nightTotal)} · ${t("nightDays")}: ${nightDays}`;
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


// ===== V4.3 — Idiomas e configurações =====
var currentLang=localStorage.getItem("msj-language")||"pt-BR";
const I18N={
"pt-BR":{title:"Meu Salário Japão 🇯🇵",subtitle:"Calculadora e controle de jornada",settings:"⚙️ Configurações",language:"🌐 Idioma",note:"O idioma é salvo neste aparelho. Novos idiomas podem ser adicionados sem alterar seus registros.",calc:"💴 Calculadora salarial",hourlyTab:"💴 Por hora",monthlyTab:"👔 Mensal / Seishain",hourlyRate:"Valor por hora (¥)",monthlySalary:"Salário mensal (¥)",baseHours:"Horas-base / mês",normalHours:"Horas normais",overtimeHours:"Horas extras (25%)",nightPercent:"Adicional noturno (%)",nightHours:"Horas noturnas",nightFixed:"Adicional noturno por dia (¥)",nightDays:"Dias de trabalho noturno",mealMonthly:"Refeição / benefício mensal (¥)",otherAllowance:"Outros adicionais (¥)",annualBonus:"Bônus anual (¥)",deduction:"Descontos estimados (%)",gross:"Bruto mensal",deductions:"Descontos estimados",net:"Líquido estimado",rateOut:"Hora-base calculada",calculate:"Calcular",journey:"📅 Controle de Jornada",journeyDesc:"Registre entrada, intervalo e saída de cada dia.",history:"📋 Histórico do mês",entry:"Entrada",lunchOut:"Saída para almoço",lunchIn:"Retorno do almoço",exit:"Saída",noteLabel:"Observação (opcional)",notePlaceholder:"Ex.: turno noturno",save:"💾 Salvar dia",delete:"🗑️ Excluir",needTimes:"Informe pelo menos a entrada e a saída.",empty:"Nenhum dia registrado neste mês.",footer:"Meu Salário Japão 🇯🇵 — V4.3",close:"Fechar",theme:"Alternar tema",days:"dia(s)",normal:"Normais",extra:"Extras",nights:"Noturnas",nightDays:"Dias noturnos",week:["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],worked:"Trabalhado",break:"intervalo",nightDay:"dia noturno",fillTimes:"Preencha entrada e saída para calcular."},
"ja-JP":{title:"日本給与 🇯🇵",subtitle:"給与計算と勤務時間管理",settings:"⚙️ 設定",language:"🌐 言語",note:"言語設定はこの端末に保存されます。記録データは変更されません。",calc:"💴 給与計算",hourlyTab:"💴 時給",monthlyTab:"👔 月給 / 正社員",hourlyRate:"時給 (¥)",monthlySalary:"月給 (¥)",baseHours:"月の基準時間",normalHours:"通常勤務時間",overtimeHours:"残業時間 (25%)",nightPercent:"深夜割増 (%)",nightHours:"深夜勤務時間",nightFixed:"深夜勤務日額 (¥)",nightDays:"深夜勤務日数",mealMonthly:"食事 / 月額手当 (¥)",otherAllowance:"その他手当 (¥)",annualBonus:"年間賞与 (¥)",deduction:"推定控除率 (%)",gross:"月額総支給",deductions:"推定控除額",net:"推定手取り",rateOut:"計算時給",calculate:"計算する",journey:"📅 勤務時間管理",journeyDesc:"毎日の出勤、休憩、退勤を記録します。",history:"📋 月間履歴",entry:"出勤",lunchOut:"昼休み開始",lunchIn:"昼休み終了",exit:"退勤",noteLabel:"メモ (任意)",notePlaceholder:"例：夜勤",save:"💾 保存",delete:"🗑️ 削除",needTimes:"出勤と退勤の時間を入力してください。",empty:"この月の記録はありません。",footer:"日本給与 🇯🇵 — V4.3",close:"閉じる",theme:"テーマ切替",days:"日",normal:"通常",extra:"残業",nights:"深夜",nightDays:"深夜日数",week:["日","月","火","水","木","金","土"],worked:"勤務",break:"休憩",nightDay:"深夜日",fillTimes:"出勤と退勤を入力すると計算できます。"},
"en-US":{title:"Japan Salary 🇯🇵",subtitle:"Salary calculator and work-time tracker",settings:"⚙️ Settings",language:"🌐 Language",note:"Your language is saved on this device. Your records are not changed.",calc:"💴 Salary Calculator",hourlyTab:"💴 Hourly",monthlyTab:"👔 Monthly / Seishain",hourlyRate:"Hourly rate (¥)",monthlySalary:"Monthly salary (¥)",baseHours:"Base hours / month",normalHours:"Regular hours",overtimeHours:"Overtime (25%)",nightPercent:"Night premium (%)",nightHours:"Night hours",nightFixed:"Night-work allowance per day (¥)",nightDays:"Night-work days",mealMonthly:"Meal / monthly benefit (¥)",otherAllowance:"Other allowances (¥)",annualBonus:"Annual bonus (¥)",deduction:"Estimated deductions (%)",gross:"Monthly gross",deductions:"Estimated deductions",net:"Estimated net",rateOut:"Calculated base hourly rate",calculate:"Calculate",journey:"📅 Work Time Tracker",journeyDesc:"Record start, break and end time for each day.",history:"📋 Monthly History",entry:"Start",lunchOut:"Lunch break start",lunchIn:"Lunch break end",exit:"End",noteLabel:"Note (optional)",notePlaceholder:"e.g. night shift",save:"💾 Save day",delete:"🗑️ Delete",needTimes:"Please enter at least the start and end times.",empty:"No days recorded this month.",footer:"Japan Salary 🇯🇵 — V4.3",close:"Close",theme:"Toggle theme",days:"day(s)",normal:"Regular",extra:"Overtime",nights:"Night",nightDays:"Night days",week:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],worked:"Worked",break:"break",nightDay:"night day",fillTimes:"Enter start and end times to calculate."}
};
function t(k){return (I18N[currentLang]&&I18N[currentLang][k])||I18N["pt-BR"][k]||k}
function setLabel(id,key){const el=$(id);if(!el)return;const text=el.firstChild;if(text&&text.nodeType===3)text.nodeValue=t(key);else el.childNodes[0].textContent=t(key)}
function applyLanguage(){
 const x=I18N[currentLang]||I18N["pt-BR"]; document.documentElement.lang=currentLang;
 document.title=x.title;
 const h1=document.querySelector(".top h1"), sub=document.querySelector(".top p"); if(h1)h1.textContent=x.title;if(sub)sub.textContent=x.subtitle;
 $("settingsTitle").textContent=x.settings;$("languageLabel").childNodes[0].nodeValue=x.language+"\n      ";$("settingsNote").textContent=x.note;
 const h2s=document.querySelectorAll("main .card h2"); if(h2s[0])h2s[0].textContent=x.calc;if(h2s[1])h2s[1].textContent=x.journey;
 document.querySelector('[data-mode="hourly"]').textContent=x.hourlyTab;document.querySelector('[data-mode="monthly"]').textContent=x.monthlyTab;
 const labels={hourlyRate:"hourlyRate",monthlySalary:"monthlySalary",baseHours:"baseHours",normalHours:"normalHours",overtimeHours:"overtimeHours",nightPercent:"nightPercent",nightHours:"nightHours",nightFixed:"nightFixed",nightDays:"nightDays",mealMonthly:"mealMonthly",otherAllowance:"otherAllowance",annualBonus:"annualBonus",deduction:"deduction",timeIn:"entry",lunchOut:"lunchOut",lunchIn:"lunchIn",timeOut:"exit",dayNote:"noteLabel"};Object.entries(labels).forEach(([id,key])=>setLabel(id,key));
 $("dayNote").placeholder=t("notePlaceholder");$("calcBtn").textContent=t("calculate");$("saveDay").textContent=t("save");$("deleteDay").textContent=t("delete");$("history").querySelector(".empty")?.replaceChildren(document.createTextNode(t("empty")));
 const rh=document.querySelector(".historyHead h3");if(rh)rh.textContent=t("history");const jp=document.querySelector(".sectionHead p");if(jp)jp.textContent=x.journeyDesc;document.querySelector("footer").textContent=x.footer;
 $("themeBtn").setAttribute("aria-label",x.theme);$("settingsBtn").setAttribute("aria-label",x.settings);$("closeSettings").setAttribute("aria-label",x.close);
 ["languageSelect"].forEach(id=>$(id).value=currentLang);
 const week=document.querySelectorAll(".week span"); if(week.length===7)week.forEach((el,i)=>el.textContent=x.week[i]);
 renderCalendar();
}
$("settingsBtn").onclick=()=>$("settingsModal").classList.remove("hidden");
$("closeSettings").onclick=()=>$("settingsModal").classList.add("hidden");
$("settingsModal").addEventListener("click",e=>{if(e.target.id==="settingsModal")$("settingsModal").classList.add("hidden")});
$("languageSelect").onchange=e=>{currentLang=e.target.value; if(!I18N[currentLang]){currentLang="pt-BR";e.target.value=currentLang;alert("Este idioma será adicionado em uma próxima versão.")} localStorage.setItem("msj-language",currentLang);applyLanguage()};
applyLanguage();
