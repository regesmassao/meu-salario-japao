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

// ---------- Idiomas (V5.6) ----------
// O app fala 5 idiomas: português (original), japonês, inglês,
// vietnamita e nepalês — pensado nos colegas estrangeiros das
// fábricas no Japão. O idioma é do APARELHO (chave msj-lang), não
// do funcionário: cada pessoa usa o app no seu celular, no seu
// idioma. Trocar o idioma recarrega o app, como trocar de
// funcionário. Textos que faltarem num idioma caem pro português.
const LANG_KEY="msj-lang";
const LOCALES={pt:"pt-BR",ja:"ja-JP",en:"en-US",vi:"vi-VN",ne:"ne-NP"};
const I18N={
pt:{
appSubtitle:"Calculadora e controle de jornada",
copyrightLine:"© 2026 Reges Massao da Costa — Todos os direitos reservados",
themeToggle:"Alternar tema",
navHome:"Início",navCalc:"Calculadora",navWork:"Jornada",navCouple:"Casal",navSettings:"Ajustes",
homeNetMonth:"Líquido do mês",
punchTitle:"⏰ Ponto de hoje",
punchStdBtn:"Lançar o dia pelo horário padrão",
metricGross:"💴 Bruto",metricDays:"📅 Dias trabalhados",metricHours:"⏱️ Horas",metricOvertime:"➕ Extras",
yukiuTitle:"🏖️ Yukiu",yukiuLeftWord:"restam",
dashTitle:"📈 Evolução mensal",dashSubtitle:"Comparação automática com o mês anterior.",
loadingDash:"Carregando evolução mensal…",
backupNowBtn:"Fazer backup agora",
vsPrevMonth:"vs. mês anterior",
homeYukiuUsedOf:"{used} usado(s) de {total} dia(s) cadastrados",
homeYukiuRegister:"Cadastre o total de dias de yukiu na aba Jornada.",
punchOutBtn:"🔴 Registrar saída · agora {time}",
punchInBtn:"🟢 Registrar entrada · agora {time}",
punchOpenToday:"🟢 Entrada registrada às {time} — você está trabalhando. Os intervalos do padrão entram sozinhos quando você bater a saída.",
punchOpenYesterday:"🟢 Entrada de ontem às {time} ainda em aberto — bata a saída pra fechar aquele dia.",
punchYukiuBtn:"✏️ Hoje é yukiu — tocar pra ver",
punchYukiuStatus:"Yukiu de {days} dia já lançado hoje.",
punchClosedBtn:"✏️ Hoje fechado — tocar pra editar",
punchClosedStatus:"✔️ {in} → {out} · {hours} trabalhadas{ot}.",
punchClosedOt:" · {hours} de hora extra",
punchIdleStatus:"Toque ao chegar: a entrada fica gravada com a hora do relógio e os intervalos do padrão entram automaticamente.",
calcTitle:"💴 Calculadora salarial",
modeHourly:"💴 Por hora",modeMonthly:"👔 Mensal / Seishain",
hourlyRate:"Valor por hora (¥)",monthlySalary:"Salário mensal (¥)",baseHours:"Horas-base / mês",
normalHours:"Horas normais",overtimeHours:"Horas extras (25%)",
offHours:"Horas em folga trabalhada",offPercent:"Adicional da folga — dia todo (%)",
nightPercent:"Adicional noturno (%)",nightHours:"Horas noturnas",
nightFixed:"Adicional noturno por dia (¥)",nightDays:"Dias de trabalho noturno",
mealMonthly:"Refeição / benefício mensal (¥)",otherAllowance:"Outros adicionais (¥)",
summerBonus:"Bônus de verão (¥)",summerBonusMonth:"Bônus de verão cai em",
winterBonus:"Bônus de inverno (¥)",winterBonusMonth:"Bônus de inverno cai em",
deductionMode:"Modo de descontos",dedModePercent:"Estimativa (%)",dedModeDetailed:"Detalhado (¥)",
deductionPct:"Descontos estimados (%)",
detailedTitle:"🧾 Descontos detalhados",detailedHint:"Use esta opção quando quiser reproduzir o holerite real.",
employmentInsurance:"Seguro emprego (¥)",incomeTax:"Imposto de renda (¥)",advanceSalary:"Salário adiantado (¥)",
utilities:"Água / luz / gás (¥)",rentDeduction:"Aluguel (¥)",otherDeduction:"Outros descontos (¥)",
resOff:"Folga trabalhada",resBonus:"Bônus do mês (parcela)",resGross:"Bruto mensal",
resOtherDed:"Outros descontos",resTotalDed:"Total de descontos",resNet:"Líquido estimado",resRate:"Hora-base calculada",
dedMandatory:"Descontos obrigatórios",dedEstimated:"Descontos estimados",
calcBtn:"Calcular",
month1:"janeiro",month2:"fevereiro",month3:"março",month4:"abril",month5:"maio",month6:"junho",month7:"julho",month8:"agosto",month9:"setembro",month10:"outubro",month11:"novembro",month12:"dezembro",
workTitle:"📅 Controle de Jornada",workSubtitle:"Registre entrada, intervalo e saída de cada dia.",
yukiuTotalLabel:"Dias de yukiu cadastrados",
yukiuNote:"Marque o yukiu no editor do dia (toque no dia no calendário): o saldo diminui sozinho. Se apagar ou desmarcar o dia, o saldo volta.",
stdTitle:"⏰ Horário padrão — registro rápido",
labelIn:"Entrada",labelOut:"Saída",
stdBreaksTitle:"Intervalos padrão",addBreakBtn:"+ Adicionar intervalo",
stdNote:"Salvo automaticamente. Estes horários e intervalos entram sozinhos quando você bate o ponto (entrada/saída pelo relógio) ou lança o dia pelo horário padrão na tela Início. Cada funcionário tem o seu.",
wd0:"Dom",wd1:"Seg",wd2:"Ter",wd3:"Qua",wd4:"Qui",wd5:"Sex",wd6:"Sáb",
dayYukiuLabel:"🏖️ Yukiu neste dia",yukiuNo:"Não",yukiuFull:"Dia inteiro",yukiuHalf:"Meio dia",
dayOffLabel:"💪 Tipo do dia",offNormal:"Dia normal",offAsNormal:"Folga trabalhada — paga como dia normal",off25:"Folga trabalhada — +25% o dia todo",off35:"Folga trabalhada — +35% o dia todo",
breaksTitle:"⏸️ Intervalos (kyukei) — não remunerados",
noteLabel:"Observação (opcional)",notePlaceholder:"Ex.: turno noturno",
saveDayBtn:"💾 Salvar dia",deleteBtn:"🗑️ Excluir",
historyTitle:"📋 Histórico do mês",
yukiuRegisterPrompt:"🏖️ Cadastre acima o total de dias de yukiu deste funcionário para acompanhar o saldo.",
yukiuBalance:"🏖️ Yukiu: usados {used} · restam {left} de {total} dia(s)",
ariaBreakStart:"Início do intervalo",ariaBreakEnd:"Fim do intervalo",
ariaBreakStartStd:"Saída para o intervalo",ariaBreakEndStd:"Retorno do intervalo",ariaRemoveBreak:"Remover intervalo",
editorYukiuSummary:"🏖️ Dia de yukiu ({label}) — será descontado do saldo ao salvar. Não precisa preencher entrada e saída.",
halfDay:"meio dia",fullDay:"dia inteiro",
sumWorked:"⏱️ Trabalhado: {hours}",sumBreak:" · intervalo {hours}",sumOvertime:" · Extra: {hours}",
sumOff:" · 💪 Folga trabalhada (+{rate}% o dia todo)",sumNight:" · 🌙 Noturno: {hours}",sumNightDay:" · 1 dia noturno",
sumYukiu:" · 🏖️ Yukiu: {label}",sumFillInOut:"Preencha entrada e saída para calcular.",
alertInOut:"Informe pelo menos a entrada e a saída.",
histEmpty:"Nenhum dia registrado neste mês.",
histOffNormal:" · 💪 folga (como dia normal)",histOffPct:" · 💪 folga +{rate}%",
histYukiu:" · 🏖️ yukiu ({label})",histYukiuOnly:"🏖️ Yukiu ({label})",
totalsLine:"{days} dia(s) · {hours} · Normais: {normal} · Extras: {overtime}{off} · Noturnas: {night} · Dias noturnos: {nightDays}{yukiu}",
totalsOff:" · 💪 Folga: {hours}",totalsYukiu:" · 🏖️ Yukiu no mês: {days} dia(s)",
viewDaysTitle:"Ver os dias deste mês",
metricGrossMonth:"💴 Bruto mensal",metricNetMonth:"💰 Líquido mensal",metricHoursWorked:"⏱️ Horas trabalhadas",
metricOt:"➕ Horas extras",metricNight:"🌙 Horas noturnas",metricDaysWorked:"📅 Dias trabalhados",
chartGross:"💴 Bruto por mês",chartNet:"💰 Líquido por mês",chartHours:"⏱️ Horas trabalhadas por mês",
chartOt:"➕ Horas extras por mês",chartNight:"🌙 Horas noturnas por mês",chartDays:"📅 Dias trabalhados por mês",
dashNote:"Mostrando os últimos 6 meses até <strong>{month}</strong>. As horas e dias vêm do calendário. Bruto e líquido usam o valor salvo em cada mês; no mês selecionado, se ainda não houver histórico salvo, o painel usa o cálculo atual da calculadora. <strong>Toque em um mês em qualquer gráfico</strong> para abrir os dias dele no controle de jornada (entrada, saída e intervalos).",
coupleTitle:"👥 Funcionários — visão do casal",coupleSubtitle:"Líquido de cada funcionário no mês selecionado e o total dos dois juntos.",
empActiveSuffix:" (ativo)",empActiveBadge:"ativo",
coupleCardLine:"bruto {gross} · {days} dia(s) no mês",
coupleTotalTitle:"💑 Total do casal — {month}",
coupleNoData:"sem dados de {names}",coupleSumNote:"soma dos líquidos do mês selecionado",
coupleNote:"Últimos 6 meses até <strong>{month}</strong>, cada funcionário na sua cor. Meses passados usam o valor salvo ao tocar em <strong>Calcular</strong>; sem valor salvo, o painel estima pelas configurações e dias de cada funcionário. Toque num mês para abrir os dias do funcionário ativo.",
manageTitle:"⚙️ Gerenciar funcionários",
btnRename:"Renomear",btnDeleteEmp:"Excluir",btnAddEmp:"＋ Adicionar funcionário",
promptEmpName:"Nome do funcionário:",promptEmpRename:"Novo nome:",
alertPrincipalDelete:"O funcionário principal não pode ser excluído.",
alertActiveDelete:"Troque o funcionário ativo antes de excluir este.",
confirmDeleteEmp:"Excluir {name} e todos os dados dele(a)? Não tem volta — exporte um backup antes, se precisar.",
loadingEmployees:"Carregando funcionários…",
annualTitle:"📆 Resumo anual",annualSubtitle:"Totais do ano por funcionário — útil na declaração de fim de ano.",
annGross:"💴 Bruto no ano",annNet:"💰 Líquido no ano",annDays:"📅 Dias trabalhados",annHours:"⏱️ Horas",annOt:"➕ Extras",annYukiu:"🏖️ Yukiu usado",
annYukiuVal:"{v} dia(s)",
annCoupleTotal:"💑 Total do casal em {year} (líquido)",annCoupleGross:"Bruto somado: {gross}",
annNote:"Bruto e líquido somam o valor salvo de cada mês (ou a estimativa das configurações, quando o mês ainda não foi salvo na calculadora). Dias, horas e yukiu vêm dos dias registrados no calendário.",
activeEmployeeLabel:"👤 Funcionário ativo",
employeeNote:"Tudo o que você preencher — calculadora e controle de jornada — fica salvo para este funcionário. Para lançar os dados da outra pessoa, troque o funcionário aqui.",
langTitle:"🌐 Idioma",langNote:"O idioma escolhido vale só para este aparelho.",langLabel:"Idioma do aplicativo",
backupTitle:"💾 Backup dos dados",
backupDesc:"Seus dias registrados e configurações ficam salvos só neste aparelho. Exporte um arquivo de backup e guarde em local seguro (Arquivos, e-mail ou nuvem). Se um dia precisar, importe o arquivo e tudo volta como estava.",
exportBtn:"⬇️ Exportar backup",importBtn:"⬆️ Importar backup",mergeBtn:"🔀 Juntar backup de outro celular",
backupNoneYet:"⚠️ Você ainda não exportou nenhum backup. Seus registros ficam só neste aparelho — exporte um arquivo e guarde em local seguro.",
backupOld:"⚠️ Último backup em {when} — já faz {age} dia(s). Exporte um novo pra manter seus registros protegidos.",
backupOk:"✔️ Último backup em {when} (há {age} dia(s)). Tudo certo por aqui.",
homeBackupNever:"Você tem dias registrados e ainda não exportou nenhum backup. Se o aparelho der problema, o histórico se perde.",
homeBackupOld:"Faz {age} dia(s) que você não exporta um backup (último em {when}). Toque no botão pra exportar e manter o histórico protegido.",
exportDone:"Backup exportado com {days} dia(s) registrados. Guarde o arquivo em local seguro.",
unknownDate:"data desconhecida",
importConfirm:"Importar o backup de {when}, com {days} dia(s) registrados? Os dados atuais serão substituídos pelos do arquivo.",
importDone:"Backup importado com sucesso. Recarregando o app…",
invalidBackup:"Arquivo de backup inválido. Nada foi alterado.",
mergeNoData:"Este arquivo não tem dados de funcionário para juntar.",
mergeNewTag:" (novo — será criado)",
mergeLine:"• {name}: {days} dia(s){tag}",
mergeConfirm:"Juntar o backup de {when} com os dados deste aparelho?\n\n{desc}\n\nOs dias entram no funcionário de mesmo nome. Se o mesmo dia existir nos dois aparelhos, vale a cópia do arquivo. Nenhum dado atual é apagado.",
mergeDone:"Backup juntado com sucesso: {days} dia(s) incorporados. Recarregando o app…"
},
ja:{
appSubtitle:"給与計算と勤務管理",
copyrightLine:"© 2026 Reges Massao da Costa — 無断転載・複製を禁じます",
themeToggle:"テーマを切り替え",
navHome:"ホーム",navCalc:"給与計算",navWork:"勤務",navCouple:"カップル",navSettings:"設定",
homeNetMonth:"今月の手取り",
punchTitle:"⏰ 今日の打刻",
punchStdBtn:"標準スケジュールで今日を入力",
metricGross:"💴 総支給",metricDays:"📅 出勤日数",metricHours:"⏱️ 時間",metricOvertime:"➕ 残業",
yukiuTitle:"🏖️ 有給",yukiuLeftWord:"残り",
dashTitle:"📈 月ごとの推移",dashSubtitle:"前月と自動で比較します。",
loadingDash:"月ごとの推移を読み込み中…",
backupNowBtn:"今すぐバックアップ",
vsPrevMonth:"・前月比",
homeYukiuUsedOf:"登録 {total} 日のうち {used} 日使用済み",
homeYukiuRegister:"勤務タブで有給の総日数を登録してください。",
punchOutBtn:"🔴 退勤を記録 · 現在 {time}",
punchInBtn:"🟢 出勤を記録 · 現在 {time}",
punchOpenToday:"🟢 {time} に出勤を記録しました — 勤務中です。標準の休憩は退勤を押したときに自動で入ります。",
punchOpenYesterday:"🟢 昨日の {time} の出勤がまだ開いています — 退勤を押してその日を閉じてください。",
punchYukiuBtn:"✏️ 今日は有給 — タップして表示",
punchYukiuStatus:"今日は有給 {days} 日が入力済みです。",
punchClosedBtn:"✏️ 今日は確定済み — タップして編集",
punchClosedStatus:"✔️ {in} → {out} · 勤務 {hours}{ot}。",
punchClosedOt:" · 残業 {hours}",
punchIdleStatus:"到着したらタップ：時計の時刻で出勤が記録され、標準の休憩が自動で入ります。",
calcTitle:"💴 給与計算",
modeHourly:"💴 時給",modeMonthly:"👔 月給 / 正社員",
hourlyRate:"時給 (¥)",monthlySalary:"月給 (¥)",baseHours:"月の基本時間",
normalHours:"通常時間",overtimeHours:"残業時間 (25%)",
offHours:"休日出勤の時間",offPercent:"休日出勤の割増 — 一日分 (%)",
nightPercent:"深夜割増 (%)",nightHours:"深夜時間",
nightFixed:"深夜手当 / 日 (¥)",nightDays:"深夜勤務の日数",
mealMonthly:"食事・手当 / 月 (¥)",otherAllowance:"その他の手当 (¥)",
summerBonus:"夏のボーナス (¥)",summerBonusMonth:"夏のボーナスの月",
winterBonus:"冬のボーナス (¥)",winterBonusMonth:"冬のボーナスの月",
deductionMode:"控除の方式",dedModePercent:"概算 (%)",dedModeDetailed:"詳細 (¥)",
deductionPct:"概算控除 (%)",
detailedTitle:"🧾 詳細な控除",detailedHint:"実際の給与明細を再現したいときに使います。",
employmentInsurance:"雇用保険 (¥)",incomeTax:"所得税 (¥)",advanceSalary:"前払い給与 (¥)",
utilities:"水道・光熱費 (¥)",rentDeduction:"家賃 (¥)",otherDeduction:"その他の控除 (¥)",
resOff:"休日出勤",resBonus:"今月のボーナス",resGross:"月の総支給",
resOtherDed:"その他の控除",resTotalDed:"控除の合計",resNet:"手取り（概算）",resRate:"計算上の時給",
dedMandatory:"必須の控除",dedEstimated:"概算の控除",
calcBtn:"計算する",
month1:"1月",month2:"2月",month3:"3月",month4:"4月",month5:"5月",month6:"6月",month7:"7月",month8:"8月",month9:"9月",month10:"10月",month11:"11月",month12:"12月",
workTitle:"📅 勤務管理",workSubtitle:"毎日の出勤・休憩・退勤を記録します。",
yukiuTotalLabel:"登録した有給の日数",
yukiuNote:"有給はその日の編集画面でマークします（カレンダーの日をタップ）：残高は自動で減ります。日を消すかマークを外すと、残高は戻ります。",
stdTitle:"⏰ 標準スケジュール — クイック入力",
labelIn:"出勤",labelOut:"退勤",
stdBreaksTitle:"標準の休憩",addBreakBtn:"＋ 休憩を追加",
stdNote:"自動で保存されます。この時刻と休憩は、打刻したときや、ホーム画面で標準スケジュール入力をしたときに自動で入ります。従業員ごとに別々です。",
wd0:"日",wd1:"月",wd2:"火",wd3:"水",wd4:"木",wd5:"金",wd6:"土",
dayYukiuLabel:"🏖️ この日の有給",yukiuNo:"なし",yukiuFull:"一日",yukiuHalf:"半日",
dayOffLabel:"💪 日の種類",offNormal:"通常の日",offAsNormal:"休日出勤 — 通常の日として支払い",off25:"休日出勤 — 一日中 +25%",off35:"休日出勤 — 一日中 +35%",
breaksTitle:"⏸️ 休憩（kyukei）— 無給",
noteLabel:"メモ（任意）",notePlaceholder:"例：夜勤",
saveDayBtn:"💾 保存",deleteBtn:"🗑️ 削除",
historyTitle:"📋 今月の履歴",
yukiuRegisterPrompt:"🏖️ 上にこの従業員の有給の総日数を登録すると、残高を確認できます。",
yukiuBalance:"🏖️ 有給：使用 {used} · 残り {left} / {total} 日",
ariaBreakStart:"休憩の開始",ariaBreakEnd:"休憩の終了",
ariaBreakStartStd:"休憩に入る時刻",ariaBreakEndStd:"休憩から戻る時刻",ariaRemoveBreak:"休憩を削除",
editorYukiuSummary:"🏖️ 有給の日（{label}）— 保存すると残高から引かれます。出勤と退勤の入力は不要です。",
halfDay:"半日",fullDay:"一日",
sumWorked:"⏱️ 勤務：{hours}",sumBreak:" · 休憩 {hours}",sumOvertime:" · 残業：{hours}",
sumOff:" · 💪 休日出勤（一日中 +{rate}%)",sumNight:" · 🌙 深夜：{hours}",sumNightDay:" · 深夜勤務 1日",
sumYukiu:" · 🏖️ 有給：{label}",sumFillInOut:"出勤と退勤を入力すると計算します。",
alertInOut:"少なくとも出勤と退勤を入力してください。",
histEmpty:"今月はまだ記録がありません。",
histOffNormal:" · 💪 休日出勤（通常払い）",histOffPct:" · 💪 休日出勤 +{rate}%",
histYukiu:" · 🏖️ 有給（{label}）",histYukiuOnly:"🏖️ 有給（{label}）",
totalsLine:"{days} 日 · {hours} · 通常：{normal} · 残業：{overtime}{off} · 深夜：{night} · 深夜日数：{nightDays}{yukiu}",
totalsOff:" · 💪 休日出勤：{hours}",totalsYukiu:" · 🏖️ 今月の有給：{days} 日",
viewDaysTitle:"この月の日を見る",
metricGrossMonth:"💴 月の総支給",metricNetMonth:"💰 月の手取り",metricHoursWorked:"⏱️ 勤務時間",
metricOt:"➕ 残業時間",metricNight:"🌙 深夜時間",metricDaysWorked:"📅 出勤日数",
chartGross:"💴 月ごとの総支給",chartNet:"💰 月ごとの手取り",chartHours:"⏱️ 月ごとの勤務時間",
chartOt:"➕ 月ごとの残業時間",chartNight:"🌙 月ごとの深夜時間",chartDays:"📅 月ごとの出勤日数",
dashNote:"直近6か月（<strong>{month}</strong>まで）を表示しています。時間と日数はカレンダーから来ています。総支給と手取りは各月に保存された値を使い、選択中の月に保存値がない場合は現在の計算を使います。<strong>グラフの月をタップ</strong>すると、その月の日が勤務管理で開きます。",
coupleTitle:"👥 従業員 — カップル表示",coupleSubtitle:"選択した月の各従業員の手取りと、2人の合計です。",
empActiveSuffix:"（使用中）",empActiveBadge:"使用中",
coupleCardLine:"総支給 {gross} · 今月 {days} 日",
coupleTotalTitle:"💑 カップル合計 — {month}",
coupleNoData:"{names} のデータなし",coupleSumNote:"選択した月の手取りの合計",
coupleNote:"<strong>{month}</strong>までの直近6か月。各従業員の色で表示します。過去の月は<strong>計算する</strong>を押したときに保存された値を使い、保存値がない場合は設定と勤務日から推定します。月をタップすると使用中の従業員の日が開きます。",
manageTitle:"⚙️ 従業員の管理",
btnRename:"名前を変更",btnDeleteEmp:"削除",btnAddEmp:"＋ 従業員を追加",
promptEmpName:"従業員の名前：",promptEmpRename:"新しい名前：",
alertPrincipalDelete:"メインの従業員は削除できません。",
alertActiveDelete:"先に使用中の従業員を切り替えてから削除してください。",
confirmDeleteEmp:"{name} とそのすべてのデータを削除しますか？元に戻せません — 必要なら先にバックアップを書き出してください。",
loadingEmployees:"従業員を読み込み中…",
annualTitle:"📆 年間まとめ",annualSubtitle:"従業員ごとの年間の合計 — 年末調整に便利です。",
annGross:"💴 年間の総支給",annNet:"💰 年間の手取り",annDays:"📅 出勤日数",annHours:"⏱️ 時間",annOt:"➕ 残業",annYukiu:"🏖️ 使用した有給",
annYukiuVal:"{v} 日",
annCoupleTotal:"💑 {year} 年のカップル合計（手取り）",annCoupleGross:"総支給の合計：{gross}",
annNote:"総支給と手取りは、各月に保存された値（まだ保存されていない月は設定からの推定）を合計しています。日数・時間・有給はカレンダーに記録された日から来ています。",
activeEmployeeLabel:"👤 使用中の従業員",
employeeNote:"入力した内容 — 給与計算も勤務管理も — はこの従業員に保存されます。もう一人の分を入力するには、ここで従業員を切り替えてください。",
langTitle:"🌐 言語",langNote:"選んだ言語はこの端末にだけ適用されます。",langLabel:"アプリの言語",
backupTitle:"💾 データのバックアップ",
backupDesc:"記録した日と設定は、この端末の中だけに保存されます。バックアップファイルを書き出して、安全な場所（ファイル、メール、クラウド）に保管してください。必要なときに読み込めば、すべて元に戻ります。",
exportBtn:"⬇️ バックアップを書き出す",importBtn:"⬆️ バックアップを読み込む",mergeBtn:"🔀 別の端末のバックアップを合体",
backupNoneYet:"⚠️ まだバックアップを書き出していません。記録はこの端末の中だけにあります — ファイルを書き出して安全な場所に保管してください。",
backupOld:"⚠️ 最後のバックアップは {when} — {age} 日前です。新しいものを書き出して記録を守りましょう。",
backupOk:"✔️ 最後のバックアップは {when}（{age} 日前）。問題ありません。",
homeBackupNever:"記録した日があるのに、まだバックアップを書き出していません。端末に問題が起きると履歴が失われます。",
homeBackupOld:"バックアップの書き出しから {age} 日経っています（最後は {when}）。ボタンを押して書き出し、履歴を守りましょう。",
exportDone:"バックアップを書き出しました（{days} 日分）。ファイルを安全な場所に保管してください。",
unknownDate:"日付不明",
importConfirm:"{when} のバックアップ（{days} 日分）を読み込みますか？現在のデータはファイルの内容に置き換わります。",
importDone:"バックアップを読み込みました。アプリを再読み込みします…",
invalidBackup:"バックアップファイルが正しくありません。何も変更されていません。",
mergeNoData:"このファイルには合体できる従業員のデータがありません。",
mergeNewTag:"（新規 — 作成されます）",
mergeLine:"• {name}：{days} 日{tag}",
mergeConfirm:"{when} のバックアップをこの端末のデータに合体しますか？\n\n{desc}\n\n日は同名の従業員に入ります。同じ日が両方にある場合はファイル側が優先されます。現在のデータは削除されません。",
mergeDone:"合体が完了しました：{days} 日分を取り込みました。アプリを再読み込みします…"
},
en:{
appSubtitle:"Salary calculator & work log",
copyrightLine:"© 2026 Reges Massao da Costa — All rights reserved",
themeToggle:"Toggle theme",
navHome:"Home",navCalc:"Calculator",navWork:"Work log",navCouple:"Couple",navSettings:"Settings",
homeNetMonth:"Net pay this month",
punchTitle:"⏰ Today's time clock",
punchStdBtn:"Fill today from the standard schedule",
metricGross:"💴 Gross",metricDays:"📅 Days worked",metricHours:"⏱️ Hours",metricOvertime:"➕ Overtime",
yukiuTitle:"🏖️ Yukiu (paid leave)",yukiuLeftWord:"left",
dashTitle:"📈 Monthly progress",dashSubtitle:"Automatic comparison with the previous month.",
loadingDash:"Loading monthly progress…",
backupNowBtn:"Back up now",
vsPrevMonth:"vs. last month",
homeYukiuUsedOf:"{used} used of {total} registered day(s)",
homeYukiuRegister:"Register the total yukiu days in the Work log tab.",
punchOutBtn:"🔴 Clock out · now {time}",
punchInBtn:"🟢 Clock in · now {time}",
punchOpenToday:"🟢 Clocked in at {time} — you are working. The standard breaks are added automatically when you clock out.",
punchOpenYesterday:"🟢 Yesterday's clock-in at {time} is still open — clock out to close that day.",
punchYukiuBtn:"✏️ Today is yukiu — tap to view",
punchYukiuStatus:"Yukiu of {days} day(s) already recorded today.",
punchClosedBtn:"✏️ Today is closed — tap to edit",
punchClosedStatus:"✔️ {in} → {out} · {hours} worked{ot}.",
punchClosedOt:" · {hours} of overtime",
punchIdleStatus:"Tap when you arrive: your clock-in is saved with the clock time and the standard breaks are added automatically.",
calcTitle:"💴 Salary calculator",
modeHourly:"💴 Hourly",modeMonthly:"👔 Monthly / Seishain",
hourlyRate:"Hourly rate (¥)",monthlySalary:"Monthly salary (¥)",baseHours:"Base hours / month",
normalHours:"Regular hours",overtimeHours:"Overtime hours (25%)",
offHours:"Hours worked on a day off",offPercent:"Day-off premium — whole day (%)",
nightPercent:"Night premium (%)",nightHours:"Night hours",
nightFixed:"Night allowance per day (¥)",nightDays:"Night work days",
mealMonthly:"Meal / monthly benefit (¥)",otherAllowance:"Other allowances (¥)",
summerBonus:"Summer bonus (¥)",summerBonusMonth:"Summer bonus falls in",
winterBonus:"Winter bonus (¥)",winterBonusMonth:"Winter bonus falls in",
deductionMode:"Deduction mode",dedModePercent:"Estimate (%)",dedModeDetailed:"Detailed (¥)",
deductionPct:"Estimated deductions (%)",
detailedTitle:"🧾 Detailed deductions",detailedHint:"Use this option to reproduce a real payslip.",
employmentInsurance:"Employment insurance (¥)",incomeTax:"Income tax (¥)",advanceSalary:"Salary advance (¥)",
utilities:"Utilities — water / power / gas (¥)",rentDeduction:"Rent (¥)",otherDeduction:"Other deductions (¥)",
resOff:"Worked day off",resBonus:"This month's bonus",resGross:"Monthly gross",
resOtherDed:"Other deductions",resTotalDed:"Total deductions",resNet:"Estimated net",resRate:"Calculated base rate",
dedMandatory:"Mandatory deductions",dedEstimated:"Estimated deductions",
calcBtn:"Calculate",
month1:"January",month2:"February",month3:"March",month4:"April",month5:"May",month6:"June",month7:"July",month8:"August",month9:"September",month10:"October",month11:"November",month12:"December",
workTitle:"📅 Work log",workSubtitle:"Record clock-in, breaks and clock-out for each day.",
yukiuTotalLabel:"Registered yukiu days",
yukiuNote:"Mark yukiu in the day editor (tap the day on the calendar): the balance goes down by itself. If you delete or unmark the day, the balance comes back.",
stdTitle:"⏰ Standard schedule — quick entry",
labelIn:"Clock-in",labelOut:"Clock-out",
stdBreaksTitle:"Standard breaks",addBreakBtn:"+ Add break",
stdNote:"Saved automatically. These times and breaks are filled in by themselves when you clock in/out or fill the day from the standard schedule on the Home screen. Each employee has their own.",
wd0:"Sun",wd1:"Mon",wd2:"Tue",wd3:"Wed",wd4:"Thu",wd5:"Fri",wd6:"Sat",
dayYukiuLabel:"🏖️ Yukiu on this day",yukiuNo:"No",yukiuFull:"Full day",yukiuHalf:"Half day",
dayOffLabel:"💪 Type of day",offNormal:"Normal day",offAsNormal:"Worked day off — paid as a normal day",off25:"Worked day off — +25% all day",off35:"Worked day off — +35% all day",
breaksTitle:"⏸️ Breaks (kyukei) — unpaid",
noteLabel:"Note (optional)",notePlaceholder:"E.g.: night shift",
saveDayBtn:"💾 Save day",deleteBtn:"🗑️ Delete",
historyTitle:"📋 This month's history",
yukiuRegisterPrompt:"🏖️ Register above the total yukiu days for this employee to track the balance.",
yukiuBalance:"🏖️ Yukiu: used {used} · {left} left of {total} day(s)",
ariaBreakStart:"Break start",ariaBreakEnd:"Break end",
ariaBreakStartStd:"Break start",ariaBreakEndStd:"Break end",ariaRemoveBreak:"Remove break",
editorYukiuSummary:"🏖️ Yukiu day ({label}) — it will be deducted from the balance when saved. No need to fill in clock-in and clock-out.",
halfDay:"half day",fullDay:"full day",
sumWorked:"⏱️ Worked: {hours}",sumBreak:" · break {hours}",sumOvertime:" · Overtime: {hours}",
sumOff:" · 💪 Worked day off (+{rate}% all day)",sumNight:" · 🌙 Night: {hours}",sumNightDay:" · 1 night day",
sumYukiu:" · 🏖️ Yukiu: {label}",sumFillInOut:"Fill in clock-in and clock-out to calculate.",
alertInOut:"Enter at least the clock-in and clock-out times.",
histEmpty:"No days recorded this month.",
histOffNormal:" · 💪 day off (as normal day)",histOffPct:" · 💪 day off +{rate}%",
histYukiu:" · 🏖️ yukiu ({label})",histYukiuOnly:"🏖️ Yukiu ({label})",
totalsLine:"{days} day(s) · {hours} · Regular: {normal} · Overtime: {overtime}{off} · Night: {night} · Night days: {nightDays}{yukiu}",
totalsOff:" · 💪 Day off: {hours}",totalsYukiu:" · 🏖️ Yukiu this month: {days} day(s)",
viewDaysTitle:"See the days of this month",
metricGrossMonth:"💴 Monthly gross",metricNetMonth:"💰 Monthly net",metricHoursWorked:"⏱️ Hours worked",
metricOt:"➕ Overtime hours",metricNight:"🌙 Night hours",metricDaysWorked:"📅 Days worked",
chartGross:"💴 Gross per month",chartNet:"💰 Net per month",chartHours:"⏱️ Hours worked per month",
chartOt:"➕ Overtime hours per month",chartNight:"🌙 Night hours per month",chartDays:"📅 Days worked per month",
dashNote:"Showing the last 6 months up to <strong>{month}</strong>. Hours and days come from the calendar. Gross and net use the value saved for each month; for the selected month, if nothing is saved yet, the panel uses the calculator's current result. <strong>Tap a month in any chart</strong> to open its days in the work log (clock-in, clock-out and breaks).",
coupleTitle:"👥 Employees — couple view",coupleSubtitle:"Each employee's net pay in the selected month and their combined total.",
empActiveSuffix:" (active)",empActiveBadge:"active",
coupleCardLine:"gross {gross} · {days} day(s) this month",
coupleTotalTitle:"💑 Couple total — {month}",
coupleNoData:"no data for {names}",coupleSumNote:"sum of the selected month's net pay",
coupleNote:"Last 6 months up to <strong>{month}</strong>, each employee in their own color. Past months use the value saved when tapping <strong>Calculate</strong>; with no saved value, the panel estimates from each employee's settings and days. Tap a month to open the active employee's days.",
manageTitle:"⚙️ Manage employees",
btnRename:"Rename",btnDeleteEmp:"Delete",btnAddEmp:"＋ Add employee",
promptEmpName:"Employee name:",promptEmpRename:"New name:",
alertPrincipalDelete:"The main employee cannot be deleted.",
alertActiveDelete:"Switch the active employee before deleting this one.",
confirmDeleteEmp:"Delete {name} and all of their data? There is no undo — export a backup first if you need one.",
loadingEmployees:"Loading employees…",
annualTitle:"📆 Annual summary",annualSubtitle:"Year totals per employee — handy for the year-end tax adjustment.",
annGross:"💴 Gross for the year",annNet:"💰 Net for the year",annDays:"📅 Days worked",annHours:"⏱️ Hours",annOt:"➕ Overtime",annYukiu:"🏖️ Yukiu used",
annYukiuVal:"{v} day(s)",
annCoupleTotal:"💑 Couple total in {year} (net)",annCoupleGross:"Combined gross: {gross}",
annNote:"Gross and net add up each month's saved value (or the estimate from the settings, when the month was not saved in the calculator yet). Days, hours and yukiu come from the days recorded on the calendar.",
activeEmployeeLabel:"👤 Active employee",
employeeNote:"Everything you fill in — calculator and work log — is saved for this employee. To enter the other person's data, switch the employee here.",
langTitle:"🌐 Language",langNote:"The chosen language applies to this device only.",langLabel:"App language",
backupTitle:"💾 Data backup",
backupDesc:"Your recorded days and settings are saved only on this device. Export a backup file and keep it somewhere safe (Files, e-mail or cloud). If you ever need it, import the file and everything comes back as it was.",
exportBtn:"⬇️ Export backup",importBtn:"⬆️ Import backup",mergeBtn:"🔀 Merge backup from another phone",
backupNoneYet:"⚠️ You have not exported any backup yet. Your records live only on this device — export a file and keep it somewhere safe.",
backupOld:"⚠️ Last backup on {when} — that is {age} day(s) ago. Export a new one to keep your records protected.",
backupOk:"✔️ Last backup on {when} ({age} day(s) ago). All good here.",
homeBackupNever:"You have recorded days and have not exported any backup yet. If the device has a problem, the history is lost.",
homeBackupOld:"It has been {age} day(s) since your last backup export (last one on {when}). Tap the button to export and keep your history protected.",
exportDone:"Backup exported with {days} recorded day(s). Keep the file somewhere safe.",
unknownDate:"unknown date",
importConfirm:"Import the backup from {when}, with {days} recorded day(s)? Your current data will be replaced by the file's data.",
importDone:"Backup imported successfully. Reloading the app…",
invalidBackup:"Invalid backup file. Nothing was changed.",
mergeNoData:"This file has no employee data to merge.",
mergeNewTag:" (new — will be created)",
mergeLine:"• {name}: {days} day(s){tag}",
mergeConfirm:"Merge the backup from {when} with this device's data?\n\n{desc}\n\nThe days go to the employee with the same name. If the same day exists on both devices, the file's copy wins. No current data is deleted.",
mergeDone:"Backup merged successfully: {days} day(s) added. Reloading the app…"
},
vi:{
appSubtitle:"Tính lương & quản lý giờ làm",
copyrightLine:"© 2026 Reges Massao da Costa — Mọi quyền được bảo lưu",
themeToggle:"Đổi giao diện",
navHome:"Trang chủ",navCalc:"Tính lương",navWork:"Giờ làm",navCouple:"Cặp đôi",navSettings:"Cài đặt",
homeNetMonth:"Lương thực nhận tháng này",
punchTitle:"⏰ Chấm công hôm nay",
punchStdBtn:"Nhập hôm nay theo giờ chuẩn",
metricGross:"💴 Tổng lương",metricDays:"📅 Ngày đã làm",metricHours:"⏱️ Giờ",metricOvertime:"➕ Tăng ca",
yukiuTitle:"🏖️ Yukiu (nghỉ có lương)",yukiuLeftWord:"còn lại",
dashTitle:"📈 Diễn biến theo tháng",dashSubtitle:"Tự động so sánh với tháng trước.",
loadingDash:"Đang tải diễn biến theo tháng…",
backupNowBtn:"Sao lưu ngay",
vsPrevMonth:"so với tháng trước",
homeYukiuUsedOf:"Đã dùng {used} / {total} ngày đã đăng ký",
homeYukiuRegister:"Hãy đăng ký tổng số ngày yukiu ở tab Giờ làm.",
punchOutBtn:"🔴 Ghi giờ ra · bây giờ {time}",
punchInBtn:"🟢 Ghi giờ vào · bây giờ {time}",
punchOpenToday:"🟢 Đã ghi giờ vào lúc {time} — bạn đang làm việc. Các giờ nghỉ chuẩn sẽ tự động được cộng khi bạn ghi giờ ra.",
punchOpenYesterday:"🟢 Giờ vào của hôm qua lúc {time} vẫn đang mở — hãy ghi giờ ra để đóng ngày đó.",
punchYukiuBtn:"✏️ Hôm nay là yukiu — chạm để xem",
punchYukiuStatus:"Hôm nay đã nhập yukiu {days} ngày.",
punchClosedBtn:"✏️ Hôm nay đã đóng — chạm để sửa",
punchClosedStatus:"✔️ {in} → {out} · đã làm {hours}{ot}.",
punchClosedOt:" · tăng ca {hours}",
punchIdleStatus:"Chạm khi đến nơi: giờ vào được lưu theo đồng hồ và các giờ nghỉ chuẩn tự động được thêm vào.",
calcTitle:"💴 Tính lương",
modeHourly:"💴 Theo giờ",modeMonthly:"👔 Theo tháng / Seishain",
hourlyRate:"Lương theo giờ (¥)",monthlySalary:"Lương tháng (¥)",baseHours:"Giờ cơ bản / tháng",
normalHours:"Giờ bình thường",overtimeHours:"Giờ tăng ca (25%)",
offHours:"Giờ làm vào ngày nghỉ",offPercent:"Phụ cấp ngày nghỉ — cả ngày (%)",
nightPercent:"Phụ cấp ca đêm (%)",nightHours:"Giờ ca đêm",
nightFixed:"Phụ cấp ca đêm mỗi ngày (¥)",nightDays:"Số ngày làm ca đêm",
mealMonthly:"Ăn uống / phúc lợi hàng tháng (¥)",otherAllowance:"Phụ cấp khác (¥)",
summerBonus:"Thưởng mùa hè (¥)",summerBonusMonth:"Thưởng mùa hè rơi vào",
winterBonus:"Thưởng mùa đông (¥)",winterBonusMonth:"Thưởng mùa đông rơi vào",
deductionMode:"Cách tính khấu trừ",dedModePercent:"Ước tính (%)",dedModeDetailed:"Chi tiết (¥)",
deductionPct:"Khấu trừ ước tính (%)",
detailedTitle:"🧾 Khấu trừ chi tiết",detailedHint:"Dùng tùy chọn này khi muốn mô phỏng đúng phiếu lương thật.",
employmentInsurance:"Bảo hiểm việc làm (¥)",incomeTax:"Thuế thu nhập (¥)",advanceSalary:"Lương ứng trước (¥)",
utilities:"Điện / nước / gas (¥)",rentDeduction:"Tiền nhà (¥)",otherDeduction:"Khấu trừ khác (¥)",
resOff:"Làm ngày nghỉ",resBonus:"Thưởng tháng này",resGross:"Tổng lương tháng",
resOtherDed:"Khấu trừ khác",resTotalDed:"Tổng khấu trừ",resNet:"Thực nhận ước tính",resRate:"Lương giờ cơ bản đã tính",
dedMandatory:"Khấu trừ bắt buộc",dedEstimated:"Khấu trừ ước tính",
calcBtn:"Tính toán",
month1:"tháng 1",month2:"tháng 2",month3:"tháng 3",month4:"tháng 4",month5:"tháng 5",month6:"tháng 6",month7:"tháng 7",month8:"tháng 8",month9:"tháng 9",month10:"tháng 10",month11:"tháng 11",month12:"tháng 12",
workTitle:"📅 Quản lý giờ làm",workSubtitle:"Ghi lại giờ vào, giờ nghỉ và giờ ra của mỗi ngày.",
yukiuTotalLabel:"Số ngày yukiu đã đăng ký",
yukiuNote:"Đánh dấu yukiu trong màn hình sửa ngày (chạm vào ngày trên lịch): số dư tự giảm. Nếu xóa hoặc bỏ đánh dấu ngày đó, số dư sẽ quay lại.",
stdTitle:"⏰ Giờ chuẩn — nhập nhanh",
labelIn:"Giờ vào",labelOut:"Giờ ra",
stdBreaksTitle:"Giờ nghỉ chuẩn",addBreakBtn:"+ Thêm giờ nghỉ",
stdNote:"Tự động lưu. Các giờ và giờ nghỉ này sẽ tự động được điền khi bạn chấm công (vào/ra theo đồng hồ) hoặc nhập ngày theo giờ chuẩn ở màn hình Trang chủ. Mỗi nhân viên có phần riêng.",
wd0:"CN",wd1:"T2",wd2:"T3",wd3:"T4",wd4:"T5",wd5:"T6",wd6:"T7",
dayYukiuLabel:"🏖️ Yukiu vào ngày này",yukiuNo:"Không",yukiuFull:"Cả ngày",yukiuHalf:"Nửa ngày",
dayOffLabel:"💪 Loại ngày",offNormal:"Ngày bình thường",offAsNormal:"Làm ngày nghỉ — trả như ngày thường",off25:"Làm ngày nghỉ — +25% cả ngày",off35:"Làm ngày nghỉ — +35% cả ngày",
breaksTitle:"⏸️ Giờ nghỉ (kyukei) — không trả lương",
noteLabel:"Ghi chú (không bắt buộc)",notePlaceholder:"VD: ca đêm",
saveDayBtn:"💾 Lưu ngày",deleteBtn:"🗑️ Xóa",
historyTitle:"📋 Lịch sử tháng này",
yukiuRegisterPrompt:"🏖️ Hãy đăng ký ở trên tổng số ngày yukiu của nhân viên này để theo dõi số dư.",
yukiuBalance:"🏖️ Yukiu: đã dùng {used} · còn lại {left} / {total} ngày",
ariaBreakStart:"Bắt đầu nghỉ",ariaBreakEnd:"Kết thúc nghỉ",
ariaBreakStartStd:"Bắt đầu nghỉ",ariaBreakEndStd:"Kết thúc nghỉ",ariaRemoveBreak:"Xóa giờ nghỉ",
editorYukiuSummary:"🏖️ Ngày yukiu ({label}) — sẽ trừ vào số dư khi lưu. Không cần điền giờ vào và giờ ra.",
halfDay:"nửa ngày",fullDay:"cả ngày",
sumWorked:"⏱️ Đã làm: {hours}",sumBreak:" · nghỉ {hours}",sumOvertime:" · Tăng ca: {hours}",
sumOff:" · 💪 Làm ngày nghỉ (+{rate}% cả ngày)",sumNight:" · 🌙 Ca đêm: {hours}",sumNightDay:" · 1 ngày ca đêm",
sumYukiu:" · 🏖️ Yukiu: {label}",sumFillInOut:"Điền giờ vào và giờ ra để tính.",
alertInOut:"Hãy nhập ít nhất giờ vào và giờ ra.",
histEmpty:"Chưa có ngày nào được ghi trong tháng này.",
histOffNormal:" · 💪 ngày nghỉ (như ngày thường)",histOffPct:" · 💪 ngày nghỉ +{rate}%",
histYukiu:" · 🏖️ yukiu ({label})",histYukiuOnly:"🏖️ Yukiu ({label})",
totalsLine:"{days} ngày · {hours} · Thường: {normal} · Tăng ca: {overtime}{off} · Ca đêm: {night} · Ngày ca đêm: {nightDays}{yukiu}",
totalsOff:" · 💪 Ngày nghỉ: {hours}",totalsYukiu:" · 🏖️ Yukiu tháng này: {days} ngày",
viewDaysTitle:"Xem các ngày của tháng này",
metricGrossMonth:"💴 Tổng lương tháng",metricNetMonth:"💰 Thực nhận tháng",metricHoursWorked:"⏱️ Giờ đã làm",
metricOt:"➕ Giờ tăng ca",metricNight:"🌙 Giờ ca đêm",metricDaysWorked:"📅 Ngày đã làm",
chartGross:"💴 Tổng lương theo tháng",chartNet:"💰 Thực nhận theo tháng",chartHours:"⏱️ Giờ đã làm theo tháng",
chartOt:"➕ Giờ tăng ca theo tháng",chartNight:"🌙 Giờ ca đêm theo tháng",chartDays:"📅 Ngày đã làm theo tháng",
dashNote:"Hiển thị 6 tháng gần nhất đến <strong>{month}</strong>. Giờ và ngày lấy từ lịch. Tổng lương và thực nhận dùng giá trị đã lưu của mỗi tháng; ở tháng đang chọn, nếu chưa có giá trị đã lưu, bảng sẽ dùng kết quả hiện tại của phần tính lương. <strong>Chạm vào một tháng ở bất kỳ biểu đồ nào</strong> để mở các ngày của tháng đó trong quản lý giờ làm (giờ vào, giờ ra và giờ nghỉ).",
coupleTitle:"👥 Nhân viên — góc nhìn cặp đôi",coupleSubtitle:"Thực nhận của mỗi nhân viên trong tháng đang chọn và tổng của hai người.",
empActiveSuffix:" (đang chọn)",empActiveBadge:"đang chọn",
coupleCardLine:"tổng {gross} · {days} ngày trong tháng",
coupleTotalTitle:"💑 Tổng cặp đôi — {month}",
coupleNoData:"chưa có dữ liệu của {names}",coupleSumNote:"tổng thực nhận của tháng đang chọn",
coupleNote:"6 tháng gần nhất đến <strong>{month}</strong>, mỗi nhân viên một màu. Các tháng trước dùng giá trị đã lưu khi chạm <strong>Tính toán</strong>; nếu chưa có giá trị đã lưu, bảng sẽ ước tính từ cài đặt và số ngày của mỗi nhân viên. Chạm vào một tháng để mở các ngày của nhân viên đang chọn.",
manageTitle:"⚙️ Quản lý nhân viên",
btnRename:"Đổi tên",btnDeleteEmp:"Xóa",btnAddEmp:"＋ Thêm nhân viên",
promptEmpName:"Tên nhân viên:",promptEmpRename:"Tên mới:",
alertPrincipalDelete:"Không thể xóa nhân viên chính.",
alertActiveDelete:"Hãy đổi nhân viên đang chọn trước khi xóa người này.",
confirmDeleteEmp:"Xóa {name} và toàn bộ dữ liệu của họ? Không thể hoàn tác — hãy xuất bản sao lưu trước nếu cần.",
loadingEmployees:"Đang tải nhân viên…",
annualTitle:"📆 Tổng kết năm",annualSubtitle:"Tổng cả năm theo nhân viên — hữu ích cho điều chỉnh thuế cuối năm.",
annGross:"💴 Tổng lương năm",annNet:"💰 Thực nhận năm",annDays:"📅 Ngày đã làm",annHours:"⏱️ Giờ",annOt:"➕ Tăng ca",annYukiu:"🏖️ Yukiu đã dùng",
annYukiuVal:"{v} ngày",
annCoupleTotal:"💑 Tổng cặp đôi năm {year} (thực nhận)",annCoupleGross:"Tổng lương gộp: {gross}",
annNote:"Tổng lương và thực nhận cộng giá trị đã lưu của mỗi tháng (hoặc ước tính từ cài đặt khi tháng chưa được lưu trong phần tính lương). Ngày, giờ và yukiu lấy từ các ngày đã ghi trên lịch.",
activeEmployeeLabel:"👤 Nhân viên đang chọn",
employeeNote:"Mọi thứ bạn điền — tính lương và quản lý giờ làm — đều được lưu cho nhân viên này. Để nhập dữ liệu của người kia, hãy đổi nhân viên tại đây.",
langTitle:"🌐 Ngôn ngữ",langNote:"Ngôn ngữ đã chọn chỉ áp dụng cho thiết bị này.",langLabel:"Ngôn ngữ của ứng dụng",
backupTitle:"💾 Sao lưu dữ liệu",
backupDesc:"Các ngày đã ghi và cài đặt chỉ được lưu trên thiết bị này. Hãy xuất tệp sao lưu và giữ ở nơi an toàn (Tệp, e-mail hoặc đám mây). Khi cần, nhập tệp vào và mọi thứ sẽ trở lại như cũ.",
exportBtn:"⬇️ Xuất sao lưu",importBtn:"⬆️ Nhập sao lưu",mergeBtn:"🔀 Gộp sao lưu từ điện thoại khác",
backupNoneYet:"⚠️ Bạn chưa xuất bản sao lưu nào. Dữ liệu chỉ nằm trên thiết bị này — hãy xuất tệp và giữ ở nơi an toàn.",
backupOld:"⚠️ Sao lưu gần nhất vào {when} — đã {age} ngày. Hãy xuất bản mới để bảo vệ dữ liệu.",
backupOk:"✔️ Sao lưu gần nhất vào {when} (cách đây {age} ngày). Mọi thứ ổn.",
homeBackupNever:"Bạn đã có ngày được ghi mà chưa xuất sao lưu nào. Nếu thiết bị gặp sự cố, lịch sử sẽ mất.",
homeBackupOld:"Đã {age} ngày kể từ lần xuất sao lưu gần nhất (lần cuối vào {when}). Chạm nút để xuất và bảo vệ lịch sử.",
exportDone:"Đã xuất sao lưu với {days} ngày đã ghi. Hãy giữ tệp ở nơi an toàn.",
unknownDate:"không rõ ngày",
importConfirm:"Nhập bản sao lưu từ {when}, với {days} ngày đã ghi? Dữ liệu hiện tại sẽ bị thay bằng dữ liệu trong tệp.",
importDone:"Đã nhập sao lưu thành công. Đang tải lại ứng dụng…",
invalidBackup:"Tệp sao lưu không hợp lệ. Không có gì thay đổi.",
mergeNoData:"Tệp này không có dữ liệu nhân viên để gộp.",
mergeNewTag:" (mới — sẽ được tạo)",
mergeLine:"• {name}: {days} ngày{tag}",
mergeConfirm:"Gộp bản sao lưu từ {when} với dữ liệu của thiết bị này?\n\n{desc}\n\nCác ngày sẽ vào nhân viên có cùng tên. Nếu cùng một ngày có ở cả hai thiết bị, bản trong tệp sẽ được dùng. Không có dữ liệu hiện tại nào bị xóa.",
mergeDone:"Đã gộp sao lưu thành công: thêm {days} ngày. Đang tải lại ứng dụng…"
},
ne:{
appSubtitle:"तलब क्याल्कुलेटर र कामको रेकर्ड",
copyrightLine:"© 2026 Reges Massao da Costa — सर्वाधिकार सुरक्षित",
themeToggle:"थिम बदल्नुहोस्",
navHome:"गृहपृष्ठ",navCalc:"क्याल्कुलेटर",navWork:"कामको रेकर्ड",navCouple:"जोडी",navSettings:"सेटिङ",
homeNetMonth:"यो महिनाको खुद तलब",
punchTitle:"⏰ आजको हाजिरी",
punchStdBtn:"मानक समयबाट आजको दिन भर्नुहोस्",
metricGross:"💴 कुल तलब",metricDays:"📅 काम गरेको दिन",metricHours:"⏱️ घण्टा",metricOvertime:"➕ ओभरटाइम",
yukiuTitle:"🏖️ युक्यु (सशुल्क बिदा)",yukiuLeftWord:"बाँकी",
dashTitle:"📈 मासिक प्रगति",dashSubtitle:"अघिल्लो महिनासँग स्वतः तुलना।",
loadingDash:"मासिक प्रगति लोड हुँदैछ…",
backupNowBtn:"अहिले ब्याकअप गर्नुहोस्",
vsPrevMonth:"गत महिनाको तुलनामा",
homeYukiuUsedOf:"दर्ता गरिएको {total} दिनमध्ये {used} दिन प्रयोग भयो",
homeYukiuRegister:"कामको रेकर्ड ट्याबमा युक्युको कुल दिन दर्ता गर्नुहोस्।",
punchOutBtn:"🔴 काम सकियो · अहिले {time}",
punchInBtn:"🟢 काम सुरु · अहिले {time}",
punchOpenToday:"🟢 {time} मा काम सुरु भयो — तपाईं काम गर्दै हुनुहुन्छ। काम सकिँदा मानक विश्रामहरू स्वतः थपिन्छन्।",
punchOpenYesterday:"🟢 हिजोको {time} को काम सुरु अझै खुला छ — त्यो दिन बन्द गर्न काम सकिएको थिच्नुहोस्।",
punchYukiuBtn:"✏️ आज युक्यु हो — हेर्न छुनुहोस्",
punchYukiuStatus:"आज युक्यु {days} दिन पहिले नै दर्ता भइसकेको छ।",
punchClosedBtn:"✏️ आज बन्द भइसक्यो — सम्पादन गर्न छुनुहोस्",
punchClosedStatus:"✔️ {in} → {out} · {hours} काम भयो{ot}।",
punchClosedOt:" · ओभरटाइम {hours}",
punchIdleStatus:"आइपुग्दा छुनुहोस्: घडीको समयसँगै काम सुरु दर्ता हुन्छ र मानक विश्रामहरू स्वतः थपिन्छन्।",
calcTitle:"💴 तलब क्याल्कुलेटर",
modeHourly:"💴 प्रति घण्टा",modeMonthly:"👔 मासिक / सेइशाइन",
hourlyRate:"प्रति घण्टा दर (¥)",monthlySalary:"मासिक तलब (¥)",baseHours:"आधार घण्टा / महिना",
normalHours:"सामान्य घण्टा",overtimeHours:"ओभरटाइम घण्टा (25%)",
offHours:"बिदाको दिन काम गरेको घण्टा",offPercent:"बिदाको दिनको भत्ता — पूरा दिन (%)",
nightPercent:"रात्रि भत्ता (%)",nightHours:"रात्रि घण्टा",
nightFixed:"प्रति दिन रात्रि भत्ता (¥)",nightDays:"रात्रि कामका दिन",
mealMonthly:"खाना / मासिक सुविधा (¥)",otherAllowance:"अन्य भत्ता (¥)",
summerBonus:"गर्मीको बोनस (¥)",summerBonusMonth:"गर्मीको बोनस आउने महिना",
winterBonus:"जाडोको बोनस (¥)",winterBonusMonth:"जाडोको बोनस आउने महिना",
deductionMode:"कटौतीको तरिका",dedModePercent:"अनुमान (%)",dedModeDetailed:"विस्तृत (¥)",
deductionPct:"अनुमानित कटौती (%)",
detailedTitle:"🧾 विस्तृत कटौती",detailedHint:"वास्तविक तलब पर्ची जस्तै बनाउन यो विकल्प प्रयोग गर्नुहोस्।",
employmentInsurance:"रोजगार बीमा (¥)",incomeTax:"आयकर (¥)",advanceSalary:"अग्रिम तलब (¥)",
utilities:"पानी / बिजुली / ग्यास (¥)",rentDeduction:"भाडा (¥)",otherDeduction:"अन्य कटौती (¥)",
resOff:"बिदामा काम",resBonus:"यो महिनाको बोनस",resGross:"मासिक कुल तलब",
resOtherDed:"अन्य कटौती",resTotalDed:"कुल कटौती",resNet:"अनुमानित खुद तलब",resRate:"गणना गरिएको आधार दर",
dedMandatory:"अनिवार्य कटौती",dedEstimated:"अनुमानित कटौती",
calcBtn:"गणना गर्नुहोस्",
month1:"जनवरी",month2:"फेब्रुअरी",month3:"मार्च",month4:"अप्रिल",month5:"मे",month6:"जुन",month7:"जुलाई",month8:"अगस्ट",month9:"सेप्टेम्बर",month10:"अक्टोबर",month11:"नोभेम्बर",month12:"डिसेम्बर",
workTitle:"📅 कामको रेकर्ड",workSubtitle:"प्रत्येक दिनको सुरु, विश्राम र अन्त्य दर्ता गर्नुहोस्।",
yukiuTotalLabel:"दर्ता गरिएको युक्यु दिन",
yukiuNote:"दिनको सम्पादनमा युक्यु चिन्ह लगाउनुहोस् (क्यालेन्डरमा दिन छुनुहोस्): बाँकी स्वतः घट्छ। दिन मेटाउँदा वा चिन्ह हटाउँदा बाँकी फिर्ता आउँछ।",
stdTitle:"⏰ मानक समय — छिटो दर्ता",
labelIn:"सुरु",labelOut:"अन्त्य",
stdBreaksTitle:"मानक विश्राम",addBreakBtn:"+ विश्राम थप्नुहोस्",
stdNote:"स्वतः सुरक्षित हुन्छ। यी समय र विश्रामहरू हाजिरी लगाउँदा वा गृहपृष्ठबाट मानक समयले दिन भर्दा स्वतः भरिन्छन्। प्रत्येक कर्मचारीको आफ्नै हुन्छ।",
wd0:"आइत",wd1:"सोम",wd2:"मङ्गल",wd3:"बुध",wd4:"बिही",wd5:"शुक्र",wd6:"शनि",
dayYukiuLabel:"🏖️ यो दिनको युक्यु",yukiuNo:"होइन",yukiuFull:"पूरा दिन",yukiuHalf:"आधा दिन",
dayOffLabel:"💪 दिनको प्रकार",offNormal:"सामान्य दिन",offAsNormal:"बिदामा काम — सामान्य दिन सरह भुक्तानी",off25:"बिदामा काम — पूरा दिन +25%",off35:"बिदामा काम — पूरा दिन +35%",
breaksTitle:"⏸️ विश्राम (kyukei) — भुक्तानी नहुने",
noteLabel:"टिप्पणी (वैकल्पिक)",notePlaceholder:"उदा.: रात्रि सिफ्ट",
saveDayBtn:"💾 दिन सुरक्षित गर्नुहोस्",deleteBtn:"🗑️ मेटाउनुहोस्",
historyTitle:"📋 यो महिनाको इतिहास",
yukiuRegisterPrompt:"🏖️ बाँकी हेर्न माथि यो कर्मचारीको युक्युको कुल दिन दर्ता गर्नुहोस्।",
yukiuBalance:"🏖️ युक्यु: प्रयोग {used} · बाँकी {left} / {total} दिन",
ariaBreakStart:"विश्राम सुरु",ariaBreakEnd:"विश्राम अन्त्य",
ariaBreakStartStd:"विश्राम सुरु",ariaBreakEndStd:"विश्राम अन्त्य",ariaRemoveBreak:"विश्राम हटाउनुहोस्",
editorYukiuSummary:"🏖️ युक्युको दिन ({label}) — सुरक्षित गर्दा बाँकीबाट कटौती हुन्छ। सुरु र अन्त्य भर्नु पर्दैन।",
halfDay:"आधा दिन",fullDay:"पूरा दिन",
sumWorked:"⏱️ काम भयो: {hours}",sumBreak:" · विश्राम {hours}",sumOvertime:" · ओभरटाइम: {hours}",
sumOff:" · 💪 बिदामा काम (पूरा दिन +{rate}%)",sumNight:" · 🌙 रात्रि: {hours}",sumNightDay:" · रात्रि काम १ दिन",
sumYukiu:" · 🏖️ युक्यु: {label}",sumFillInOut:"गणना गर्न सुरु र अन्त्य भर्नुहोस्।",
alertInOut:"कम्तिमा सुरु र अन्त्यको समय भर्नुहोस्।",
histEmpty:"यो महिना कुनै दिन दर्ता भएको छैन।",
histOffNormal:" · 💪 बिदा (सामान्य दिन सरह)",histOffPct:" · 💪 बिदा +{rate}%",
histYukiu:" · 🏖️ युक्यु ({label})",histYukiuOnly:"🏖️ युक्यु ({label})",
totalsLine:"{days} दिन · {hours} · सामान्य: {normal} · ओभरटाइम: {overtime}{off} · रात्रि: {night} · रात्रि दिन: {nightDays}{yukiu}",
totalsOff:" · 💪 बिदा: {hours}",totalsYukiu:" · 🏖️ यो महिनाको युक्यु: {days} दिन",
viewDaysTitle:"यो महिनाका दिनहरू हेर्नुहोस्",
metricGrossMonth:"💴 मासिक कुल तलब",metricNetMonth:"💰 मासिक खुद तलब",metricHoursWorked:"⏱️ काम गरेको घण्टा",
metricOt:"➕ ओभरटाइम घण्टा",metricNight:"🌙 रात्रि घण्टा",metricDaysWorked:"📅 काम गरेको दिन",
chartGross:"💴 महिना अनुसार कुल तलब",chartNet:"💰 महिना अनुसार खुद तलब",chartHours:"⏱️ महिना अनुसार कामको घण्टा",
chartOt:"➕ महिना अनुसार ओभरटाइम",chartNight:"🌙 महिना अनुसार रात्रि घण्टा",chartDays:"📅 महिना अनुसार कामका दिन",
dashNote:"<strong>{month}</strong> सम्मका पछिल्ला ६ महिना देखाइएको छ। घण्टा र दिन क्यालेन्डरबाट आउँछन्। कुल र खुद तलब प्रत्येक महिनाको सुरक्षित मान प्रयोग गर्छन्; छानिएको महिनामा सुरक्षित मान नभए, प्यानलले क्याल्कुलेटरको हालको परिणाम प्रयोग गर्छ। <strong>कुनै पनि चार्टमा महिना छुनुहोस्</strong> — त्यस महिनाका दिन कामको रेकर्डमा खुल्छन् (सुरु, अन्त्य र विश्राम)।",
coupleTitle:"👥 कर्मचारी — जोडीको दृश्य",coupleSubtitle:"छानिएको महिनामा प्रत्येक कर्मचारीको खुद तलब र दुवैको कुल।",
empActiveSuffix:" (सक्रिय)",empActiveBadge:"सक्रिय",
coupleCardLine:"कुल {gross} · यो महिना {days} दिन",
coupleTotalTitle:"💑 जोडीको कुल — {month}",
coupleNoData:"{names} को डेटा छैन",coupleSumNote:"छानिएको महिनाको खुद तलबको जोड",
coupleNote:"<strong>{month}</strong> सम्मका पछिल्ला ६ महिना, प्रत्येक कर्मचारी आफ्नै रङमा। विगतका महिनाहरूले <strong>गणना गर्नुहोस्</strong> छुँदा सुरक्षित भएको मान प्रयोग गर्छन्; सुरक्षित मान नभए, प्यानलले प्रत्येक कर्मचारीको सेटिङ र दिनबाट अनुमान गर्छ। सक्रिय कर्मचारीका दिन खोल्न महिना छुनुहोस्।",
manageTitle:"⚙️ कर्मचारी व्यवस्थापन",
btnRename:"नाम बदल्नुहोस्",btnDeleteEmp:"मेटाउनुहोस्",btnAddEmp:"＋ कर्मचारी थप्नुहोस्",
promptEmpName:"कर्मचारीको नाम:",promptEmpRename:"नयाँ नाम:",
alertPrincipalDelete:"मुख्य कर्मचारी मेटाउन सकिँदैन।",
alertActiveDelete:"यो मेटाउनुअघि सक्रिय कर्मचारी बदल्नुहोस्।",
confirmDeleteEmp:"{name} र उहाँको सबै डेटा मेटाउने? यो फिर्ता हुँदैन — आवश्यक भए पहिले ब्याकअप निर्यात गर्नुहोस्।",
loadingEmployees:"कर्मचारी लोड हुँदैछ…",
annualTitle:"📆 वार्षिक सारांश",annualSubtitle:"कर्मचारी अनुसार वर्षको कुल — वर्ष-अन्त्य कर समायोजनमा उपयोगी।",
annGross:"💴 वर्षको कुल तलब",annNet:"💰 वर्षको खुद तलब",annDays:"📅 काम गरेको दिन",annHours:"⏱️ घण्टा",annOt:"➕ ओभरटाइम",annYukiu:"🏖️ प्रयोग भएको युक्यु",
annYukiuVal:"{v} दिन",
annCoupleTotal:"💑 {year} मा जोडीको कुल (खुद)",annCoupleGross:"कुल जोड: {gross}",
annNote:"कुल र खुद तलब प्रत्येक महिनाको सुरक्षित मान (वा महिना क्याल्कुलेटरमा सुरक्षित नभएको भए सेटिङबाटको अनुमान) जोडेर आउँछ। दिन, घण्टा र युक्यु क्यालेन्डरमा दर्ता भएका दिनबाट आउँछन्।",
activeEmployeeLabel:"👤 सक्रिय कर्मचारी",
employeeNote:"तपाईंले भर्ने सबै कुरा — क्याल्कुलेटर र कामको रेकर्ड — यो कर्मचारीका लागि सुरक्षित हुन्छ। अर्को व्यक्तिको डेटा भर्न यहाँ कर्मचारी बदल्नुहोस्।",
langTitle:"🌐 भाषा",langNote:"छानिएको भाषा यो उपकरणमा मात्र लागू हुन्छ।",langLabel:"एपको भाषा",
backupTitle:"💾 डेटाको ब्याकअप",
backupDesc:"तपाईंका दर्ता गरिएका दिन र सेटिङहरू यो उपकरणमा मात्र सुरक्षित छन्। ब्याकअप फाइल निर्यात गरेर सुरक्षित ठाउँमा राख्नुहोस् (फाइल, इमेल वा क्लाउड)। आवश्यक पर्दा फाइल आयात गर्नुहोस्, सबै पहिले जस्तै फिर्ता आउँछ।",
exportBtn:"⬇️ ब्याकअप निर्यात",importBtn:"⬆️ ब्याकअप आयात",mergeBtn:"🔀 अर्को फोनको ब्याकअप मिलाउनुहोस्",
backupNoneYet:"⚠️ तपाईंले अझै कुनै ब्याकअप निर्यात गर्नुभएको छैन। रेकर्डहरू यो उपकरणमा मात्र छन् — फाइल निर्यात गरेर सुरक्षित ठाउँमा राख्नुहोस्।",
backupOld:"⚠️ पछिल्लो ब्याकअप {when} मा — {age} दिन भइसक्यो। रेकर्ड सुरक्षित राख्न नयाँ निर्यात गर्नुहोस्।",
backupOk:"✔️ पछिल्लो ब्याकअप {when} मा ({age} दिनअघि)। सबै ठीक छ।",
homeBackupNever:"तपाईंका दर्ता गरिएका दिन छन् तर ब्याकअप निर्यात भएको छैन। उपकरणमा समस्या आए इतिहास हराउँछ।",
homeBackupOld:"पछिल्लो ब्याकअप निर्यात भएको {age} दिन भइसक्यो (पछिल्लो {when} मा)। इतिहास सुरक्षित राख्न बटन थिचेर निर्यात गर्नुहोस्।",
exportDone:"{days} दिनको रेकर्डसहित ब्याकअप निर्यात भयो। फाइल सुरक्षित ठाउँमा राख्नुहोस्।",
unknownDate:"मिति अज्ञात",
importConfirm:"{when} को ब्याकअप ({days} दिनको रेकर्डसहित) आयात गर्ने? हालको डेटा फाइलको डेटाले बदलिन्छ।",
importDone:"ब्याकअप सफलतापूर्वक आयात भयो। एप पुनः लोड हुँदैछ…",
invalidBackup:"अमान्य ब्याकअप फाइल। केही परिवर्तन भएन।",
mergeNoData:"यो फाइलमा मिलाउने कर्मचारी डेटा छैन।",
mergeNewTag:" (नयाँ — सिर्जना हुनेछ)",
mergeLine:"• {name}: {days} दिन{tag}",
mergeConfirm:"{when} को ब्याकअप यो उपकरणको डेटासँग मिलाउने?\n\n{desc}\n\nदिनहरू उही नामको कर्मचारीमा जान्छन्। एउटै दिन दुवै उपकरणमा भए, फाइलको प्रति मान्य हुन्छ। हालको कुनै डेटा मेटिँदैन।",
mergeDone:"ब्याकअप सफलतापूर्वक मिल्यो: {days} दिन थपियो। एप पुनः लोड हुँदैछ…"
}
};
let LANG=localStorage.getItem(LANG_KEY)||"pt";
if(!I18N[LANG])LANG="pt";
function t(key,vars){
  let s=(I18N[LANG]&&I18N[LANG][key])??I18N.pt[key]??key;
  if(vars)for(const k in vars)s=s.replaceAll("{"+k+"}",String(vars[k]));
  return s;
}
function decSep(){return (LANG==="pt"||LANG==="vi")?",":"."}
function applyLang(){
  document.documentElement.lang=LOCALES[LANG];
  document.querySelectorAll("[data-i18n]").forEach(el=>{el.textContent=t(el.dataset.i18n)});
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{el.placeholder=t(el.dataset.i18nPh)});
  document.querySelectorAll("[data-i18n-aria]").forEach(el=>{el.setAttribute("aria-label",t(el.dataset.i18nAria))});
  const sel=$("langSelect");
  if(sel)sel.value=LANG;
}

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
  return Number.isInteger(r)?String(r):String(r).replace(".",decSep());
}
function renderYukiu(){
  const el=$("yukiuStatus");
  if(!el)return;
  const total=val("yukiuTotal");
  if(total<=0){
    el.textContent=t("yukiuRegisterPrompt");
    return;
  }
  const used=yukiuUsedFor(ACTIVE_BASES);
  el.textContent=t("yukiuBalance",{used:fmtDays(used),left:fmtDays(total-used),total:fmtDays(total)});
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
  $("homeMonth").textContent=viewDate.toLocaleDateString(LOCALES[LANG],{month:"long",year:"numeric"});
  $("homeNet").textContent=s.net==null?"—":money(s.net);
  $("homeNetChange").textContent=(s.net!=null&&prev.net!=null)?`${changeText(s.net,prev.net)} ${t("vsPrevMonth")}`:"";
  $("homeGross").textContent=s.gross==null?"—":money(s.gross);
  $("homeDays").textContent=String(s.days);
  $("homeHours").textContent=fmtHours(s.hours);
  $("homeOvertime").textContent=fmtHours(s.overtime);
  const total=val("yukiuTotal");
  const used=yukiuUsedFor(ACTIVE_BASES);
  $("homeYukiuLeft").textContent=total>0?fmtDays(total-used):"—";
  $("homeYukiuText").textContent=total>0
    ? t("homeYukiuUsedOf",{used:fmtDays(used),total:fmtDays(total)})
    : t("homeYukiuRegister");
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
    btn.textContent=t("punchOutBtn",{time:nowTime()});
    st.textContent=open.key===todayKey()
      ? t("punchOpenToday",{time:open.rec.in})
      : t("punchOpenYesterday",{time:open.rec.in});
    return;
  }
  const d=dayData(todayKey());
  if(d&&Number(d.yukiu||0)>0){
    btn.textContent=t("punchYukiuBtn");
    st.textContent=t("punchYukiuStatus",{days:fmtDays(Number(d.yukiu))});
    return;
  }
  if(d){
    const c=calcDay(d);
    btn.textContent=t("punchClosedBtn");
    st.textContent=t("punchClosedStatus",{in:d.in,out:d.out,hours:fmtHours(c.hours),ot:c.overtime?t("punchClosedOt",{hours:fmtHours(c.overtime)}):""});
    return;
  }
  const stdCfg=loadStd();
  btn.textContent=t("punchInBtn",{time:nowTime()});
  st.textContent=t("punchIdleStatus");
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
  row.innerHTML=`<input type="time" class="stdBreakOut" value="${out}" aria-label="${t("ariaBreakStartStd")}">
    <input type="time" class="stdBreakIn" value="${inn}" aria-label="${t("ariaBreakEndStd")}">
    <button type="button" class="smallBtn" aria-label="${t("ariaRemoveBreak")}">✕</button>`;
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
  const bt=lastBackupAt();
  const age=backupAgeDays();
  const when=bt?new Date(bt).toLocaleDateString(LOCALES[LANG]):"";
  const line=$("backupReminder");
  if(line){
    if(!bt)line.textContent=t("backupNoneYet");
    else if(age>=BACKUP_REMINDER_DAYS)line.textContent=t("backupOld",{when,age});
    else line.textContent=t("backupOk",{when,age});
  }
  const alertBox=$("homeBackupAlert");
  if(alertBox){
    const overdue=totalDayRecords()>0&&(!bt||age>=BACKUP_REMINDER_DAYS);
    alertBox.classList.toggle("hidden",!overdue);
    if(overdue){
      $("homeBackupText").textContent=!bt
        ? t("homeBackupNever")
        : t("homeBackupOld",{age,when});
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
        <div class="metricCard"><div class="metricTitle">${t("annGross")}</div><strong>${hasGross?money(gross):"—"}</strong></div>
        <div class="metricCard"><div class="metricTitle">${t("annNet")}</div><strong>${hasNet?money(net):"—"}</strong></div>
        <div class="metricCard"><div class="metricTitle">${t("annDays")}</div><strong>${days}</strong></div>
        <div class="metricCard"><div class="metricTitle">${t("annHours")}</div><strong>${fmtHours(hours)}</strong></div>
        <div class="metricCard"><div class="metricTitle">${t("annOt")}</div><strong>${fmtHours(overtime)}</strong></div>
        <div class="metricCard"><div class="metricTitle">${t("annYukiu")}</div><strong>${t("annYukiuVal",{v:fmtDays(yk)})}</strong></div>
      </div>
    </div>`;
  }).join("");
  const couple=employees.length>1
    ? `<div class="metricCard totalCard annualTotal"><div class="metricTitle">${t("annCoupleTotal",{year:annualYear})}</div><strong>${anyNet?money(totNet):"—"}</strong><span>${t("annCoupleGross",{gross:anyGross?money(totGross):"—"})}</span></div>`
    : "";
  box.innerHTML=blocks+couple+`<p class="dashboardNote">${t("annNote")}</p>`;
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
  $("backupStatus").textContent=t("exportDone",{days});
  renderBackupReminder();
}
function importBackupFile(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const backup=JSON.parse(String(reader.result||""));
      const days=countBackupDays(backup.data);
      const when=backup.exportedAt?new Date(backup.exportedAt).toLocaleDateString(LOCALES[LANG]):t("unknownDate");
      if(!confirm(t("importConfirm",{when,days})))return;
      applyBackup(backup);
      $("backupStatus").textContent=t("importDone");
      setTimeout(()=>location.reload(),600);
    }catch(e){
      alert(t("invalidBackup"));
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
      if(!plan.length){alert(t("mergeNoData"));return;}
      const when=backup.exportedAt?new Date(backup.exportedAt).toLocaleDateString(LOCALES[LANG]):t("unknownDate");
      const desc=plan.map(p=>{
        const found=employees.some(e=>mergeNormName(e.name)===mergeNormName(p.emp.name));
        return t("mergeLine",{name:p.emp.name,days:p.days.length,tag:found?"":t("mergeNewTag")});
      }).join("\n");
      if(!confirm(t("mergeConfirm",{when,desc})))return;
      const res=applyMerge(backup);
      $("backupStatus").textContent=t("mergeDone",{days:res.totalDays});
      setTimeout(()=>location.reload(),600);
    }catch(e){
      alert(t("invalidBackup"));
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
  $("monthLabel").textContent=viewDate.toLocaleDateString(LOCALES[LANG],{month:"long",year:"numeric"});
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
  out.type="time";out.value=outVal;out.setAttribute("aria-label",t("ariaBreakStart"));
  const inn=document.createElement("input");
  inn.type="time";inn.value=inVal;inn.setAttribute("aria-label",t("ariaBreakEnd"));
  const del=document.createElement("button");
  del.type="button";del.className="smallBtn";del.textContent="✕";
  del.setAttribute("aria-label",t("ariaRemoveBreak"));
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
  $("editorDate").textContent=new Date(y,m,d).toLocaleDateString(LOCALES[LANG],{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"});
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
  const ykLabel=yk===0.5?t("halfDay"):t("fullDay");
  if(!c.worked&&yk){
    $("daySummary").textContent=t("editorYukiuSummary",{label:ykLabel});
    return;
  }
  const br=c.break?t("sumBreak",{hours:fmtHours(c.break/60)}):"";
  const extra=c.overtime?t("sumOvertime",{hours:fmtHours(c.overtime)}):"";
  const offText=c.off?t("sumOff",{rate:c.offRate}):"";
  const night=c.night?t("sumNight",{hours:fmtHours(c.night)}):"";
  const nd=c.nightDay?t("sumNightDay"):"";
  const ykText=yk?t("sumYukiu",{label:ykLabel}):"";
  $("daySummary").textContent=c.worked?`${t("sumWorked",{hours:fmtHours(c.hours)})}${br}${extra}${offText}${night}${nd}${ykText}`:t("sumFillInOut");
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
  if(!yukiu&&(!data.in||!data.out)){alert(t("alertInOut"));return}
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
    const offBadge=typeof data.off==="number"?(data.off===0?t("histOffNormal"):t("histOffPct",{rate:data.off})):"";
    if(c.worked)times.textContent=`${data.in} → ${data.out}${offBadge}${yk?t("histYukiu",{label:yk===0.5?t("halfDay"):t("fullDay")}):""}${data.note?" · "+data.note:""}`;
    else times.textContent=`${t("histYukiuOnly",{label:yk===0.5?t("halfDay"):t("fullDay")})}${data.note?" · "+data.note:""}`;
    const hours=document.createElement("div");hours.className="hours";hours.textContent=c.worked?fmtHours(c.hours):"🏖️";
    row.append(date,times,hours);row.onclick=()=>openDay(key);row.style.cursor="pointer";h.appendChild(row);
  }
  if(!rows)h.innerHTML=`<div class="empty">${t("histEmpty")}</div>`;
  $("monthTotals").textContent=t("totalsLine",{days,hours:fmtHours(total),normal:fmtHours(normalTotal),overtime:fmtHours(overtimeTotal),off:offTotal?t("totalsOff",{hours:fmtHours(offTotal)}):"",night:fmtHours(nightTotal),nightDays,yukiu:yukiuMonth?t("totalsYukiu",{days:fmtDays(yukiuMonth)}):""});
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
  return new Date(y,m-1,1).toLocaleDateString(LOCALES[LANG],{month:"short",year:"2-digit"}).replace(".", "");
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
  return Math.round(v).toLocaleString(LOCALES[LANG]);
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
    return `<div class="barItem" data-month="${x.key}" title="${t("viewDaysTitle")}">
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
      <div><h2>${t("dashTitle")}</h2><p>${t("dashSubtitle")}</p></div>
    </div>
    <div class="metricGrid">
      ${renderMetricCard(t("metricGrossMonth"),make("gross","money"),"money")}
      ${renderMetricCard(t("metricNetMonth"),make("net","money"),"money")}
      ${renderMetricCard(t("metricHoursWorked"),make("hours","hours"),"hours")}
      ${renderMetricCard(t("metricOt"),make("overtime","hours"),"hours")}
      ${renderMetricCard(t("metricNight"),make("night","hours"),"hours")}
      ${renderMetricCard(t("metricDaysWorked"),make("days","number"),"number")}
    </div>
    ${renderChart(t("chartGross"),make("gross","money"),"money")}
    ${renderChart(t("chartNet"),make("net","money"),"money")}
    ${renderChart(t("chartHours"),make("hours","hours"),"hours")}
    ${renderChart(t("chartOt"),make("overtime","hours"),"hours")}
    ${renderChart(t("chartNight"),make("night","hours"),"hours")}
    ${renderChart(t("chartDays"),make("days","number"),"number")}
    <div class="dashboardNote">${t("dashNote",{month:monthName(monthlyKey())})}</div>`;
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
    return `<div class="barItem" data-month="${series[0].keys[i]}" title="${t("viewDaysTitle")}"><div class="pairWrap">${cols}</div><div class="barLabel">${lab}</div></div>`;
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
      <div class="metricTitle"><span class="dot" style="background:${emp.color}"></span> ${esc(emp.name)}${emp.id===activeEmployee.id?t("empActiveSuffix"):""}</div>
      <strong>${s.net==null?"—":money(s.net)}</strong>
      <span>${t("coupleCardLine",{gross:s.gross==null?"—":money(s.gross),days:s.days})}</span>
    </div>`).join("");
  const series=field=>perEmp.map(({emp,stats})=>({
    name:emp.name,color:emp.color,values:stats.map(s=>s[field]),keys:months
  }));
  const manage=employeeManageHTML();
  const hc=$("homeCouple");
  if(hc){
    hc.innerHTML=`
      <div class="metricTitle">${t("coupleTotalTitle",{month:monthName(monthlyKey())})}</div>
      <strong class="homeCoupleValue">${money(totalNet)}</strong>
      <span>${sel.map(({emp,s})=>`${esc(emp.name)} ${s.net==null?"—":money(s.net)}`).join(" + ")}</span>`;
  }
  box.innerHTML=`
    <div class="sectionHead dashboardHead">
      <div><h2>${t("coupleTitle")}</h2><p>${t("coupleSubtitle")}</p></div>
    </div>
    <div class="metricGrid">
      ${cards}
      <div class="metricCard totalCard">
        <div class="metricTitle">${t("coupleTotalTitle",{month:monthName(monthlyKey())})}</div>
        <strong>${money(totalNet)}</strong>
        <span>${missing.length?t("coupleNoData",{names:missing.map(esc).join(", ")}):t("coupleSumNote")}</span>
      </div>
    </div>
    ${renderPairChart(t("chartGross"),labels,series("gross"),"money")}
    ${renderPairChart(t("chartNet"),labels,series("net"),"money")}
    <div class="dashboardNote">${t("coupleNote",{month:monthName(monthlyKey())})}</div>
    <h4 class="empManageTitle">${t("manageTitle")}</h4>
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
      <strong>${esc(e.name)}</strong>${e.id===activeEmployee.id?`<span class="empBadge">${t("empActiveBadge")}</span>`:""}
      <span class="empBtns"><button type="button" class="smallBtn" data-act="rename" data-id="${e.id}">${t("btnRename")}</button>${e.id!=="principal"?`<button type="button" class="smallBtn" data-act="delete" data-id="${e.id}">${t("btnDeleteEmp")}</button>`:""}</span>
    </div>`).join("");
  return rows+`<button type="button" class="smallBtn" data-act="add">${t("btnAddEmp")}</button>`;
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
  const name=(prompt(t("promptEmpName"))||"").trim();
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
  const name=(prompt(t("promptEmpRename"),emp.name)||"").trim();
  if(!name)return;
  emp.name=name;
  saveEmployees();
  renderEmployeeSelect();
  renderDashboard();
}
function deleteEmployee(id){
  const emp=employees.find(e=>e.id===id);
  if(!emp)return;
  if(emp.id==="principal"){alert(t("alertPrincipalDelete"));return;}
  if(emp.id===activeEmployee.id){alert(t("alertActiveDelete"));return;}
  if(!confirm(t("confirmDeleteEmp",{name:emp.name})))return;
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
  $("mandatoryLabel").textContent=detailed?t("dedMandatory"):t("dedEstimated");
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
applyLang();
$("langSelect").onchange=e=>{localStorage.setItem(LANG_KEY,e.target.value);location.reload();};
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
