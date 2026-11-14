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
// ---------- Yukiu (férias remuneradas) ----------
// O total de dias é cadastrado por funcionário (configuração
// "yukiuTotal"). No editor do dia, o campo yukiu guarda 1 (dia
// inteiro) ou 0,5 (meio dia). O saldo é calculado a partir dos
// dias salvos: total cadastrado − soma dos yukiu marcados.
// Apagar ou desmarcar o dia devolve o saldo automaticamente.
function yukiuUsedFor(bases){
  const prefix=bases.days+"-";
  let used=0;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k||!k.startsWith(prefix))continue;
    try{
      const d=JSON.parse(localStorage.getItem(k)||"null");
      if(d)used+=Number(d.yukiu)||0;
    }catch(e){}
  }
  return used;
}
function fmtDays(n){
  const r=Math.round(n*10)/10;
  return Number.isInteger(r)?String(r):String(r).replace(".",",");
}
function renderYukiu(){
  const el=$("yukiuStatus");
  if(!el)return;
  const total=val("yukiuTotal");
  if(total<=0){
    el.textContent="🏖️ Cadastre acima o total de dias de yukiu deste funcionário para acompanhar o saldo.";
    return;
  }
  const used=yukiuUsedFor(ACTIVE_BASES);
  el.textContent=`🏖️ Yukiu: usados ${fmtDays(used)} · restam ${fmtDays(total-used)} de ${fmtDays(total)} dia(s)`;
}
// ---------- Navegação por abas (V5.0) ----------
// O app é dividido em 5 telas (inicio, calculadora, jornada, casal,
// ajustes); a barra inferior troca a tela visível e a última tela
// aberta é lembrada para a próxima visita.
const SCREEN_KEY="msj-screen";
const SCREEN_NAMES=["inicio","calculadora","jornada","casal","ajustes"];
function showScreen(name){
  if(!SCREEN_NAMES.includes(name))name="inicio";
  document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.dataset.screen===name));
  document.querySelectorAll(".navTab").forEach(b=>b.classList.toggle("active",b.dataset.screen===name));
  localStorage.setItem(SCREEN_KEY,name);
  window.scrollTo(0,0);
}
// ---------- Tela Início ----------
// Resumo do mês exibido (mesmo mês do calendário): líquido em
// destaque, bruto/dias/horas/extras, saldo de yukiu e — no cartão
// preenchido por renderCouple — o total do casal.
function renderHome(){
  if(!$("homeNet"))return;
  const s=monthStats(monthlyKey());
  const prev=monthStats(monthlyKey(new Date(viewDate.getFullYear(),viewDate.getMonth()-1,1)));
  $("homeMonth").textContent=viewDate.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
  $("homeNet").textContent=s.net==null?"—":money(s.net);
  $("homeNetChange").textContent=(s.net!=null&&prev.net!=null)?`${changeText(s.net,prev.net)} vs. mês anterior`:"";
  $("homeGross").textContent=s.gross==null?"—":money(s.gross);
  $("homeDays").textContent=String(s.days);
  $("homeHours").textContent=fmtHours(s.hours);
  $("homeOvertime").textContent=fmtHours(s.overtime);
  const total=val("yukiuTotal");
  const used=yukiuUsedFor(ACTIVE_BASES);
  $("homeYukiuLeft").textContent=total>0?fmtDays(total-used):"—";
  $("homeYukiuText").textContent=total>0
    ? `${fmtDays(used)} usado(s) de ${fmtDays(total)} dia(s) cadastrados`
    : "Cadastre o total de dias de yukiu na aba Jornada.";
  $("homeYukiuBar").style.width=total>0?`${Math.min(100,(used/total)*100)}%`:"0%";
  renderPunch();
  renderBackupReminder();
}
// ---------- Registro rápido de hoje (V5.1) ----------
// Horário padrão por funcionário (entrada, saída e intervalos),
// salvo nas chaves stdIn/stdOut/stdBreaks do prefixo do funcionário
// e editado na aba Jornada. Com ele definido, o botão da tela
// Início lança o dia de hoje com um toque, sem abrir o editor.
function loadStd(){
  try{
    const breaks=JSON.parse(localStorage.getItem(SETTINGS_PREFIX+"stdBreaks")||"[]");
    return {
      in:localStorage.getItem(SETTINGS_PREFIX+"stdIn")||"",
      out:localStorage.getItem(SETTINGS_PREFIX+"stdOut")||"",
      breaks:Array.isArray(breaks)?breaks:[]
    };
  }catch(e){ return {in:"",out:"",breaks:[]}; }
}
function todayKey(){
  const n=new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}
// ---------- Ponto eletrônico (V5.2) ----------
// Entrada e saída registradas pelo relógio do aparelho (que fica
// sincronizado pela rede), com um toque na tela Início. Os
// intervalos são os fixos do horário padrão: entram sozinhos no
// registro e são descontados no cálculo. Depois de fechado, o dia
// pode ser editado normalmente no editor da Jornada.
function rawDay(key){
  // Registro bruto do dia, mesmo incompleto (ex.: entrada batida
  // e saída ainda em aberto) — dayData() só enxerga dias fechados.
  try{return JSON.parse(localStorage.getItem(STORAGE+"-"+key)||"null")}catch(e){return null}
}
function keyDaysAgo(n){
  const d=new Date();
  d.setDate(d.getDate()-n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function nowTime(){
  const n=new Date();
  return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
}
function openEntry(){
  // Dia com entrada batida e saída em aberto (hoje, ou ontem no
  // caso de virada de turno): é esse dia que a saída vai fechar.
  for(const key of [todayKey(),keyDaysAgo(1)]){
    const rec=rawDay(key);
    if(rec&&rec.in&&!rec.out&&!(Number(rec.yukiu||0)>0))return {key,rec};
  }
  return null;
}
function renderPunch(){
  const btn=$("punchBtn"),std=$("punchStd"),st=$("punchStatus");
  if(!btn||!st)return;
  if(std)std.classList.add("hidden");
  const open=openEntry();
  if(open){
    btn.textContent=`🔴 Registrar saída · agora ${nowTime()}`;
    st.textContent=open.key===todayKey()
      ? `🟢 Entrada registrada às ${open.rec.in} — você está trabalhando. Os intervalos do padrão entram sozinhos quando você bater a saída.`
      : `🟢 Entrada de ontem às ${open.rec.in} ainda em aberto — bata a saída pra fechar aquele dia.`;
    return;
  }
  const d=dayData(todayKey());
  if(d&&Number(d.yukiu||0)>0){
    btn.textContent="✏️ Hoje é yukiu — tocar pra ver";
    st.textContent=`Yukiu de ${fmtDays(Number(d.yukiu))} dia já lançado hoje.`;
    return;
  }
  if(d){
    const c=calcDay(d);
    btn.textContent="✏️ Hoje fechado — tocar pra editar";
    st.textContent=`✔️ ${d.in} → ${d.out} · ${fmtHours(c.hours)} trabalhadas${c.overtime?` · ${fmtHours(c.overtime)} de hora extra`:""}.`;
    return;
  }
  const stdCfg=loadStd();
  btn.textContent=`🟢 Registrar entrada · agora ${nowTime()}`;
  st.textContent="Toque ao chegar: a entrada fica gravada com a hora do relógio e os intervalos do padrão entram automaticamente.";
  if(std&&stdCfg.in&&stdCfg.out)std.classList.remove("hidden");
}
function punchIn(){
  const key=todayKey();
  if(rawDay(key))return;
  const std=loadStd();
  localStorage.setItem(STORAGE+"-"+key,JSON.stringify({
    in:nowTime(),
    out:"",
    breaks:std.breaks,
    lunchOut:std.breaks.length?std.breaks[0].out:"",
    lunchIn:std.breaks.length?std.breaks[0].in:"",
    note:"",
    yukiu:0
  }));
  renderCalendar();
  renderDashboard();
  renderPunch();
}
function punchOut(){
  const open=openEntry();
  if(!open)return;
  const rec=open.rec;
  rec.out=nowTime();
  // Intervalo do padrão que só começaria depois da saída não
  // aconteceu (ex.: saiu mais cedo) — fica fora do dia fechado.
  const start=timeMinutes(rec.in),out=timeMinutes(rec.out);
  if(start!=null&&out!=null){
    const span=duration(start,out);
    rec.breaks=dayBreaks(rec).filter(b=>{
      const bOut=timeMinutes(b.out);
      return bOut!=null&&duration(start,bOut)<span;
    });
    rec.lunchOut=rec.breaks.length?rec.breaks[0].out:"";
    rec.lunchIn=rec.breaks.length?rec.breaks[0].in:"";
  }
  localStorage.setItem(STORAGE+"-"+open.key,JSON.stringify(rec));
  renderCalendar();
  renderDashboard();
  renderPunch();
}
function punchMain(){
  if(openEntry()){punchOut();return;}
  const key=todayKey();
  if(dayData(key)){
    // Dia já fechado (ou yukiu): abre no editor pra ajustar.
    const now=new Date();
    viewDate=new Date(now.getFullYear(),now.getMonth(),1);
    renderCalendar();
    renderDashboard();
    showScreen("jornada");
    openDay(key);
    return;
  }
  punchIn();
}
function quickToday(){
  const key=todayKey();
  const now=new Date();
  const std=loadStd();
  // Já registrado (fechado ou com o ponto em aberto), ou ainda sem
  // horário padrão: abre o dia no editor — nunca sobrescreve.
  if(dayData(key)||rawDay(key)||!std.in||!std.out){
    viewDate=new Date(now.getFullYear(),now.getMonth(),1);
    renderCalendar();
    renderDashboard();
    showScreen("jornada");
    openDay(key);
    return;
  }
  localStorage.setItem(STORAGE+"-"+key,JSON.stringify({
    in:std.in,
    out:std.out,
    breaks:std.breaks,
    lunchOut:std.breaks.length?std.breaks[0].out:"",
    lunchIn:std.breaks.length?std.breaks[0].in:"",
    note:""
  }));
  renderCalendar();
  renderDashboard();
  renderPunch();
}
// Editor do horário padrão (aba Jornada): mesmos cartões de
// intervalo do editor do dia; salva automaticamente a cada mudança.
function addStdBreakRow(out="",inn=""){
  const row=document.createElement("div");
  row.className="breakRow";
  row.innerHTML=`<input type="time" class="stdBreakOut" value="${out}" aria-label="Saída para o intervalo">
    <input type="time" class="stdBreakIn" value="${inn}" aria-label="Retorno do intervalo">
    <button type="button" class="smallBtn" aria-label="Remover intervalo">✕</button>`;
  row.querySelector("button").onclick=()=>{row.remove();saveStdSchedule();};
  row.querySelectorAll("input").forEach(i=>i.addEventListener("change",saveStdSchedule));
  $("stdBreaksList").appendChild(row);
}
function saveStdSchedule(){
  localStorage.setItem(SETTINGS_PREFIX+"stdIn",$("stdIn").value||"");
  localStorage.setItem(SETTINGS_PREFIX+"stdOut",$("stdOut").value||"");
  const breaks=[];
  document.querySelectorAll("#stdBreaksList .breakRow").forEach(r=>{
    const o=r.querySelector(".stdBreakOut").value;
    const i=r.querySelector(".stdBreakIn").value;
    if(o&&i)breaks.push({out:o,in:i});
  });
  localStorage.setItem(SETTINGS_PREFIX+"stdBreaks",JSON.stringify(breaks));
  renderPunch();
}
function loadStdScheduleUI(){
  const std=loadStd();
  if($("stdIn"))$("stdIn").value=std.in;
  if($("stdOut"))$("stdOut").value=std.out;
  if($("stdBreaksList")){
    $("stdBreaksList").innerHTML="";
    std.breaks.forEach(b=>addStdBreakRow(b.out,b.in));
  }
}
// ---------- Lembrete de backup (V5.3) ----------
// Os dados vivem só no aparelho: se passar de 30 dias do último
// backup exportado (ou se nunca houve um, já existindo dias
// registrados), a tela Início mostra um alerta e a tela Ajustes
// mostra a data do último backup.
const BACKUP_REMINDER_DAYS=30;
function lastBackupAt(){
  const t=Number(localStorage.getItem("msj-lastBackupAt")||0);
  return t>0?t:null;
}
function backupAgeDays(){
  const t=lastBackupAt();
  if(!t)return null;
  return Math.floor((Date.now()-t)/86400000);
}
function totalDayRecords(){
  let n=0;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.includes("-days-"))n++;
  }
  return n;
}
function renderBackupReminder(){
  const t=lastBackupAt();
  const age=backupAgeDays();
  const when=t?new Date(t).toLocaleDateString("pt-BR"):"";
  const line=$("backupReminder");
  if(line){
    if(!t)line.textContent="⚠️ Você ainda não exportou nenhum backup. Seus registros ficam só neste aparelho — exporte um arquivo e guarde em local seguro.";
    else if(age>=BACKUP_REMINDER_DAYS)line.textContent=`⚠️ Último backup em ${when} — já faz ${age} dia(s). Exporte um novo pra manter seus registros protegidos.`;
    else line.textContent=`✔️ Último backup em ${when} (há ${age} dia(s)). Tudo certo por aqui.`;
  }
  const alertBox=$("homeBackupAlert");
  if(alertBox){
    const overdue=totalDayRecords()>0&&(!t||age>=BACKUP_REMINDER_DAYS);
    alertBox.classList.toggle("hidden",!overdue);
    if(overdue){
      $("homeBackupText").textContent=!t
        ? "Você tem dias registrados e ainda não exportou nenhum backup. Se o aparelho der problema, o histórico se perde."
        : `Faz ${age} dia(s) que você não exporta um backup (último em ${when}). Toque no botão pra exportar e manter o histórico protegido.`;
    }
  }
}
// ---------- Resumo anual (V5.3) ----------
// Totais do ano por funcionário (bruto, líquido, dias, horas,
// extras e yukiu), somando os 12 meses com as mesmas regras do
// painel mensal. Pensado pra declaração de fim de ano.
let annualYear=new Date().getFullYear();
function yukiuInYear(bases,year){
  let total=0;
  const prefix=bases.days+"-"+year+"-";
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k||!k.startsWith(prefix))continue;
    try{
      const d=JSON.parse(localStorage.getItem(k)||"null");
      if(d)total+=Number(d.yukiu)||0;
    }catch(e){}
  }
  return total;
}
function renderAnnual(){
  const box=$("annualSummary");
  if(!box)return;
  $("annualYearLabel").textContent=String(annualYear);
  let totGross=0,totNet=0,anyGross=false,anyNet=false;
  const blocks=employees.map(emp=>{
    const bases=employeeBases(emp);
    let gross=0,net=0,days=0,hours=0,overtime=0,hasGross=false,hasNet=false;
    for(let m=1;m<=12;m++){
      const s=monthStatsFor(emp,`${annualYear}-${String(m).padStart(2,"0")}`);
      days+=s.days;hours+=s.hours;overtime+=s.overtime;
      if(s.gross!=null){gross+=s.gross;hasGross=true;}
      if(s.net!=null){net+=s.net;hasNet=true;}
    }
    if(hasGross){totGross+=gross;anyGross=true;}
    if(hasNet){totNet+=net;anyNet=true;}
    const yk=yukiuInYear(bases,annualYear);
    return `<div class="annualEmp">
      <div class="annualEmpHead"><span class="dot" style="background:${emp.color}"></span><strong>${esc(emp.name)}</strong></div>
      <div class="metricGrid">
        <div class="metricCard"><div class="metricTitle">💴 Bruto no ano</div><strong>${hasGross?money(gross):"—"}</strong></div>
        <div class="metricCard"><div class="metricTitle">💰 Líquido no ano</div><strong>${hasNet?money(net):"—"}</strong></div>
        <div class="metricCard"><div class="metricTitle">📅 Dias trabalhados</div><strong>${days}</strong></div>
        <div class="metricCard"><div class="metricTitle">⏱️ Horas</div><strong>${fmtHours(hours)}</strong></div>
        <div class="metricCard"><div class="metricTitle">➕ Extras</div><strong>${fmtHours(overtime)}</strong></div>
        <div class="metricCard"><div class="metricTitle">🏖️ Yukiu usado</div><strong>${fmtDays(yk)} dia(s)</strong></div>
      </div>
    </div>`;
  }).join("");
  const couple=employees.length>1
    ? `<div class="metricCard totalCard annualTotal"><div class="metricTitle">💑 Total do casal em ${annualYear} (líquido)</div><strong>${anyNet?money(totNet):"—"}</strong><span>Bruto somado: ${anyGross?money(totGross):"—"}</span></div>`
    : "";
  box.innerHTML=blocks+couple+`<p class="dashboardNote">Bruto e líquido somam o valor salvo de cada mês (ou a estimativa das configurações, quando o mês ainda não foi salvo na calculadora). Dias, horas e yukiu vêm dos dias registrados no calendário.</p>`;
}
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
  // A data do backup fica salva ANTES de montar o arquivo: assim
  // ela viaja dentro do próprio backup e é restaurada na importação.
  localStorage.setItem("msj-lastBackupAt",String(Date.now()));
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
  renderBackupReminder();
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
// ---------- Juntar backup de outro celular (V5.4) ----------
// Cada celular guarda os dados de quem usa. Este recurso incorpora
// o backup de OUTRO aparelho sem apagar nada do atual: os dias de
// cada funcionário do arquivo entram no funcionário de MESMO NOME
// deste aparelho (criado se ainda não existir), remapeando os
// prefixos — no celular da outra pessoa, ela é a funcionária
// principal; aqui, os dias dela vão para o prefixo próprio dela.
const MERGE_SETTING_FIELDS=["hourlyRate","monthlySalary","baseHours","nightPercent","nightFixed","mealMonthly","otherAllowance","summerBonus","winterBonus","deduction","employmentInsurance","incomeTax","advanceSalary","utilities","rentDeduction","otherDeduction","yukiuTotal","offHours","offPercent","mode","deductionMode","bonusSummerMonth","bonusWinterMonth","stdIn","stdOut","stdBreaks"];
function mergeNormName(s){return String(s||"").trim().toLocaleLowerCase("pt-BR")}
function planMerge(backup){
  if(!backup||typeof backup!=="object"||!backup.data||typeof backup.data!=="object")throw new Error("invalid backup");
  const data=backup.data;
  let srcList=null;
  try{
    const l=JSON.parse(data[EMPLOYEES_KEY]||"null");
    if(Array.isArray(l)&&l.length&&l.every(e=>e&&e.id&&e.name))srcList=l;
  }catch(e){}
  if(!srcList)srcList=[{id:"principal",name:"Reges",color:EMPLOYEE_COLORS[0]}];
  const plan=[];
  for(const emp of srcList){
    const bases=employeeBases(emp);
    const days=Object.keys(data).filter(k=>k.startsWith(bases.days+"-"));
    const months=Object.keys(data).filter(k=>k.startsWith(bases.months+"-"));
    const hasSettings=MERGE_SETTING_FIELDS.some(f=>data[bases.settings+f]!=null);
    if(days.length||months.length||hasSettings)plan.push({emp,bases,days,months});
  }
  return plan;
}
function applyMerge(backup){
  const data=backup.data;
  const plan=planMerge(backup);
  let created=0,totalDays=0;
  for(const item of plan){
    let target=employees.find(e=>mergeNormName(e.name)===mergeNormName(item.emp.name));
    if(!target){
      target={id:"f"+Date.now().toString(36)+"m"+created,name:item.emp.name,color:EMPLOYEE_COLORS[employees.length%EMPLOYEE_COLORS.length]};
      employees.push(target);
      created++;
    }
    const tb=employeeBases(target);
    item.days.forEach(k=>localStorage.setItem(tb.days+k.slice(item.bases.days.length),String(data[k])));
    item.months.forEach(k=>localStorage.setItem(tb.months+k.slice(item.bases.months.length),String(data[k])));
    MERGE_SETTING_FIELDS.forEach(f=>{
      const v=data[item.bases.settings+f];
      if(v!=null)localStorage.setItem(tb.settings+f,String(v));
    });
    totalDays+=item.days.length;
  }
  if(created)saveEmployees();
  return {totalDays,created};
}
function importMergeFile(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const backup=JSON.parse(String(reader.result||""));
      const plan=planMerge(backup);
      if(!plan.length){alert("Este arquivo não tem dados de funcionário para juntar.");return;}
      const when=backup.exportedAt?new Date(backup.exportedAt).toLocaleDateString("pt-BR"):"data desconhecida";
      const desc=plan.map(p=>{
        const found=employees.some(e=>mergeNormName(e.name)===mergeNormName(p.emp.name));
        return `• ${p.emp.name}: ${p.days.length} dia(s)`+(found?"":" (novo — será criado)");
      }).join("\n");
      if(!confirm(`Juntar o backup de ${when} com os dados deste aparelho?\n\n${desc}\n\nOs dias entram no funcionário de mesmo nome. Se o mesmo dia existir nos dois aparelhos, vale a cópia do arquivo. Nenhum dado atual é apagado.`))return;
      const res=applyMerge(backup);
      $("backupStatus").textContent=`Backup juntado com sucesso: ${res.totalDays} dia(s) incorporados. Recarregando o app…`;
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
  if(start==null||out==null)return {hours:0,worked:0,break:0,normal:0,overtime:0,night:0,nightDay:false,off:0,offRate:null};
  const total=duration(start,out);
  const end=start+total; // pode passar de 1440 (turno que vira a noite)
  let breakM=0;
  let nightM=nightOverlap(start,out);
  for(const b of dayBreaks(data)){
    const bOut=timeMinutes(b.out), bIn=timeMinutes(b.in);
    if(bOut==null||bIn==null)continue;
    // V5.5.1: só desconta a parte do intervalo que cai DENTRO do
    // horário do dia. Intervalo que começa depois da saída (ex.:
    // intervalos de hora extra do padrão, num dia sem hora extra)
    // não desconta nada; o que passa da saída desconta só até ela.
    const bStart=start+duration(start,bOut);
    const bEnd=bStart+duration(bOut,bIn);
    const segStart=Math.max(bStart,start), segEnd=Math.min(bEnd,end);
    if(segEnd<=segStart)continue;
    breakM+=segEnd-segStart;
    nightM-=nightOverlap(segStart%1440,segEnd%1440);
  }
  const worked=Math.max(0,total-breakM);
  nightM=Math.max(0,nightM);
  // Folga trabalhada (V5.5): se o dia tem "off" (0, 25 ou 35), TODAS
  // as horas do dia são pagas com esse adicional — não há divisão
  // entre horas normais e extras. O adicional noturno continua
  // contado à parte (na lei, ele soma: folga +35% e noturno +25%).
  const offRate=(typeof data.off==="number"&&Number.isFinite(data.off))?data.off:null;
  if(offRate!=null&&worked>0){
    return {hours:worked/60,worked,break:breakM,normal:0,overtime:0,night:nightM/60,nightDay:nightM>0,off:worked/60,offRate};
  }
  return {hours:worked/60,worked,break:breakM,normal:Math.min(worked,480)/60,overtime:Math.max(0,worked-480)/60,night:nightM/60,nightDay:nightM>0,off:0,offRate:null};
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
    else{const r=rawDay(key);if(r&&r.in)b.classList.add("hasData")}
    if(data&&Number(data.yukiu)>0)b.classList.add("yukiuDay");
    if(data&&typeof data.off==="number")b.classList.add("offDay");
    b.onclick=()=>openDay(key);
    grid.appendChild(b);
  }
  renderHistory();
  renderYukiu();
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
  const data=dayData(key)||rawDay(key)||{};
  $("editorDate").textContent=new Date(y,m,d).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"});
  $("timeIn").value=data.in||"";
  $("timeOut").value=data.out||"";
  $("dayYukiu").value=String(Number(data.yukiu)||0);
  $("dayOff").value=(typeof data.off==="number")?String(data.off):"";
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
  const offSel=$("dayOff")?.value;
  const data={in:$("timeIn").value,out:$("timeOut").value,breaks:collectBreaks(),off:(offSel===""||offSel==null)?undefined:Number(offSel)};
  const c=calcDay(data);
  const yk=Number($("dayYukiu")?.value||0);
  const ykLabel=yk===0.5?"meio dia":"dia inteiro";
  if(!c.worked&&yk){
    $("daySummary").textContent=`🏖️ Dia de yukiu (${ykLabel}) — será descontado do saldo ao salvar. Não precisa preencher entrada e saída.`;
    return;
  }
  const br=c.break?` · intervalo ${fmtHours(c.break/60)}`:"";
  const extra=c.overtime?` · Extra: ${fmtHours(c.overtime)}`:"";
  const offText=c.off?` · 💪 Folga trabalhada (+${c.offRate}% o dia todo)`:"";
  const night=c.night?` · 🌙 Noturno: ${fmtHours(c.night)}`:"";
  const nd=c.nightDay?" · 1 dia noturno":"";
  const ykText=yk?` · 🏖️ Yukiu: ${ykLabel}`:"";
  $("daySummary").textContent=c.worked?`⏱️ Trabalhado: ${fmtHours(c.hours)}${br}${extra}${offText}${night}${nd}${ykText}`:"Preencha entrada e saída para calcular.";
}
function saveCurrentDay(){
  if(!selectedKey)return;
  const breaks=collectBreaks();
  // lunchOut/lunchIn espelham o primeiro intervalo, para versões antigas
  // do app continuarem lendo o dia de forma aproximada.
  const yukiu=Number($("dayYukiu")?.value||0);
  const data={in:$("timeIn").value,out:$("timeOut").value,breaks,lunchOut:breaks[0]?.out||"",lunchIn:breaks[0]?.in||"",note:$("dayNote").value.trim(),yukiu};
  const offSel=$("dayOff")?.value;
  if(offSel!==""&&offSel!=null)data.off=Number(offSel);
  if(!yukiu&&(!data.in||!data.out)){alert("Informe pelo menos a entrada e a saída.");return}
  saveData(selectedKey,data);
  renderCalendar();
  renderDashboard();
  openDay(selectedKey);
}
function renderHistory(){
  const y=viewDate.getFullYear(),m=viewDate.getMonth(),count=new Date(y,m+1,0).getDate();
  const h=$("history");h.innerHTML="";
  let total=0,normalTotal=0,overtimeTotal=0,nightTotal=0,nightDays=0,days=0,rows=0,yukiuMonth=0,offTotal=0,offWeighted=0;
  for(let d=1;d<=count;d++){
    const key=keyFor(y,m,d),data=dayData(key);
    if(!data)continue;
    const c=calcDay(data);
    const yk=Number(data.yukiu)||0;
    if(!c.worked&&!yk)continue;
    yukiuMonth+=yk;
    if(c.worked){days++;total+=c.hours;normalTotal+=c.normal;overtimeTotal+=c.overtime;nightTotal+=c.night;if(c.nightDay)nightDays++;offTotal+=c.off;offWeighted+=c.off*(1+(c.offRate||0)/100);}
    rows++;
    const row=document.createElement("div");row.className="row";
    const date=document.createElement("div");date.textContent=String(d).padStart(2,"0")+"/"+String(m+1).padStart(2,"0");
    const times=document.createElement("div");
    const offBadge=typeof data.off==="number"?(data.off===0?" · 💪 folga (como dia normal)":` · 💪 folga +${data.off}%`):"";
    if(c.worked)times.textContent=`${data.in} → ${data.out}${offBadge}${yk?" · 🏖️ yukiu ("+(yk===0.5?"meio dia":"dia inteiro")+")":""}${data.note?" · "+data.note:""}`;
    else times.textContent=`🏖️ Yukiu (${yk===0.5?"meio dia":"dia inteiro"})${data.note?" · "+data.note:""}`;
    const hours=document.createElement("div");hours.className="hours";hours.textContent=c.worked?fmtHours(c.hours):"🏖️";
    row.append(date,times,hours);row.onclick=()=>openDay(key);row.style.cursor="pointer";h.appendChild(row);
  }
  if(!rows)h.innerHTML='<div class="empty">Nenhum dia registrado neste mês.</div>';
  const ykMonthText=yukiuMonth?` · 🏖️ Yukiu no mês: ${fmtDays(yukiuMonth)} dia(s)`:"";
  const offMonthText=offTotal?` · 💪 Folga: ${fmtHours(offTotal)}`:"";
  $("monthTotals").textContent=`${days} dia(s) · ${fmtHours(total)} · Normais: ${fmtHours(normalTotal)} · Extras: ${fmtHours(overtimeTotal)}${offMonthText} · Noturnas: ${fmtHours(nightTotal)} · Dias noturnos: ${nightDays}${ykMonthText}`;
  $("normalHours").value=normalTotal.toFixed(2);
  $("overtimeHours").value=fmtHoursShort(overtimeTotal);
  $("nightHours").value=nightTotal.toFixed(2);
  $("nightDays").value=String(nightDays);
  // Folga: o campo da calculadora guarda as horas já convertidas
  // pelo adicional de cada dia, divididas pelo adicional configurado
  // — assim o valor final sai exato mesmo com taxas diferentes.
  $("offHours").value=offWeighted>0?(offWeighted/(1+val("offPercent")/100)).toFixed(2):"0";
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
  const off=rate*(1+val("offPercent")/100)*val("offHours");
  const night=rate*(val("nightPercent")/100)*val("nightHours")+val("nightFixed")*val("nightDays");
  const meal=val("mealMonthly");
  const bonus=bonusForMonth();
  const gross=normal+overtime+off+night+meal+val("otherAllowance")+bonus;
  const d=deductionValues(gross);
  return {gross,net:gross-d.total,mandatory:d.mandatory,otherDeductions:d.other,deductions:d.total,bonus,off};
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
  const overtime=rate*1.25*agg.overtime+(rate*(agg.offWeighted||0));
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
  let hours=0,normal=0,overtime=0,night=0,nightDays=0,days=0,offWeighted=0;
  for(let d=1;d<=count;d++){
    const data=dayDataFor(bases,`${key}-${String(d).padStart(2,"0")}`);
    if(!data)continue;
    const c=calcDay(data);
    if(!c.worked)continue;
    days++; hours+=c.hours; normal+=c.normal; overtime+=c.overtime; night+=c.night;
    offWeighted+=c.off*(1+(c.offRate||0)/100);
    if(c.nightDay)nightDays++;
  }
  let gross=null,net=null;
  const snap=snapshotFor(bases,key);
  if(snap){gross=snap.gross??null;net=snap.net??null;}
  else{
    const est=estimateFor(emp,{normal,overtime,night,nightDays,offWeighted},new Date(y,m-1,1));
    if(est&&(days>0||est.fromMonthly)){gross=est.gross;net=est.net;}
  }
  return {key,days,hours,overtime,night,nightDays,gross,net,offWeighted};
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
  showScreen("jornada");
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
  renderAnnual();
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
  const manage=employeeManageHTML();
  const hc=$("homeCouple");
  if(hc){
    hc.innerHTML=`
      <div class="metricTitle">💑 Total do casal — ${monthName(monthlyKey())}</div>
      <strong class="homeCoupleValue">${money(totalNet)}</strong>
      <span>${sel.map(({emp,s})=>`${esc(emp.name)} ${s.net==null?"—":money(s.net)}`).join(" + ")}</span>`;
  }
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
    ${manage}`;
  box.querySelectorAll("[data-month]").forEach(el=>{
    el.onclick=()=>openMonth(el.dataset.month);
  });
  wireEmployeeManage(box);
}
function employeeManageHTML(){
  // Lista de funcionários com Renomear/Excluir + botão Adicionar.
  // Usada na aba Casal e nos Ajustes (V5.4.1). O botão de adicionar
  // NÃO tem id fixo (usa data-act) pra não duplicar id entre telas.
  const rows=employees.map(e=>`<div class="empRow">
      <span class="dot" style="background:${e.color}"></span>
      <strong>${esc(e.name)}</strong>${e.id===activeEmployee.id?'<span class="empBadge">ativo</span>':""}
      <span class="empBtns"><button type="button" class="smallBtn" data-act="rename" data-id="${e.id}">Renomear</button>${e.id!=="principal"?`<button type="button" class="smallBtn" data-act="delete" data-id="${e.id}">Excluir</button>`:""}</span>
    </div>`).join("");
  return rows+`<button type="button" class="smallBtn" data-act="add">＋ Adicionar funcionário</button>`;
}
function wireEmployeeManage(root){
  if(!root||!root.querySelectorAll)return;
  root.querySelectorAll("[data-act]").forEach(btn=>{
    btn.onclick=()=>{
      if(btn.dataset.act==="rename")renameEmployee(btn.dataset.id);
      else if(btn.dataset.act==="delete")deleteEmployee(btn.dataset.id);
      else if(btn.dataset.act==="add")addEmployee();
    };
  });
}
function renderEmployeeManage(){
  const box=$("employeeManage");
  if(!box)return;
  box.innerHTML=employeeManageHTML();
  wireEmployeeManage(box);
}
function renderEmployeeSelect(){
  const sel=$("employeeSelect");
  if(!sel)return;
  sel.innerHTML=employees.map(e=>`<option value="${e.id}"${e.id===activeEmployee.id?" selected":""}>${esc(e.name)}</option>`).join("");
  const chip=$("empChipName");
  if(chip)chip.textContent=activeEmployee.name;
  renderEmployeeManage();
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
  const off=rate*(1+val("offPercent")/100)*val("offHours");
  const night=rate*(val("nightPercent")/100)*val("nightHours")+val("nightFixed")*val("nightDays");
  const meal=val("mealMonthly");
  const bonus=bonusForMonth();
  const gross=normal+overtime+off+night+meal+val("otherAllowance")+bonus;
  const d=deductionValues(gross);
  const net=gross-d.total;
  $("offOut").textContent=money(off);
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
      offHours:val("offHours"),
      offPercent:val("offPercent"),
      nightHours:val("nightHours"),
      nightDays:val("nightDays")
    });
    renderDashboard();
  }
  renderHome();
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
const SETTINGS_FIELDS=["hourlyRate","monthlySalary","baseHours","nightPercent","nightFixed","mealMonthly","otherAllowance","summerBonus","winterBonus","deduction","employmentInsurance","incomeTax","advanceSalary","utilities","rentDeduction","otherDeduction","yukiuTotal","offHours","offPercent"];
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
$("dayYukiu").onchange=updateDaySummary;
$("dayOff").onchange=updateDaySummary;
$("yukiuTotal").addEventListener("input",renderYukiu);
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
$("mergeBackup").onclick=()=>$("mergeFile").click();
$("mergeFile").addEventListener("change",e=>{
  const f=e.target.files&&e.target.files[0];
  if(f)importMergeFile(f);
  e.target.value="";
});
$("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("msj-theme",document.body.classList.contains("dark")?"dark":"light")};
if(localStorage.getItem("msj-theme")==="dark")document.body.classList.add("dark");
document.querySelectorAll(".navTab").forEach(b=>b.onclick=()=>showScreen(b.dataset.screen));
$("empChip").onclick=()=>showScreen("ajustes");
$("punchBtn").onclick=punchMain;
$("punchStd").onclick=quickToday;
$("homeBackupBtn").onclick=()=>showScreen("ajustes");
$("prevYear").onclick=()=>{annualYear--;renderAnnual();};
$("nextYear").onclick=()=>{annualYear++;renderAnnual();};
let lastPunchMinute=-1;
setInterval(()=>{
  const clock=$("punchClock");
  const n=new Date();
  if(clock)clock.textContent=`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}`;
  if(n.getMinutes()!==lastPunchMinute){lastPunchMinute=n.getMinutes();renderPunch();}
},1000);
$("addStdBreak").onclick=()=>addStdBreakRow();
$("stdIn").addEventListener("change",saveStdSchedule);
$("stdOut").addEventListener("change",saveStdSchedule);
loadStdScheduleUI();
showScreen(localStorage.getItem(SCREEN_KEY)||"inicio");
calculate();renderCalendar();renderDashboard();

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").then(r=>r.update()).catch(()=>{}));
