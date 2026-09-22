const KEY="meu-salario-japao-v3";
const initial={month:new Date().toISOString().slice(0,7),salary:{base:250000,normal:160,ot:25,night:25,nightFixed:1500,benefits:0,deductions:0},days:{},expenses:[],name:""};
let data=JSON.parse(localStorage.getItem(KEY)||"null")||initial;
let viewMonth=data.month;

const yen=n=>new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0}).format(Math.round(n||0));
const save=()=>{localStorage.setItem(KEY,JSON.stringify(data));render();};
const daysInMonth=(ym)=>{const [y,m]=ym.split("-").map(Number);return new Date(y,m,0).getDate()};
const dateKey=(d)=>`${viewMonth}-${String(d).padStart(2,"0")}`;

function calcDay(x){
  if(!x||x.status!=="worked") return {hours:0,ot:0,night:0};
  const h=Math.max(0,Number(x.hours)||0), normal=Number(data.salary.normal)||160;
  return {hours:h,ot:Math.max(0,h-8),night:Number(x.night)||0};
}
function calc(){
  let hours=0,ot=0,night=0,nightDays=0;
  Object.entries(data.days).forEach(([k,x])=>{if(k.startsWith(viewMonth)){let c=calcDay(x);hours+=c.hours;ot+=c.ot;night+=c.night;if(c.night>0)nightDays++}});
  const hourly=(Number(data.salary.base)||0)/(Number(data.salary.normal)||160);
  const gross=(Number(data.salary.base)||0)+(hourly*(Number(data.salary.ot)||0)/100*ot)+(hourly*(Number(data.salary.night)||0)/100*night)+nightDays*(Number(data.salary.nightFixed)||0)+(Number(data.salary.benefits)||0);
  const exp=data.expenses.reduce((s,e)=>s+(Number(e.amount)||0),0);
  const net=gross-(Number(data.salary.deductions)||0);
  return {hours,ot,night,nightDays,gross,net,available:net-exp,exp};
}
function render(){
  document.getElementById("monthTitle").textContent=new Date(viewMonth+"-01T12:00:00").toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
  const c=calc();
  gross.textContent=yen(c.gross);overtime.textContent=c.ot.toFixed(1)+"h";net.textContent=yen(c.net);available.textContent=yen(c.available);
  limitText.textContent=c.ot.toFixed(1)+"h / 45h";
  renderDays();renderExpenses();
  baseSalary.value=data.salary.base;normalHours.value=data.salary.normal;otRate.value=data.salary.ot;nightRate.value=data.salary.night;nightFixed.value=data.salary.nightFixed;benefits.value=data.salary.benefits;deductions.value=data.salary.deductions;userName.value=data.name||"";
}
function renderDays(){
  const el=document.getElementById("days");el.innerHTML="";
  for(let d=1;d<=daysInMonth(viewMonth);d++){
    const k=dateKey(d),x=data.days[k]||{status:"worked",start:"08:00",end:"17:00",break:1,hours:8,night:0};
    const date=new Date(k+"T12:00:00"),wd=date.toLocaleDateString("pt-BR",{weekday:"short"});
    const div=document.createElement("div");div.className="day";
    div.innerHTML=`<div class="dayhead"><span class="daydate">${String(d).padStart(2,"0")} · ${wd}</span><span class="badge">${x.status==="worked"?"Trabalho":x.status==="off"?"Folga":x.status==="yukyu"?"Yūkyū":"Falta"}</span></div>
    <div class="grid">
      <label>Status<select data-k="${k}" data-f="status"><option value="worked">Trabalho</option><option value="off">Folga</option><option value="yukyu">Yūkyū</option><option value="absent">Falta</option></select></label>
      <label>Horas trabalhadas<input data-k="${k}" data-f="hours" type="number" step="0.25" value="${x.hours??8}" inputmode="decimal"></label>
      <label>Entrada<input data-k="${k}" data-f="start" type="time" value="${x.start||"08:00"}"></label>
      <label>Saída<input data-k="${k}" data-f="end" type="time" value="${x.end||"17:00"}"></label>
      <label>Intervalo (h)<input data-k="${k}" data-f="break" type="number" step="0.25" value="${x.break??1}" inputmode="decimal"></label>
      <label>Horas noturnas<input data-k="${k}" data-f="night" type="number" step="0.25" value="${x.night??0}" inputmode="decimal"></label>
    </div>`;
    div.querySelectorAll("input,select").forEach(i=>{i.value=x[i.dataset.f]??i.value;i.addEventListener("change",()=>{data.days[k]=data.days[k]||{};data.days[k][i.dataset.f]=i.type==="number"?Number(i.value):i.value;save()})});
    el.appendChild(div);
  }
}
function renderExpenses(){
  const el=document.getElementById("expensesList");el.innerHTML="";
  if(!data.expenses.length){el.innerHTML='<p class="note">Nenhuma despesa cadastrada.</p>'}
  data.expenses.forEach((e,i)=>{const row=document.createElement("div");row.className="expense";row.innerHTML=`<span>${e.name}<br><small>${yen(e.amount)}</small></span><button>Excluir</button>`;row.querySelector("button").onclick=()=>{data.expenses.splice(i,1);save()};el.appendChild(row)});
  expenseTotal.textContent=yen(calc().exp);
}

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById(b.dataset.tab).classList.add("active")});
prevMonth.onclick=()=>{let d=new Date(viewMonth+"-01T12:00:00");d.setMonth(d.getMonth()-1);viewMonth=d.toISOString().slice(0,7);data.month=viewMonth;render()};
nextMonth.onclick=()=>{let d=new Date(viewMonth+"-01T12:00:00");d.setMonth(d.getMonth()+1);viewMonth=d.toISOString().slice(0,7);data.month=viewMonth;render()};
addDay.onclick=()=>{const n=daysInMonth(viewMonth)+1;alert("Este mês já possui "+n-1+" dias. Edite qualquer dia acima.")};
saveSalary.onclick=()=>{data.salary={base:+baseSalary.value,normal:+normalHours.value,ot:+otRate.value,night:+nightRate.value,nightFixed:+nightFixed.value,benefits:+benefits.value,deductions:+deductions.value};data.name=userName.value;save();alert("Salário salvo!")};
addExpense.onclick=()=>{const name=prompt("Nome da despesa:");if(!name)return;const amount=Number(prompt("Valor em ¥:")||0);if(amount>0){data.expenses.push({name,amount});save()}};
exportBtn.onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="meu-salario-japao-backup.json";a.click();URL.revokeObjectURL(a.href)};
importFile.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);viewMonth=data.month||viewMonth;save();alert("Backup importado!")}catch{alert("Arquivo inválido.")}};r.readAsText(f)};
resetBtn.onclick=()=>{if(confirm("Apagar os dados deste aparelho?")){data=JSON.parse(JSON.stringify(initial));viewMonth=data.month;save()}};
userName.onchange=()=>{data.name=userName.value;save()};
let deferredPrompt;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;installBtn.hidden=false});
installBtn.onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.hidden=true}};
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
render();
