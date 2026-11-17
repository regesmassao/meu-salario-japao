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
employerNameLbl:"🏭 Empresa atual",
employerNamePh:"Nome da empresa onde você trabalha agora",
psEmployerLbl:"Empresa deste holerite",
pairTapHint:"Toque num mês para ver os valores",
pairCombined:"Juntos",
sumDayPay:" · 💴 {v}",
totalsEarned:" · 💴 Acumulado do mês: {v}",
slipCardTitle:"🧾 Holerite do mês",
slipIntro:"Ao receber o holerite, fotografe ele aqui: o app lê os totais, grava o mês com os valores oficiais e explica cada linha.",
slipBtn:"📷 Ler holerite de {month}",
slipHint:"Dica de foto: aproxime bem os quadros de totais (parte de cima do holerite), com boa luz e a folha reta. A foto fica só no seu aparelho.",
raioxBtn:"🔍 Raio-X deste mês",
slipChecked:"✔️ Mês conferido pelo holerite em {date}",
ocrEngine:"Baixando o leitor de japonês… (só na primeira vez; precisa de internet)",
ocrReading:"Lendo a foto… {pct}%",
ocrFail:"Não consegui ler tudo desta foto. Confira e complete os valores abaixo — dá pra salvar mesmo assim.",
reviewTitle:"Confira a leitura e corrija o que estiver errado",
psGrossLbl:"Bruto total (¥)",
psNetLbl:"Líquido (¥)",
psDaysLbl:"Dias trabalhados",
psOtLbl:"Horas extras (h)",
psNightLbl:"Horas noturnas (h)",
psEarnTitle:"💴 Pagamentos",
psDedTitle:"🧾 Descontos",
psAddLine:"＋ Adicionar linha",
psCustom:"Outro (digitar o nome)",
psLineName:"Nome da linha (como está no holerite)",
psSaveBtn:"Salvar leitura do mês",
psCancelBtn:"Cancelar",
psCheckOk:"✔️ As contas fecham com os totais.",
psCheckWarn:"⚠️ Diferença de {diff} entre as linhas e os totais — confira no holerite original.",
slipDisclaimer:"Guarde o holerite original (papel ou PDF da empresa). Este app apenas organiza e explica as informações — ele não substitui o documento oficial. Para prefeitura, impostos ou qualquer questão com o empregador, vale sempre o original.",
raioxTitle:"🔍 Raio-X de {month}",
raioxUnknown:"Item não reconhecido",
raioxUnknownNote:"Confira este item no holerite original ou pergunte ao empregador.",
raioxDisclaimer:"Explicação educativa, a partir da leitura salva. Não substitui o holerite original nem orientação profissional (contador, advogado ou Hello Work).",
raioxClose:"Fechar",
psSavedMsg:"Leitura salva! O mês agora usa os valores do holerite.",
psNeedValues:"Preencha pelo menos o bruto e o líquido para salvar.",
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
mergeDone:"Backup juntado com sucesso: {days} dia(s) incorporados. Recarregando o app…",
driveTitle:"☁️ Nuvem (Google Drive)",
driveDesc:"Guarde o backup num arquivo no SEU Google Drive, usando a sua ponte (script). O app fala só com o seu script: enviar manda o backup atual pra nuvem; baixar junta o backup da nuvem com os dados deste aparelho, sem apagar nada.",
driveUrlLbl:"Link do script",
driveUrlPh:"Cole o link do script (termina em /exec)",
driveKeyLbl:"Chave secreta",
driveKeyPh:"A mesma chave colocada no script",
driveSaveBtn:"Salvar link e chave",
driveSaved:"✔️ Link e chave salvos neste aparelho.",
driveUpBtn:"⬆️ Enviar backup pra nuvem",
driveDownBtn:"⬇️ Baixar da nuvem e juntar",
driveSyncLine:"Envio: {up} · Baixa: {down}",
driveNever:"nunca",
driveNeedConfig:"Primeiro cole o link do script e a chave secreta, e toque em Salvar.",
driveSending:"Enviando pra nuvem…",
driveUpDone:"✔️ Backup enviado pra nuvem com {days} dia(s).",
driveReading:"Consultando a nuvem…",
driveNoRemote:"Ainda não há backup na nuvem. Envie o primeiro pelo botão de enviar.",
driveUnauthorized:"❌ O script recusou a chave. Confira se a chave salva aqui é igual à chave do script.",
driveNetError:"❌ Não consegui falar com o script. Confira o link e a conexão com a internet.",
driveBadData:"❌ O que veio da nuvem não é um backup válido. Nada foi alterado.",
driveNewer:"☁️ Há um backup mais novo na nuvem (de {date}). Se quiser trazer pra este aparelho, toque em “Baixar da nuvem e juntar”.",
driveDismiss:"Fechar aviso"
},
ja:{
appSubtitle:"給与計算と勤務管理",
copyrightLine:"© 2026 Reges Massao da Costa — 無断転載・複製を禁じます",
employerNameLbl:"🏭 現在の勤務先",
employerNamePh:"今働いている会社名",
psEmployerLbl:"この明細の会社",
pairTapHint:"月をタップすると金額が表示されます",
pairCombined:"合計",
sumDayPay:" · 💴 {v}",
totalsEarned:" · 💴 月の累計：{v}",
slipCardTitle:"🧾 今月の給与明細",
slipIntro:"給与明細を受け取ったら写真を撮ってください。合計を読み取り、正式な金額で月を保存し、各項目を説明します。",
slipBtn:"📷 {month}の明細を読む",
slipHint:"撮影のコツ：明細の上部にある合計欄に近づけて、明るい場所でまっすぐ撮ってください。写真は端末の中だけに残ります。",
raioxBtn:"🔍 今月の明細チェック",
slipChecked:"✔️ {date}に明細で確認済み",
ocrEngine:"日本語リーダーをダウンロード中…（初回のみ・要インターネット）",
ocrReading:"写真を読み取り中… {pct}%",
ocrFail:"この写真では全部読めませんでした。下の金額を確認・入力してください。そのまま保存できます。",
reviewTitle:"読み取り結果を確認し、間違いを直してください",
psGrossLbl:"総支給額 (¥)",
psNetLbl:"差引支給額 (¥)",
psDaysLbl:"出勤日数",
psOtLbl:"残業時間 (h)",
psNightLbl:"深夜時間 (h)",
psEarnTitle:"💴 支給",
psDedTitle:"🧾 控除",
psAddLine:"＋ 行を追加",
psCustom:"その他（名前を入力）",
psLineName:"項目名（明細の表記どおり）",
psSaveBtn:"この月の読み取りを保存",
psCancelBtn:"キャンセル",
psCheckOk:"✔️ 合計と一致しています。",
psCheckWarn:"⚠️ 項目と合計に{diff}の差があります — 元の明細で確認してください。",
slipDisclaimer:"給与明細の原本（紙または会社のPDF）は必ず保管してください。このアプリは情報の整理と説明のためのもので、公式書類の代わりにはなりません。役所・税金・会社との手続きでは常に原本が有効です。",
raioxTitle:"🔍 {month}の明細チェック",
raioxUnknown:"不明な項目",
raioxUnknownNote:"元の明細で確認するか、会社に聞いてください。",
raioxDisclaimer:"保存した読み取りに基づく説明です。原本や専門家（税理士・弁護士・ハローワーク）の代わりにはなりません。",
raioxClose:"閉じる",
psSavedMsg:"保存しました。この月は明細の金額で表示されます。",
psNeedValues:"保存には総支給額と差引支給額が必要です。",
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
mergeDone:"合体が完了しました：{days} 日分を取り込みました。アプリを再読み込みします…",
driveTitle:"☁️ クラウド (Google Drive)",
driveDesc:"あなたの Google ドライブ内のファイルに、あなたのブリッジ（スクリプト）経由でバックアップを保存します。アプリが通信するのはあなたのスクリプトだけです。送信すると現在のバックアップがクラウドへ送られ、ダウンロードするとクラウドのバックアップをこの端末のデータに合体します（何も削除されません）。",
driveUrlLbl:"スクリプトのリンク",
driveUrlPh:"スクリプトのリンクを貼り付け（末尾は /exec）",
driveKeyLbl:"秘密キー",
driveKeyPh:"スクリプトに入れたのと同じキー",
driveSaveBtn:"リンクとキーを保存",
driveSaved:"✔️ リンクとキーをこの端末に保存しました。",
driveUpBtn:"⬆️ バックアップをクラウドへ送信",
driveDownBtn:"⬇️ クラウドからダウンロードして合体",
driveSyncLine:"送信: {up} · 取得: {down}",
driveNever:"まだ",
driveNeedConfig:"まずスクリプトのリンクと秘密キーを貼り付けて「保存」を押してください。",
driveSending:"クラウドへ送信中…",
driveUpDone:"✔️ バックアップをクラウドへ送信しました（{days} 日分）。",
driveReading:"クラウドを確認中…",
driveNoRemote:"クラウドにはまだバックアップがありません。送信ボタンで最初のバックアップを送ってください。",
driveUnauthorized:"❌ スクリプトにキーを拒否されました。保存したキーがスクリプトのキーと同じか確認してください。",
driveNetError:"❌ スクリプトに接続できませんでした。リンクとインターネット接続を確認してください。",
driveBadData:"❌ クラウドから来たデータは有効なバックアップではありません。何も変更されていません。",
driveNewer:"☁️ クラウドにもっと新しいバックアップがあります（{date}）。この端末に取り込む場合は「クラウドからダウンロードして合体」を押してください。",
driveDismiss:"お知らせを閉じる"
},
en:{
appSubtitle:"Salary calculator & work log",
copyrightLine:"© 2026 Reges Massao da Costa — All rights reserved",
employerNameLbl:"🏭 Current employer",
employerNamePh:"Name of the company you work at now",
psEmployerLbl:"Employer on this payslip",
pairTapHint:"Tap a month to see the values",
pairCombined:"Together",
sumDayPay:" · 💴 {v}",
totalsEarned:" · 💴 Month so far: {v}",
slipCardTitle:"🧾 This month's payslip",
slipIntro:"When your payslip arrives, photograph it here: the app reads the totals, saves the month with the official values and explains each line.",
slipBtn:"📷 Read the {month} payslip",
slipHint:"Photo tip: get close to the totals boxes (top of the payslip), with good light and the page flat. The photo never leaves your phone.",
raioxBtn:"🔍 This month's payslip X-ray",
slipChecked:"✔️ Month checked against the payslip on {date}",
ocrEngine:"Downloading the Japanese reader… (first time only; needs internet)",
ocrReading:"Reading the photo… {pct}%",
ocrFail:"I couldn't read everything in this photo. Check and complete the values below — you can still save.",
reviewTitle:"Check the reading and fix anything wrong",
psGrossLbl:"Gross total (¥)",
psNetLbl:"Net pay (¥)",
psDaysLbl:"Days worked",
psOtLbl:"Overtime hours (h)",
psNightLbl:"Night hours (h)",
psEarnTitle:"💴 Payments",
psDedTitle:"🧾 Deductions",
psAddLine:"＋ Add line",
psCustom:"Other (type the name)",
psLineName:"Line name (as on the payslip)",
psSaveBtn:"Save this month's reading",
psCancelBtn:"Cancel",
psCheckOk:"✔️ The lines match the totals.",
psCheckWarn:"⚠️ A {diff} difference between lines and totals — check the original payslip.",
slipDisclaimer:"Keep the original payslip (paper or the company's PDF). This app only organises and explains the information — it does not replace the official document. For city hall, taxes or any matter with your employer, the original always prevails.",
raioxTitle:"🔍 {month} payslip X-ray",
raioxUnknown:"Unrecognised item",
raioxUnknownNote:"Check this item on the original payslip or ask your employer.",
raioxDisclaimer:"Educational explanation based on the saved reading. It does not replace the original payslip or professional advice (accountant, lawyer or Hello Work).",
raioxClose:"Close",
psSavedMsg:"Reading saved! This month now uses the payslip values.",
psNeedValues:"Fill in at least the gross and net to save.",
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
mergeDone:"Backup merged successfully: {days} day(s) added. Reloading the app…",
driveTitle:"☁️ Cloud (Google Drive)",
driveDesc:"Keep the backup in a file in YOUR Google Drive, through your own bridge (script). The app talks only to your script: sending uploads the current backup to the cloud; downloading merges the cloud backup with this device's data, deleting nothing.",
driveUrlLbl:"Script link",
driveUrlPh:"Paste the script link (ends in /exec)",
driveKeyLbl:"Secret key",
driveKeyPh:"The same key you put in the script",
driveSaveBtn:"Save link and key",
driveSaved:"✔️ Link and key saved on this device.",
driveUpBtn:"⬆️ Send backup to the cloud",
driveDownBtn:"⬇️ Download from cloud and merge",
driveSyncLine:"Sent: {up} · Downloaded: {down}",
driveNever:"never",
driveNeedConfig:"First paste the script link and the secret key, then tap Save.",
driveSending:"Sending to the cloud…",
driveUpDone:"✔️ Backup sent to the cloud with {days} day(s).",
driveReading:"Checking the cloud…",
driveNoRemote:"There is no backup in the cloud yet. Send the first one with the send button.",
driveUnauthorized:"❌ The script refused the key. Check that the saved key matches the key in the script.",
driveNetError:"❌ Couldn't reach the script. Check the link and your internet connection.",
driveBadData:"❌ What came from the cloud is not a valid backup. Nothing was changed.",
driveNewer:"☁️ There is a newer backup in the cloud (from {date}). To bring it to this device, tap “Download from cloud and merge”.",
driveDismiss:"Dismiss notice"
},
vi:{
appSubtitle:"Tính lương & quản lý giờ làm",
copyrightLine:"© 2026 Reges Massao da Costa — Mọi quyền được bảo lưu",
employerNameLbl:"🏭 Công ty hiện tại",
employerNamePh:"Tên công ty bạn đang làm việc",
psEmployerLbl:"Công ty trên phiếu này",
pairTapHint:"Chạm vào một tháng để xem số tiền",
pairCombined:"Tổng cộng",
sumDayPay:" · 💴 {v}",
totalsEarned:" · 💴 Lũy kế tháng: {v}",
slipCardTitle:"🧾 Phiếu lương tháng này",
slipIntro:"Khi nhận phiếu lương, hãy chụp tại đây: ứng dụng đọc tổng số, lưu tháng với giá trị chính thức và giải thích từng dòng.",
slipBtn:"📷 Đọc phiếu lương {month}",
slipHint:"Mẹo chụp: lại gần các ô tổng (phần trên của phiếu lương), đủ sáng và giấy phẳng. Ảnh chỉ ở trong máy của bạn.",
raioxBtn:"🔍 Soi phiếu lương tháng này",
slipChecked:"✔️ Đã đối chiếu phiếu lương ngày {date}",
ocrEngine:"Đang tải bộ đọc tiếng Nhật… (chỉ lần đầu; cần internet)",
ocrReading:"Đang đọc ảnh… {pct}%",
ocrFail:"Không đọc hết được ảnh này. Hãy kiểm tra và bổ sung các giá trị bên dưới — vẫn lưu được.",
reviewTitle:"Kiểm tra kết quả đọc và sửa chỗ sai",
psGrossLbl:"Tổng lương gộp (¥)",
psNetLbl:"Lương thực nhận (¥)",
psDaysLbl:"Số ngày làm",
psOtLbl:"Giờ tăng ca (h)",
psNightLbl:"Giờ ban đêm (h)",
psEarnTitle:"💴 Các khoản trả",
psDedTitle:"🧾 Các khoản trừ",
psAddLine:"＋ Thêm dòng",
psCustom:"Khác (tự nhập tên)",
psLineName:"Tên dòng (như trên phiếu lương)",
psSaveBtn:"Lưu kết quả đọc tháng này",
psCancelBtn:"Hủy",
psCheckOk:"✔️ Các dòng khớp với tổng.",
psCheckWarn:"⚠️ Chênh lệch {diff} giữa các dòng và tổng — kiểm tra phiếu lương gốc.",
slipDisclaimer:"Hãy giữ phiếu lương gốc (bản giấy hoặc PDF của công ty). Ứng dụng này chỉ sắp xếp và giải thích thông tin — không thay thế tài liệu chính thức. Với tòa thị chính, thuế hoặc việc với công ty, bản gốc luôn có giá trị.",
raioxTitle:"🔍 Soi phiếu lương {month}",
raioxUnknown:"Mục chưa nhận biết",
raioxUnknownNote:"Kiểm tra mục này trên phiếu lương gốc hoặc hỏi công ty.",
raioxDisclaimer:"Giải thích mang tính tham khảo, dựa trên kết quả đọc đã lưu. Không thay thế phiếu lương gốc hay tư vấn chuyên môn (kế toán, luật sư, Hello Work).",
raioxClose:"Đóng",
psSavedMsg:"Đã lưu! Tháng này dùng giá trị từ phiếu lương.",
psNeedValues:"Hãy nhập ít nhất lương gộp và thực nhận để lưu.",
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
mergeDone:"Đã gộp sao lưu thành công: thêm {days} ngày. Đang tải lại ứng dụng…",
driveTitle:"☁️ Đám mây (Google Drive)",
driveDesc:"Giữ bản sao lưu trong một tệp trên Google Drive CỦA BẠN, qua cầu nối (script) của bạn. Ứng dụng chỉ liên lạc với script của bạn: gửi lên sẽ tải bản sao lưu hiện tại lên đám mây; tải về sẽ gộp bản sao lưu trên đám mây với dữ liệu của thiết bị này, không xóa gì cả.",
driveUrlLbl:"Liên kết script",
driveUrlPh:"Dán liên kết script (kết thúc bằng /exec)",
driveKeyLbl:"Khóa bí mật",
driveKeyPh:"Cùng khóa đã đặt trong script",
driveSaveBtn:"Lưu liên kết và khóa",
driveSaved:"✔️ Đã lưu liên kết và khóa trên thiết bị này.",
driveUpBtn:"⬆️ Gửi sao lưu lên đám mây",
driveDownBtn:"⬇️ Tải từ đám mây về và gộp",
driveSyncLine:"Đã gửi: {up} · Đã tải: {down}",
driveNever:"chưa bao giờ",
driveNeedConfig:"Trước tiên hãy dán liên kết script và khóa bí mật, rồi nhấn Lưu.",
driveSending:"Đang gửi lên đám mây…",
driveUpDone:"✔️ Đã gửi sao lưu lên đám mây với {days} ngày.",
driveReading:"Đang kiểm tra đám mây…",
driveNoRemote:"Chưa có sao lưu trên đám mây. Hãy gửi bản đầu tiên bằng nút gửi.",
driveUnauthorized:"❌ Script đã từ chối khóa. Kiểm tra khóa đã lưu có giống khóa trong script không.",
driveNetError:"❌ Không liên lạc được với script. Kiểm tra liên kết và kết nối internet.",
driveBadData:"❌ Dữ liệu từ đám mây không phải sao lưu hợp lệ. Không có gì thay đổi.",
driveNewer:"☁️ Có bản sao lưu mới hơn trên đám mây (từ {date}). Muốn đưa về thiết bị này, nhấn “Tải từ đám mây về và gộp”.",
driveDismiss:"Đóng thông báo"
},
ne:{
appSubtitle:"तलब क्याल्कुलेटर र कामको रेकर्ड",
copyrightLine:"© 2026 Reges Massao da Costa — सर्वाधिकार सुरक्षित",
employerNameLbl:"🏭 हालको कम्पनी",
employerNamePh:"तपाईं अहिले काम गर्ने कम्पनीको नाम",
psEmployerLbl:"यो पर्चीको कम्पनी",
pairTapHint:"रकम हेर्न महिनामा ट्याप गर्नुहोस्",
pairCombined:"जम्मा",
sumDayPay:" · 💴 {v}",
totalsEarned:" · 💴 महिनाको जम्मा: {v}",
slipCardTitle:"🧾 यो महिनाको तलब पर्ची",
slipIntro:"तलब पर्ची पाएपछि यहाँ फोटो खिच्नुहोस्: एपले जम्मा रकम पढ्छ, आधिकारिक मानहरूसहित महिना सुरक्षित गर्छ र प्रत्येक लाइन व्याख्या गर्छ।",
slipBtn:"📷 {month} को पर्ची पढ्नुहोस्",
slipHint:"फोटो टिप: जम्मा बक्सहरू (पर्चीको माथिल्लो भाग) नजिकबाट, राम्रो उज्यालोमा र पाना सिधा राखेर खिच्नुहोस्। फोटो तपाईंको फोनमै रहन्छ।",
raioxBtn:"🔍 यो महिनाको पर्ची विश्लेषण",
slipChecked:"✔️ {date} मा पर्चीसँग जाँचियो",
ocrEngine:"जापानी रिडर डाउनलोड हुँदैछ… (पहिलो पटक मात्र; इन्टरनेट चाहिन्छ)",
ocrReading:"फोटो पढ्दैछ… {pct}%",
ocrFail:"यो फोटोबाट सबै पढ्न सकिएन। तलका मानहरू जाँचेर पूरा गर्नुहोस् — तैपनि सुरक्षित गर्न सकिन्छ।",
reviewTitle:"पढेको नतिजा जाँच्नुहोस् र गल्ती सच्याउनुहोस्",
psGrossLbl:"कुल तलब (¥)",
psNetLbl:"शुद्ध तलब (¥)",
psDaysLbl:"काम गरेको दिन",
psOtLbl:"ओभरटाइम घण्टा (h)",
psNightLbl:"रातको घण्टा (h)",
psEarnTitle:"💴 भुक्तानीहरू",
psDedTitle:"🧾 कटौतीहरू",
psAddLine:"＋ लाइन थप्नुहोस्",
psCustom:"अन्य (नाम लेख्नुहोस्)",
psLineName:"लाइनको नाम (पर्चीमा भएजस्तै)",
psSaveBtn:"यो महिनाको नतिजा सुरक्षित गर्नुहोस्",
psCancelBtn:"रद्द गर्नुहोस्",
psCheckOk:"✔️ लाइनहरू जम्मासँग मिल्छन्।",
psCheckWarn:"⚠️ लाइन र जम्माबीच {diff} फरक छ — मूल पर्चीमा जाँच्नुहोस्।",
slipDisclaimer:"मूल तलब पर्ची (कागज वा कम्पनीको PDF) राख्नुहोस्। यो एपले जानकारी व्यवस्थित र व्याख्या मात्र गर्छ — आधिकारिक कागजातको विकल्प होइन। नगरपालिका, कर वा कम्पनीसँगको काममा सधैं मूल नै मान्य हुन्छ।",
raioxTitle:"🔍 {month} को पर्ची विश्लेषण",
raioxUnknown:"नचिनिएको 항목",
raioxUnknownNote:"यो 항목 मूल पर्चीमा जाँच्नुहोस् वा कम्पनीलाई सोध्नुहोस्।",
raioxDisclaimer:"सुरक्षित गरिएको नतिजामा आधारित शैक्षिक व्याख्या। मूल पर्ची वा व्यावसायिक सल्लाह (लेखापाल, वकिल, Hello Work) को विकल्प होइन।",
raioxClose:"बन्द गर्नुहोस्",
psSavedMsg:"सुरक्षित भयो! यो महिनामा अब पर्चीका मानहरू प्रयोग हुन्छन्।",
psNeedValues:"सुरक्षित गर्न कम्तिमा कुल र शुद्ध तलब भर्नुहोस्।",
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
mergeDone:"ब्याकअप सफलतापूर्वक मिल्यो: {days} दिन थपियो। एप पुनः लोड हुँदैछ…",
driveTitle:"☁️ क्लाउड (Google Drive)",
driveDesc:"तपाईंको आफ्नै ब्रिज (स्क्रिप्ट) मार्फत तपाईंको Google Drive मा रहेको फाइलमा ब्याकअप राख्नुहोस्। एपले तपाईंको स्क्रिप्टसँग मात्र कुरा गर्छ: पठाउँदा हालको ब्याकअप क्लाउडमा जान्छ; डाउनलोड गर्दा क्लाउडको ब्याकअप यो उपकरणको डेटासँग मिल्छ, केही पनि मेटिँदैन।",
driveUrlLbl:"स्क्रिप्टको लिङ्क",
driveUrlPh:"स्क्रिप्टको लिङ्क टाँस्नुहोस् (/exec मा सकिन्छ)",
driveKeyLbl:"गोप्य कुञ्जी",
driveKeyPh:"स्क्रिप्टमा राखेको उही कुञ्जी",
driveSaveBtn:"लिङ्क र कुञ्जी बचत गर्नुहोस्",
driveSaved:"✔️ लिङ्क र कुञ्जी यो उपकरणमा बचत भयो।",
driveUpBtn:"⬆️ ब्याकअप क्लाउडमा पठाउनुहोस्",
driveDownBtn:"⬇️ क्लाउडबाट डाउनलोड गरेर मिलाउनुहोस्",
driveSyncLine:"पठाएको: {up} · डाउनलोड: {down}",
driveNever:"कहिल्यै छैन",
driveNeedConfig:"पहिले स्क्रिप्टको लिङ्क र गोप्य कुञ्जी टाँसेर बचत थिच्नुहोस्।",
driveSending:"क्लाउडमा पठाउँदै…",
driveUpDone:"✔️ {days} दिनसहित ब्याकअप क्लाउडमा पठाइयो।",
driveReading:"क्लाउड जाँच गर्दै…",
driveNoRemote:"क्लाउडमा अझै ब्याकअप छैन। पठाउने बटनले पहिलो पठाउनुहोस्।",
driveUnauthorized:"❌ स्क्रिप्टले कुञ्जी अस्वीकार गर्यो। बचत गरेको कुञ्जी स्क्रिप्टको कुञ्जीसँग मिल्छ कि जाँच्नुहोस्।",
driveNetError:"❌ स्क्रिप्टसँग कुरा गर्न सकिएन। लिङ्क र इन्टरनेट जाँच्नुहोस्।",
driveBadData:"❌ क्लाउडबाट आएको डेटा मान्य ब्याकअप होइन। केही परिवर्तन भएन।",
driveNewer:"☁️ क्लाउडमा नयाँ ब्याकअप छ ({date} को)। यो उपकरणमा ल्याउन “क्लाउडबाट डाउनलोड गरेर मिलाउनुहोस्” थिच्नुहोस्।",
driveDismiss:"सूचना बन्द गर्नुहोस्"
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
// Chaves da nuvem (V6.0): link/chave do script-ponte e marcas de
// sincronização são DESTE aparelho — nunca entram no backup (a chave
// secreta não pode viajar dentro de um arquivo exportado) e nunca
// são tocadas pelas importações.
const DRIVE_KEYS=["msj-driveUrl","msj-driveKey","msj-driveLastUp","msj-driveLastDown","msj-driveRemoteAt"];
function collectBackup(){
  const data={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith(BACKUP_PREFIX)&&!DRIVE_KEYS.includes(k))data[k]=localStorage.getItem(k);
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
  // Defesa extra (V6.0): as chaves da nuvem deste aparelho são
  // preservadas na troca e as que vierem dentro do arquivo são
  // descartadas — a configuração da nuvem é de cada aparelho.
  const savedDrive={};
  DRIVE_KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v!=null)savedDrive[k]=v;});
  const keys=Object.keys(backup.data).filter(k=>k.startsWith(BACKUP_PREFIX)&&!DRIVE_KEYS.includes(k));
  const current=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith(BACKUP_PREFIX)&&!DRIVE_KEYS.includes(k))current.push(k);
  }
  current.forEach(k=>localStorage.removeItem(k));
  keys.forEach(k=>localStorage.setItem(k,String(backup.data[k])));
  Object.keys(savedDrive).forEach(k=>localStorage.setItem(k,savedDrive[k]));
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
// ---------- Nuvem: backup no Google Drive (V6.0) ----------
// Uma ponte em Apps Script, na conta Google do próprio usuário,
// guarda UM arquivo de backup no Drive dele. O app fala com a
// ponte por fetch: GET ?key=&action=read devolve {ok, exists,
// updatedAt, data}; POST ?key=&action=write (corpo = o JSON do
// backup, como texto puro, pra não disparar preflight de CORS)
// devolve {ok, updatedAt}. Link e chave ficam salvos só neste
// aparelho (chaves msj-drive*, fora de qualquer backup).
function driveConfig(){
  return {
    url:String(localStorage.getItem("msj-driveUrl")||"").trim(),
    key:String(localStorage.getItem("msj-driveKey")||"").trim()
  };
}
function driveApiUrl(action){
  const c=driveConfig();
  const sep=c.url.includes("?")?"&":"?";
  return c.url+sep+"key="+encodeURIComponent(c.key)+"&action="+action;
}
function driveSetStatus(msg){
  const el=$("driveStatus");
  if(el)el.textContent=msg;
}
function driveFmtWhen(ts){
  const n=Number(ts||0);
  return n>0?new Date(n).toLocaleString(LOCALES[LANG]):t("driveNever");
}
function driveRenderSync(){
  const el=$("driveSync");
  if(!el)return;
  el.textContent=t("driveSyncLine",{
    up:driveFmtWhen(localStorage.getItem("msj-driveLastUp")),
    down:driveFmtWhen(localStorage.getItem("msj-driveLastDown"))
  });
}
function driveSaveConfig(){
  localStorage.setItem("msj-driveUrl",String($("driveUrl").value||"").trim());
  localStorage.setItem("msj-driveKey",String($("driveKey").value||"").trim());
  driveSetStatus(t("driveSaved"));
  driveCheckOnOpen();
}
async function driveFetchJson(url,options){
  let res;
  try{
    res=await fetch(url,options);
  }catch(e){
    throw new Error("network");
  }
  let body=null;
  try{body=await res.json();}catch(e){body=null;}
  if(!body||body.ok!==true){
    if(body&&body.error==="unauthorized")throw new Error("unauthorized");
    throw new Error("network");
  }
  return body;
}
function driveErrorStatus(e){
  driveSetStatus(e&&e.message==="unauthorized"?t("driveUnauthorized"):t("driveNetError"));
}
async function driveReadRemote(){
  return driveFetchJson(driveApiUrl("read"),{method:"GET"});
}
async function driveUpload(){
  const c=driveConfig();
  if(!c.url||!c.key){driveSetStatus(t("driveNeedConfig"));return;}
  driveSetStatus(t("driveSending"));
  // Como no exportar: a data do último backup é marcada ANTES de
  // montar o backup, pra ela viajar dentro do próprio arquivo.
  localStorage.setItem("msj-lastBackupAt",String(Date.now()));
  const backup=collectBackup();
  try{
    const r=await driveFetchJson(driveApiUrl("write"),{
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(backup)
    });
    localStorage.setItem("msj-driveLastUp",String(Date.now()));
    if(r.updatedAt)localStorage.setItem("msj-driveRemoteAt",String(r.updatedAt));
    driveSetStatus(t("driveUpDone",{days:countBackupDays(backup.data)}));
    driveRenderSync();
    renderBackupReminder();
    driveHideNotice();
  }catch(e){
    driveErrorStatus(e);
  }
}
async function driveDownload(){
  const c=driveConfig();
  if(!c.url||!c.key){driveSetStatus(t("driveNeedConfig"));return;}
  driveSetStatus(t("driveReading"));
  let r;
  try{
    r=await driveReadRemote();
  }catch(e){
    driveErrorStatus(e);
    return;
  }
  if(!r.exists||!r.data){driveSetStatus(t("driveNoRemote"));return;}
  const backup=r.data;
  if(!backup||typeof backup!=="object"||backup.app!=="meu-salario-japao"||!backup.data||typeof backup.data!=="object"){
    driveSetStatus(t("driveBadData"));
    return;
  }
  // Mesmo fluxo do "juntar backup de outro celular": mostra o
  // resumo, pede confirmação e incorpora SEM apagar nada local.
  let plan;
  try{
    plan=planMerge(backup);
  }catch(e){
    driveSetStatus(t("driveBadData"));
    return;
  }
  if(!plan.length){alert(t("mergeNoData"));driveSetStatus("");return;}
  const when=backup.exportedAt?new Date(backup.exportedAt).toLocaleDateString(LOCALES[LANG]):t("unknownDate");
  const desc=plan.map(p=>{
    const found=employees.some(e=>mergeNormName(e.name)===mergeNormName(p.emp.name));
    return t("mergeLine",{name:p.emp.name,days:p.days.length,tag:found?"":t("mergeNewTag")});
  }).join("\n");
  if(!confirm(t("mergeConfirm",{when,desc}))){driveSetStatus("");return;}
  const res=applyMerge(backup);
  localStorage.setItem("msj-driveLastDown",String(Date.now()));
  if(r.updatedAt)localStorage.setItem("msj-driveRemoteAt",String(r.updatedAt));
  driveSetStatus(t("mergeDone",{days:res.totalDays}));
  setTimeout(()=>location.reload(),600);
}
function driveShowNotice(iso){
  const box=$("driveNotice"),txt=$("driveNoticeText");
  if(!box||!txt)return;
  const d=iso?new Date(iso):null;
  txt.textContent=t("driveNewer",{date:d&&!isNaN(d)?d.toLocaleString(LOCALES[LANG]):String(iso||"")});
  box.classList.remove("hidden");
}
function driveHideNotice(){
  const box=$("driveNotice");
  if(box)box.classList.add("hidden");
}
async function driveCheckOnOpen(){
  const c=driveConfig();
  if(!c.url||!c.key)return;
  let r;
  try{
    r=await driveReadRemote();
  }catch(e){
    return; // silencioso: abrir o app nunca mostra erro da nuvem
  }
  if(!r.exists||!r.updatedAt)return;
  const known=String(localStorage.getItem("msj-driveRemoteAt")||"");
  if(String(r.updatedAt)!==known)driveShowNotice(r.updatedAt);
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
// Valor estimado de um dia trabalhado, pelas configurações do
// funcionário ativo: normais + extras (×1,25) + folga trabalhada
// (com o adicional daquele dia) + adicional noturno.
function dayPay(c){
  if(!c||!c.worked)return 0;
  const rate=hourlyRate();
  let v=(c.normal||0)*rate+(c.overtime||0)*rate*1.25+(c.off||0)*rate*(1+(c.offRate||0)/100)+(c.night||0)*rate*(val("nightPercent")/100);
  if(c.nightDay)v+=val("nightFixed");
  return v;
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
  const dp=c.worked?dayPay(c):0;
  const payText=dp>0?t("sumDayPay",{v:money(dp)}):"";
  $("daySummary").textContent=c.worked?`${t("sumWorked",{hours:fmtHours(c.hours)})}${br}${extra}${offText}${night}${nd}${ykText}${payText}`:t("sumFillInOut");
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
  let total=0,normalTotal=0,overtimeTotal=0,nightTotal=0,nightDays=0,days=0,rows=0,yukiuMonth=0,offTotal=0,offWeighted=0,earnedTotal=0;
  for(let d=1;d<=count;d++){
    const key=keyFor(y,m,d),data=dayData(key);
    if(!data)continue;
    const c=calcDay(data);
    const yk=Number(data.yukiu)||0;
    if(!c.worked&&!yk)continue;
    yukiuMonth+=yk;
    if(c.worked){days++;total+=c.hours;normalTotal+=c.normal;overtimeTotal+=c.overtime;nightTotal+=c.night;if(c.nightDay)nightDays++;offTotal+=c.off;offWeighted+=c.off*(1+(c.offRate||0)/100);earnedTotal+=dayPay(c);}
    rows++;
    const row=document.createElement("div");row.className="row";
    const date=document.createElement("div");date.textContent=String(d).padStart(2,"0")+"/"+String(m+1).padStart(2,"0");
    const times=document.createElement("div");
    const offBadge=typeof data.off==="number"?(data.off===0?t("histOffNormal"):t("histOffPct",{rate:data.off})):"";
    if(c.worked)times.textContent=`${data.in} → ${data.out}${offBadge}${yk?t("histYukiu",{label:yk===0.5?t("halfDay"):t("fullDay")}):""}${data.note?" · "+data.note:""}`;
    else times.textContent=`${t("histYukiuOnly",{label:yk===0.5?t("halfDay"):t("fullDay")})}${data.note?" · "+data.note:""}`;
    const hours=document.createElement("div");hours.className="hours";hours.textContent=c.worked?`${fmtHours(c.hours)} · ${money(dayPay(c))}`:"🏖️";
    row.append(date,times,hours);row.onclick=()=>openDay(key);row.style.cursor="pointer";h.appendChild(row);
  }
  if(!rows)h.innerHTML=`<div class="empty">${t("histEmpty")}</div>`;
  $("monthTotals").textContent=t("totalsLine",{days,hours:fmtHours(total),normal:fmtHours(normalTotal),overtime:fmtHours(overtimeTotal),off:offTotal?t("totalsOff",{hours:fmtHours(offTotal)}):"",night:fmtHours(nightTotal),nightDays,yukiu:yukiuMonth?t("totalsYukiu",{days:fmtDays(yukiuMonth)}):""});
  if(earnedTotal>0)$("monthTotals").textContent+=t("totalsEarned",{v:money(earnedTotal)});
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
// ===== V5.7: leitura do holerite (OCR) + Raio-X linha a linha =====
// Dicionário de termos de holerite japonês. match: nomes como aparecem
// no documento (o parser ignora espaços). name/desc/check nos 5 idiomas.
const PAYSLIP_TERMS=[
{id:"basePay",kind:"earn",match:["基本給","基本賃金"],
name:{pt:"Salário-base",ja:"基本給",en:"Base pay",vi:"Lương cơ bản",ne:"आधार तलब"},
desc:{pt:"O valor fixo do contrato, sem adicionais. Para quem recebe por hora, é horas normais × valor-hora.",ja:"契約で決まった固定給。時給の場合は通常時間×時給です。",en:"Your fixed contract pay, before extras. For hourly workers: normal hours × hourly rate.",vi:"Mức lương cố định theo hợp đồng, chưa gồm phụ cấp. Nếu tính theo giờ: giờ thường × lương giờ.",ne:"सम्झौताको निश्चित तलब, अतिरिक्त बिना। घण्टाको हिसाबले: सामान्य घण्टा × प्रति घण्टा दर।"},
check:{pt:"Confira se o valor-hora é o do contrato.",ja:"時給が契約どおりか確認しましょう。",en:"Check the hourly rate matches your contract.",vi:"Kiểm tra lương giờ có đúng hợp đồng không.",ne:"प्रति घण्टा दर सम्झौताअनुसार छ कि जाँच्नुहोस्।"}},
{id:"overtimePay",kind:"earn",match:["残業金額","残業手当","時間外手当","時間外勤務手当","残業代"],
name:{pt:"Horas extras",ja:"残業代",en:"Overtime pay",vi:"Tiền tăng ca",ne:"ओभरटाइम भुक्तानी"},
desc:{pt:"Pagamento pelas horas além da jornada normal, com adicional (em geral +25%).",ja:"所定時間を超えた労働への割増賃金です（通常+25%）。",en:"Pay for hours beyond the normal schedule, with a premium (usually +25%).",vi:"Tiền cho giờ làm ngoài giờ thường, có phụ cấp (thường +25%).",ne:"सामान्य समयभन्दा बढी कामको भुक्तानी, प्रिमियमसहित (सामान्यतया +25%)।"},
check:{pt:"Compare as horas extras com o seu controle no app.",ja:"アプリの記録と残業時間を比べましょう。",en:"Compare the overtime hours with your records in the app.",vi:"So sánh giờ tăng ca với ghi chép trong ứng dụng.",ne:"ओभरटाइम घण्टा एपको रेकर्डसँग तुलना गर्नुहोस्।"}},
{id:"nightPay",kind:"earn",match:["深夜金額","深夜手当","深夜勤務手当","深夜割増"],
name:{pt:"Adicional noturno",ja:"深夜手当",en:"Night premium",vi:"Phụ cấp ca đêm",ne:"राति प्रिमियम"},
desc:{pt:"Adicional pelo trabalho entre 22h e 5h (em geral +25% sobre a hora).",ja:"22時から5時までの労働への割増です（通常+25%）。",en:"Premium for work between 22:00 and 5:00 (usually +25% of the hourly rate).",vi:"Phụ cấp cho giờ làm từ 22h đến 5h (thường +25% lương giờ).",ne:"राति 22:00 देखि 5:00 सम्मको कामको प्रिमियम (सामान्यतया +25%)।"},
check:{pt:"Confira se os dias após 22h batem com o app.",ja:"22時以降働いた日がアプリと合うか確認しましょう。",en:"Check days worked past 22:00 match the app.",vi:"Kiểm tra ngày làm sau 22h có khớp ứng dụng không.",ne:"22:00 पछि काम गरेका दिनहरू एपसँग मिल्छन् कि जाँच्नुहोस्।"}},
{id:"holidayPay",kind:"earn",match:["休日出勤手当","法定休日","休日手当"],
name:{pt:"Folga trabalhada / feriado",ja:"休日出勤手当",en:"Day-off / holiday work",vi:"Làm ngày nghỉ / lễ",ne:"बिदाको दिन काम"},
desc:{pt:"Pagamento por trabalhar na folga ou feriado, com adicional (folga legal: +35%).",ja:"休日に働いた分の割増賃金です（法定休日は+35%）。",en:"Pay for working a day off or holiday, with a premium (statutory holiday: +35%).",vi:"Tiền làm vào ngày nghỉ hoặc lễ, có phụ cấp (ngày nghỉ luật định: +35%).",ne:"बिदा वा चाडपर्वमा काम गरेको भुक्तानी, प्रिमियमसहित (कानुनी बिदा: +35%)।"},
check:{pt:"Confira o percentual combinado com a empresa.",ja:"会社と約束した割増率を確認しましょう。",en:"Check the premium rate agreed with the company.",vi:"Kiểm tra tỉ lệ phụ cấp đã thỏa thuận với công ty.",ne:"कम्पनीसँग सहमति भएको प्रिमियम दर जाँच्नुहोस्।"}},
{id:"commute",kind:"earn",match:["通勤手当","交通費"],
name:{pt:"Ajuda de transporte",ja:"通勤手当",en:"Commuting allowance",vi:"Phụ cấp đi lại",ne:"यातायात भत्ता"},
desc:{pt:"Reembolso do trajeto casa–trabalho (passe, gasolina etc.).",ja:"自宅から職場までの交通費の支給です。",en:"Reimbursement for commuting (train pass, fuel, etc.).",vi:"Hỗ trợ chi phí đi lại nhà–nơi làm (vé tàu, xăng...).",ne:"घरदेखि कार्यस्थलसम्मको यातायात खर्च फिर्ता।"},
check:{pt:"Se mudou de endereço, avise a empresa: o valor pode mudar.",ja:"引っ越したら会社に伝えましょう。金額が変わることがあります。",en:"Moved house? Tell the company — the amount can change.",vi:"Chuyển nhà thì báo công ty — số tiền có thể thay đổi.",ne:"घर सर्नुभयो भने कम्पनीलाई भन्नुहोस् — रकम बदलिन सक्छ।"}},
{id:"housingAllow",kind:"earn",match:["住宅手当"],
name:{pt:"Ajuda de moradia",ja:"住宅手当",en:"Housing allowance",vi:"Phụ cấp nhà ở",ne:"आवास भत्ता"},
desc:{pt:"Benefício fixo da empresa para ajudar no aluguel.",ja:"家賃補助として会社が支給する手当です。",en:"A fixed company benefit toward your rent.",vi:"Phụ cấp cố định của công ty hỗ trợ tiền thuê nhà.",ne:"भाडामा सहयोगका लागि कम्पनीको निश्चित लाभ।"},
check:{pt:"Ele entra no seu planejamento mensal como renda fixa.",ja:"毎月の固定収入として計画に入れましょう。",en:"Count it as fixed income in your monthly planning.",vi:"Tính nó là thu nhập cố định trong kế hoạch tháng.",ne:"यसलाई मासिक योजनामा निश्चित आम्दानी मान्नुहोस्।"}},
{id:"familyAllow",kind:"earn",match:["家族手当","扶養手当"],
name:{pt:"Ajuda família",ja:"家族手当",en:"Family allowance",vi:"Phụ cấp gia đình",ne:"परिवार भत्ता"},
desc:{pt:"Benefício por dependentes (cônjuge/filhos), conforme a regra da empresa.",ja:"配偶者や子どもなど扶養家族への手当です（会社の規定によります）。",en:"Benefit for dependents (spouse/children), per company rules.",vi:"Phụ cấp cho người phụ thuộc (vợ/chồng/con), theo quy định công ty.",ne:"आश्रितहरूका लागि लाभ (पति/पत्नी/बच्चा), कम्पनीको नियमअनुसार।"},
check:{pt:"Nascimento ou mudança na família pode alterar o valor.",ja:"出産や家族の変化で金額が変わることがあります。",en:"A birth or family change can alter the amount.",vi:"Sinh con hoặc thay đổi gia đình có thể đổi số tiền.",ne:"जन्म वा परिवार परिवर्तनले रकम बदलिन सक्छ।"}},
{id:"mealAllow",kind:"earn",match:["食事手当","食費補助","昼食手当","食事補助"],
name:{pt:"Ajuda alimentação",ja:"食事手当",en:"Meal allowance",vi:"Phụ cấp ăn uống",ne:"खाना भत्ता"},
desc:{pt:"Benefício para refeição, fixo ou por dia trabalhado.",ja:"食事への補助です。固定額か勤務日数分の場合があります。",en:"Meal benefit, fixed or per worked day.",vi:"Phụ cấp ăn, cố định hoặc theo ngày làm.",ne:"खानाको लाभ, निश्चित वा काम गरेको दिनअनुसार।"},
check:{pt:"Confira se foi pago em meses com faltas ou férias.",ja:"欠勤や有給の月も支給されたか確認しましょう。",en:"Check it was paid in months with absences or leave.",vi:"Kiểm tra có được trả trong tháng nghỉ phép không.",ne:"अनुपस्थिति वा बिदा भएको महिनामा भुक्तानी भयो कि जाँच्नुहोस्।"}},
{id:"positionAllow",kind:"earn",match:["役職手当","職務手当"],
name:{pt:"Adicional de função",ja:"役職手当",en:"Position allowance",vi:"Phụ cấp chức vụ",ne:"पद भत्ता"},
desc:{pt:"Valor pago pelo cargo ou função exercida.",ja:"役職や担当業務に対して支払われる手当です。",en:"Extra pay for your role or position.",vi:"Phụ cấp cho chức vụ hoặc công việc đảm nhiệm.",ne:"तपाईंको पद वा भूमिकाका लागि अतिरिक्त भुक्तानी।"},
check:{pt:"Mudança de função pode mudar este valor.",ja:"担当が変わると金額も変わることがあります。",en:"A role change can change this amount.",vi:"Đổi công việc có thể đổi số tiền này.",ne:"भूमिका परिवर्तनले यो रकम बदलिन सक्छ।"}},
{id:"attendanceBonus",kind:"earn",match:["皆勤手当","精勤手当"],
name:{pt:"Prêmio de assiduidade",ja:"皆勤手当",en:"Attendance bonus",vi:"Thưởng chuyên cần",ne:"उपस्थिति बोनस"},
desc:{pt:"Prêmio por não faltar nem atrasar no mês.",ja:"欠勤・遅刻がなかった月への手当です。",en:"Bonus for a month with no absences or lateness.",vi:"Thưởng cho tháng không nghỉ, không đi trễ.",ne:"अनुपस्थिति वा ढिलाइ नभएको महिनाको बोनस।"},
check:{pt:"Um atraso pode zerar o prêmio do mês — confira a regra.",ja:"遅刻1回でゼロになる会社もあります。規則を確認しましょう。",en:"One late day can zero the month's bonus — check the rule.",vi:"Một lần đi trễ có thể mất thưởng cả tháng — kiểm tra quy định.",ne:"एकपटक ढिला हुँदा महिनाको बोनस शून्य हुन सक्छ — नियम जाँच्नुहोस्।"}},
{id:"qualificationAllow",kind:"earn",match:["資格手当"],
name:{pt:"Adicional de qualificação",ja:"資格手当",en:"Qualification allowance",vi:"Phụ cấp chứng chỉ",ne:"योग्यता भत्ता"},
desc:{pt:"Valor por certificações ou licenças que a empresa reconhece.",ja:"会社が認める資格や免許への手当です。",en:"Pay for certifications or licences the company recognises.",vi:"Phụ cấp cho chứng chỉ/bằng cấp công ty công nhận.",ne:"कम्पनीले मान्यता दिएका प्रमाणपत्रहरूको भुक्तानी।"},
check:{pt:"Nova certificação? Avise o RH para atualizar.",ja:"新しい資格を取ったら人事に伝えましょう。",en:"New certification? Tell HR to update it.",vi:"Có chứng chỉ mới? Báo nhân sự để cập nhật.",ne:"नयाँ प्रमाणपत्र छ? HR लाई जानकारी दिनुहोस्।"}},
{id:"bonusPay",kind:"earn",match:["賞与"],
name:{pt:"Bônus",ja:"賞与",en:"Bonus",vi:"Thưởng (bonus)",ne:"बोनस"},
desc:{pt:"Pagamento extra da empresa (no Japão, costuma cair no verão e no inverno).",ja:"会社の賞与です（日本では夏と冬が多いです）。",en:"Extra company payment (in Japan, usually summer and winter).",vi:"Khoản trả thêm của công ty (ở Nhật thường vào hè và đông).",ne:"कम्पनीको अतिरिक्त भुक्तानी (जापानमा सामान्यतया गर्मी र जाडोमा)।"},
check:{pt:"Varia com lucro e avaliação — não conte com valor fixo.",ja:"業績と評価で変わります。固定額と思わないように。",en:"It varies with profit and evaluation — don't count on a fixed amount.",vi:"Thay đổi theo lợi nhuận và đánh giá — đừng tính là cố định.",ne:"नाफा र मूल्याङ्कनअनुसार बदलिन्छ — निश्चित नसोच्नुहोस्।"}},
{id:"otherEarn",kind:"earn",match:["その他手当","その他支給"],
name:{pt:"Outros pagamentos",ja:"その他支給",en:"Other payments",vi:"Khoản trả khác",ne:"अन्य भुक्तानी"},
desc:{pt:"Pagamentos que não se encaixam nas outras linhas.",ja:"他の項目に当てはまらない支給です。",en:"Payments that don't fit the other lines.",vi:"Khoản trả không thuộc các dòng khác.",ne:"अन्य लाइनहरूमा नपर्ने भुक्तानीहरू।"},
check:{pt:"Se não souber o que é, pergunte ao empregador por escrito.",ja:"内容が不明なら会社に書面で確認しましょう。",en:"If unsure what it is, ask the employer in writing.",vi:"Không rõ là gì thì hỏi công ty bằng văn bản.",ne:"के हो थाहा छैन भने कम्पनीलाई लिखित रूपमा सोध्नुहोस्।"}},
{id:"healthIns",kind:"ded",match:["健康保険料","健康保険"],
name:{pt:"Seguro-saúde",ja:"健康保険料",en:"Health insurance",vi:"Bảo hiểm y tế",ne:"स्वास्थ्य बीमा"},
desc:{pt:"Sua parte do seguro-saúde (Shakai Hoken). A empresa paga outra parte.",ja:"健康保険料の本人負担分です。会社も負担しています。",en:"Your share of health insurance (Shakai Hoken). The company pays its own share.",vi:"Phần bảo hiểm y tế bạn đóng (Shakai Hoken). Công ty đóng phần riêng.",ne:"स्वास्थ्य बीमाको तपाईंको हिस्सा (Shakai Hoken)। कम्पनीले आफ्नो हिस्सा तिर्छ।"},
check:{pt:"É calculado sobre o salário padrão; a média de abr–jun define o valor de set–ago.",ja:"標準報酬で決まります。4–6月の平均が9月–翌8月に反映されます。",en:"Based on your standard salary; the Apr–Jun average sets the Sep–Aug amount.",vi:"Tính trên lương chuẩn; trung bình tháng 4–6 quyết định mức tháng 9–8.",ne:"मानक तलबमा आधारित; अप्रिल–जुनको औसतले सेप्टेम्बर–अगस्ट निर्धारण गर्छ।"}},
{id:"careIns",kind:"ded",match:["介護保険料","介護保険"],
name:{pt:"Seguro de cuidados (kaigo)",ja:"介護保険料",en:"Long-term care insurance",vi:"Bảo hiểm chăm sóc (kaigo)",ne:"हेरचाह बीमा (kaigo)"},
desc:{pt:"Contribuição para o seguro de cuidados de idosos; cobrada de quem tem 40 anos ou mais.",ja:"介護保険料です。40歳以上が対象です。",en:"Contribution to elderly-care insurance; charged from age 40.",vi:"Đóng góp bảo hiểm chăm sóc người già; thu từ 40 tuổi.",ne:"वृद्ध हेरचाह बीमाको योगदान; 40 वर्षदेखि लाग्छ।"},
check:{pt:"Aparece a partir dos 40 anos — se veio antes, pergunte.",ja:"40歳未満で引かれていたら確認しましょう。",en:"It starts at 40 — if it appears earlier, ask.",vi:"Bắt đầu từ 40 tuổi — xuất hiện sớm hơn thì hỏi lại.",ne:"40 वर्षदेखि सुरु हुन्छ — पहिले आएमा सोध्नुहोस्।"}},
{id:"pension",kind:"ded",match:["厚生年金保険料","厚生年金"],
name:{pt:"Previdência (pensão)",ja:"厚生年金保険料",en:"Pension (Kosei Nenkin)",vi:"Lương hưu (Kosei Nenkin)",ne:"पेन्सन (Kosei Nenkin)"},
desc:{pt:"Sua parte da aposentadoria via empresa (Kosei Nenkin).",ja:"厚生年金保険料の本人負担分です。",en:"Your share of the employees' pension (Kosei Nenkin).",vi:"Phần lương hưu qua công ty bạn đóng (Kosei Nenkin).",ne:"कर्मचारी पेन्सनको तपाईंको हिस्सा (Kosei Nenkin)।"},
check:{pt:"É o que garante sua aposentadoria no Japão; confira no Nenkin Teikibin anual.",ja:"日本の年金の土台です。年1回のねんきん定期便で確認しましょう。",en:"This builds your Japan pension; check the yearly Nenkin Teikibin statement.",vi:"Đây là nền lương hưu ở Nhật; kiểm tra Nenkin Teikibin hằng năm.",ne:"यसले जापान पेन्सन बनाउँछ; वार्षिक Nenkin Teikibin जाँच्नुहोस्।"}},
{id:"employmentIns",kind:"ded",match:["雇用保険料","雇用保険"],
name:{pt:"Seguro-desemprego",ja:"雇用保険料",en:"Employment insurance",vi:"Bảo hiểm thất nghiệp",ne:"रोजगार बीमा"},
desc:{pt:"Contribuição para o seguro-desemprego (0,5% do bruto em 2026).",ja:"雇用保険料です（2026年は総支給の0.5%）。",en:"Contribution to unemployment insurance (0.5% of gross in 2026).",vi:"Đóng bảo hiểm thất nghiệp (0,5% lương gộp năm 2026).",ne:"बेरोजगारी बीमाको योगदान (2026 मा कुल तलबको 0.5%)।"},
check:{pt:"Se fugir muito de ~0,5% do bruto, confira.",ja:"総支給の0.5%から大きく外れたら確認しましょう。",en:"If it's far from ~0.5% of gross, check it.",vi:"Nếu khác xa ~0,5% lương gộp, hãy kiểm tra.",ne:"कुल तलबको ~0.5% भन्दा धेरै फरक भए जाँच्नुहोस्।"}},
{id:"incomeTax",kind:"ded",match:["所得税"],
name:{pt:"Imposto de renda",ja:"所得税",en:"Income tax",vi:"Thuế thu nhập",ne:"आयकर"},
desc:{pt:"Imposto retido todo mês do salário, ajustado no fim do ano (nenmatsu chosei).",ja:"毎月天引きされる所得税です。年末調整で精算されます。",en:"Tax withheld monthly, settled at year-end (nenmatsu chosei).",vi:"Thuế khấu trừ hằng tháng, quyết toán cuối năm (nenmatsu chosei).",ne:"मासिक कटौती हुने कर, वर्ष अन्त्यमा समायोजन हुन्छ।"},
check:{pt:"Diferenças voltam ou são cobradas no ajuste de dezembro.",ja:"過不足は12月の年末調整で戻る/引かれます。",en:"Differences are refunded or charged in the December adjustment.",vi:"Chênh lệch được hoàn hoặc thu thêm vào tháng 12.",ne:"फरक डिसेम्बर समायोजनमा फिर्ता वा कटौती हुन्छ।"}},
{id:"residentTax",kind:"ded",match:["住民税"],
name:{pt:"Imposto de residência (juminzei)",ja:"住民税",en:"Resident tax (juminzei)",vi:"Thuế cư trú (juminzei)",ne:"निवासी कर (juminzei)"},
desc:{pt:"Imposto municipal sobre a renda do ano anterior; aparece a partir do 2º ano no Japão, em 12 parcelas (jun–mai).",ja:"前年の所得への住民税です。日本2年目から、6月–翌5月の12回で引かれます。",en:"City tax on last year's income; starts in your 2nd year in Japan, in 12 parts (Jun–May).",vi:"Thuế thành phố trên thu nhập năm trước; từ năm 2 ở Nhật, chia 12 lần (tháng 6–5).",ne:"गत वर्षको आम्दानीमा नगर कर; जापानमा दोस्रो वर्षदेखि, 12 किस्तामा (जुन–मे)।"},
check:{pt:"Quem está no 1º ano ainda não paga — separe dinheiro para o 2º ano.",ja:"1年目は引かれません。2年目に備えて貯めましょう。",en:"Not charged in year 1 — save up for year 2.",vi:"Năm đầu chưa bị thu — hãy để dành cho năm 2.",ne:"पहिलो वर्ष लाग्दैन — दोस्रो वर्षका लागि बचत गर्नुहोस्।"}},
{id:"socialInsTotal",kind:"ded",match:["社会保険料合計","社会保険料"],
name:{pt:"Total dos seguros sociais",ja:"社会保険料合計",en:"Social insurance total",vi:"Tổng bảo hiểm xã hội",ne:"सामाजिक बीमा जम्मा"},
desc:{pt:"Soma de saúde + pensão (+ cuidados). É um subtotal, não um desconto extra.",ja:"健康保険＋厚生年金（＋介護）の合計です。小計であり追加の控除ではありません。",en:"Sum of health + pension (+ care). A subtotal, not an extra deduction.",vi:"Tổng y tế + hưu trí (+ chăm sóc). Là tổng phụ, không phải khoản trừ thêm.",ne:"स्वास्थ्य + पेन्सन (+ हेरचाह) को योग। उप-जम्मा हो, अतिरिक्त कटौती होइन।"},
check:{pt:"Não some de novo: ele já está dentro do total de descontos.",ja:"二重に数えないでください。控除合計に含まれています。",en:"Don't count it twice: it's already inside the deduction total.",vi:"Đừng cộng hai lần: nó đã nằm trong tổng khấu trừ.",ne:"दोहोरो नगण्नुहोस्: यो कटौती जम्माभित्रै छ।"}},
{id:"advance",kind:"ded",match:["前払給与","前払金","前払"],
name:{pt:"Adiantamento / cobrança parcelada",ja:"前払給与",en:"Advance / instalment charge",vi:"Ứng trước / thu theo đợt",ne:"अग्रिम / किस्ता शुल्क"},
desc:{pt:"Desconto de adiantamento ou de custos combinados (ex.: passagem e taxa da empreiteira, parcelados).",ja:"前払い分や、約束した費用（渡航費・紹介料など）の分割控除です。",en:"Deduction for an advance or agreed costs (e.g. airfare and agency fee, in instalments).",vi:"Khấu trừ tiền ứng hoặc chi phí đã thỏa thuận (vé máy bay, phí giới thiệu...) theo đợt.",ne:"अग्रिम वा सहमति भएका लागतहरू (हवाई भाडा, एजेन्सी शुल्क) को किस्ता कटौती।"},
check:{pt:"Exija o acordo por escrito: valor total, parcelas e quando termina.",ja:"総額・回数・終了時期を書面で確認しましょう。",en:"Demand the agreement in writing: total, instalments, end date.",vi:"Yêu cầu thỏa thuận bằng văn bản: tổng tiền, số đợt, ngày kết thúc.",ne:"लिखित सम्झौता माग्नुहोस्: जम्मा, किस्ता, अन्त्य मिति।"}},
{id:"rentDed",kind:"ded",match:["家賃"],
name:{pt:"Aluguel descontado",ja:"家賃",en:"Rent deduction",vi:"Khấu trừ tiền nhà",ne:"भाडा कटौती"},
desc:{pt:"Aluguel do imóvel da empresa/empreiteira descontado direto do salário.",ja:"会社や派遣会社の住居の家賃が給与から引かれています。",en:"Rent for company/agency housing, deducted from pay.",vi:"Tiền nhà của công ty/công ty phái cử, trừ thẳng vào lương.",ne:"कम्पनी/एजेन्सी आवासको भाडा, तलबबाट कटौती।"},
check:{pt:"Compare com o contrato do imóvel e peça o histórico das contas.",ja:"住居の契約と比べ、明細を求めましょう。",en:"Compare with the housing contract and ask for the breakdown.",vi:"So với hợp đồng nhà và yêu cầu chi tiết.",ne:"आवास सम्झौतासँग तुलना गरी विवरण माग्नुहोस्।"}},
{id:"utilitiesDed",kind:"ded",match:["水道光熱費","光熱費","電気代","水道代","ガス代"],
name:{pt:"Água, luz e gás",ja:"光熱費",en:"Utilities",vi:"Điện, nước, gas",ne:"बिजुली, पानी, ग्यास"},
desc:{pt:"Contas da casa descontadas do salário (comum em imóvel de empreiteira).",ja:"住居の光熱費が給与から引かれています（派遣会社の住居で多いです）。",en:"Household utilities deducted from pay (common in agency housing).",vi:"Tiền điện nước gas trừ vào lương (thường gặp ở nhà công ty phái cử).",ne:"तलबबाट कटौती हुने घरको उपयोगिता बिल (एजेन्सी आवासमा सामान्य)।"},
check:{pt:"Peça os valores por consumo; pode haver margem embutida.",ja:"使用量の明細を求めましょう。上乗せがある場合があります。",en:"Ask for usage details; a markup may be included.",vi:"Yêu cầu chi tiết mức sử dụng; có thể có phụ phí.",ne:"प्रयोग विवरण माग्नुहोस्; थप शुल्क हुन सक्छ।"}},
{id:"foodDed",kind:"ded",match:["弁当代","食費"],
name:{pt:"Refeição descontada",ja:"食費",en:"Meal deduction",vi:"Khấu trừ tiền ăn",ne:"खाना कटौती"},
desc:{pt:"Desconto de refeições ou marmitas fornecidas pela empresa.",ja:"会社が用意した食事・弁当の控除です。",en:"Deduction for meals or lunch boxes provided by the company.",vi:"Khấu trừ tiền ăn/cơm hộp do công ty cung cấp.",ne:"कम्पनीले दिएको खानाको कटौती।"},
check:{pt:"Confira o valor por refeição e os dias cobrados.",ja:"1食あたりの金額と日数を確認しましょう。",en:"Check the per-meal price and the days charged.",vi:"Kiểm tra giá mỗi bữa và số ngày bị thu.",ne:"प्रति खाना मूल्य र शुल्क लागेका दिनहरू जाँच्नुहोस्।"}},
{id:"unionDed",kind:"ded",match:["組合費"],
name:{pt:"Sindicato",ja:"組合費",en:"Union dues",vi:"Phí công đoàn",ne:"युनियन शुल्क"},
desc:{pt:"Contribuição ao sindicato da categoria, quando há.",ja:"労働組合の組合費です。",en:"Union membership dues, when applicable.",vi:"Phí công đoàn, nếu có.",ne:"युनियन सदस्यता शुल्क, लागु भएमा।"},
check:{pt:"A filiação costuma ser opcional — confirme se você aderiu.",ja:"加入は任意のことが多いです。加入したか確認しましょう。",en:"Membership is usually optional — confirm you joined.",vi:"Tham gia thường là tự nguyện — xác nhận bạn đã tham gia chưa.",ne:"सदस्यता सामान्यतया ऐच्छिक हुन्छ — तपाईं सामेल हुनुभयो कि पुष्टि गर्नुहोस्।"}},
{id:"futonDed",kind:"ded",match:["布団代","布団"],
name:{pt:"Enxoval / futon",ja:"布団代",en:"Futon / bedding charge",vi:"Phí chăn đệm (futon)",ne:"फुटन / ओछ्यान शुल्क"},
desc:{pt:"Cobrança de futon/enxoval fornecido na chegada (comum em empreiteira).",ja:"到着時に用意された布団などの請求です（派遣会社で多いです）。",en:"Charge for futon/bedding provided on arrival (common with agencies).",vi:"Phí chăn đệm được cấp khi đến (thường gặp ở công ty phái cử).",ne:"आगमनमा दिइएको फुटन/ओछ्यानको शुल्क (एजेन्सीमा सामान्य)।"},
check:{pt:"Deve ser cobrança única ou poucas parcelas — confira se parou.",ja:"1回か数回で終わるはずです。止まっているか確認しましょう。",en:"It should be one or a few charges — check it stopped.",vi:"Chỉ thu một hoặc vài lần — kiểm tra đã dừng chưa.",ne:"एक वा केही पटक मात्र हुनुपर्छ — रोकियो कि जाँच्नुहोस्।"}},
{id:"otherDed",kind:"ded",match:["その他控除"],
name:{pt:"Outros descontos",ja:"その他控除",en:"Other deductions",vi:"Khấu trừ khác",ne:"अन्य कटौती"},
desc:{pt:"Descontos que não se encaixam nas outras linhas.",ja:"他の項目に当てはまらない控除です。",en:"Deductions that don't fit the other lines.",vi:"Khoản trừ không thuộc các dòng khác.",ne:"अन्य लाइनहरूमा नपर्ने कटौतीहरू।"},
check:{pt:"Todo desconto precisa de explicação: pergunte por escrito o que é.",ja:"控除には説明が必要です。書面で確認しましょう。",en:"Every deduction needs an explanation: ask in writing.",vi:"Mọi khoản trừ cần giải thích: hãy hỏi bằng văn bản.",ne:"प्रत्येक कटौतीको व्याख्या चाहिन्छ: लिखित रूपमा सोध्नुहोस्।"}}
];
function termText(term,field){return (term[field]&&(term[field][LANG]||term[field].pt))||""}
function findTerm(text,kind){
  for(const term of PAYSLIP_TERMS){
    if(kind&&term.kind!==kind)continue;
    for(const alias of term.match){if(text.includes(alias))return term}
  }
  return null;
}

// ---------- V5.7: parser do texto OCR ----------
function ocrStrip(s){
  return (s||"").replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0)).replace(/\s+/g,"");
}
function firstAmountAfter(text,idx,maxLen){
  const seg=text.slice(idx,idx+(maxLen||16));
  const re=/(\d{1,3}(?:[.,]\d{3})+|\d{2,})/g; let m;
  while((m=re.exec(seg))){
    if(seg[m.index+m[0].length]===":")continue; // é horário, não valor
    const v=Number(m[0].replace(/[.,]/g,""));
    if(v>0&&v<100000000)return v;
  }
  return null;
}
function amountForAliases(text,aliases){
  for(const alias of aliases){
    const idx=text.indexOf(alias);
    if(idx<0)continue;
    const v=firstAmountAfter(text,idx+alias.length,16);
    if(v!=null)return v;
  }
  return null;
}
function timeForAliases(text,aliases){
  for(const alias of aliases){
    const idx=text.indexOf(alias);
    if(idx<0)continue;
    const seg=text.slice(idx+alias.length,idx+alias.length+10);
    const m=seg.match(/(\d{1,3}):(\d{2})/);
    if(m)return Number(m[1])+Number(m[2])/60;
    const n=seg.match(/(\d+(?:[.,]\d+)?)/);
    if(n){const v=Number(n[1].replace(",","."));if(v>0&&v<1000)return v}
  }
  return null;
}
function daysForAliases(text,aliases){
  for(const alias of aliases){
    const idx=text.indexOf(alias);
    if(idx<0)continue;
    const seg=text.slice(idx+alias.length,idx+alias.length+10);
    const m=seg.match(/(\d+)(?:[.,](\d{3}))?(?![\d])/);
    if(!m)continue;
    let v=Number(m[1]);
    if(m[2]&&v<=31)v=v+Number(m[2])/1000; // "1.000" = 1,000 dia no formato JP
    else if(v>=1000)v=v/1000;
    if(v>0&&v<=40)return v;
  }
  return null;
}
const PS_NO_LINE=new Set(["socialInsTotal"]);
function parsePayslip(rawText){
  const text=ocrStrip(rawText);
  const out={gross:null,net:null,dedTotal:null,days:null,otHours:null,nightHours:null,totalHours:null,earnings:[],deductions:[]};
  if(!text)return out;
  out.days=daysForAliases(text,["出勤日数","勤務日数","就労日数"]);
  out.otHours=timeForAliases(text,["残業時間","時間外労働時間","時間外時間"]);
  out.nightHours=timeForAliases(text,["深夜時間"]);
  out.totalHours=timeForAliases(text,["総労働時間","総就労時間","勤務時間合計"]);
  for(const term of PAYSLIP_TERMS){
    if(PS_NO_LINE.has(term.id))continue;
    const v=amountForAliases(text,term.match);
    if(v==null)continue;
    const line={label:term.match[0],amount:v,term:term.id};
    if(term.kind==="earn")out.earnings.push(line);else out.deductions.push(line);
  }
  out.dedTotal=amountForAliases(text,["控除合計額","控除合計","控除総額"]);
  out.net=amountForAliases(text,["差引支給額","差引支給","手取額","手取り金額","手取","銀行振込額","振込額"]);
  out.gross=amountForAliases(text,["総支給額","支給合計額","総支給金額","支給総額","総支給"]);
  const sumE=out.earnings.reduce((a,l)=>a+l.amount,0);
  const sumD=out.deductions.reduce((a,l)=>a+l.amount,0);
  if(out.dedTotal==null&&sumD>0)out.dedTotal=sumD;
  if(out.gross==null&&sumE>0)out.gross=sumE;
  if(out.gross==null&&out.net!=null&&out.dedTotal!=null)out.gross=out.net+out.dedTotal;
  if(out.net==null&&out.gross!=null&&out.dedTotal!=null)out.net=out.gross-out.dedTotal;
  return out;
}
// ---------- V5.7: OCR (Tesseract.js sob demanda) ----------
let tesseractLoad=null;
function loadTesseract(){
  if(window.Tesseract)return Promise.resolve();
  if(tesseractLoad)return tesseractLoad;
  tesseractLoad=new Promise((res,rej)=>{
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js";
    s.onload=()=>res(); s.onerror=()=>rej(new Error("tesseract load"));
    document.head.appendChild(s);
  });
  return tesseractLoad;
}
function payslipPreprocess(file){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{
      const w=img.naturalWidth,h=img.naturalHeight;
      const scale=w>0&&w<1800?Math.min(2,1800/w):1;
      const c=document.createElement("canvas");
      c.width=Math.round(w*scale); c.height=Math.round(h*scale);
      const ctx=c.getContext("2d");
      try{ctx.filter="grayscale(1) contrast(1.25)"}catch(e){}
      ctx.drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(url);
      res(c);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("image"))};
    img.src=url;
  });
}
async function runPayslipOcr(file){
  const panel=$("payslipPanel");
  panel.classList.remove("hidden");
  $("payslipReview").classList.add("hidden");
  $("ocrStatus").classList.remove("hidden");
  $("ocrFailNote").classList.add("hidden");
  $("ocrStatusText").textContent=t("ocrEngine");
  $("ocrBar").style.width="5%";
  let parsed=null,failed=false;
  try{
    await loadTesseract();
    const worker=await Tesseract.createWorker("jpn",1,{logger:m=>{
      if(m.status==="recognizing text"){$("ocrStatusText").textContent=t("ocrReading",{pct:Math.round((m.progress||0)*100)});$("ocrBar").style.width=(10+Math.round((m.progress||0)*85))+"%"}
    }});
    const canvas=await payslipPreprocess(file);
    const {data}=await worker.recognize(canvas);
    await worker.terminate();
    parsed=parsePayslip(data&&data.text?data.text:"");
    if(!parsed.gross&&!parsed.net&&!parsed.earnings.length&&!parsed.deductions.length)failed=true;
  }catch(e){ failed=true; }
  $("ocrStatus").classList.add("hidden");
  openPayslipReview(parsed||{gross:null,net:null,days:null,otHours:null,nightHours:null,earnings:[],deductions:[]},failed);
}
// ---------- V5.7: tela de conferência ----------
let psKindOfSelect=null;
function termOptions(kind,selected){
  let html=`<option value="">${esc(t("psCustom"))}</option>`;
  for(const term of PAYSLIP_TERMS){
    if(term.kind!==kind)continue;
    html+=`<option value="${term.id}"${term.id===selected?" selected":""}>${esc(termText(term,"name"))}</option>`;
  }
  return html;
}
function psLineRow(line,kind){
  const row=document.createElement("div");row.className="psLine";row.dataset.kind=kind;
  const sel=document.createElement("select");sel.className="psTerm";sel.innerHTML=termOptions(kind,line.term||"");
  const label=document.createElement("input");label.className="psLabel";label.type="text";label.value=line.label||"";label.placeholder=t("psLineName");
  const amount=document.createElement("input");amount.className="psAmount";amount.type="number";amount.inputMode="numeric";amount.min="0";amount.value=line.amount!=null?line.amount:"";
  const del=document.createElement("button");del.type="button";del.className="psDel";del.textContent="✕";
  del.onclick=()=>{row.remove();updatePsCheck()};
  sel.onchange=()=>{
    if(sel.value){const term=PAYSLIP_TERMS.find(x=>x.id===sel.value);if(term)label.value=term.match[0]}
    updatePsCheck();
  };
  label.addEventListener("input",updatePsCheck);
  amount.addEventListener("input",updatePsCheck);
  row.append(sel,label,amount,del);
  return row;
}
function renderPsLines(parsed){
  const eBox=$("psEarnLines"),dBox=$("psDedLines");
  eBox.innerHTML="";dBox.innerHTML="";
  (parsed.earnings||[]).forEach(l=>eBox.appendChild(psLineRow(l,"earn")));
  (parsed.deductions||[]).forEach(l=>dBox.appendChild(psLineRow(l,"ded")));
}
function readPsLines(){
  const out={earnings:[],deductions:[]};
  document.querySelectorAll("#payslipReview .psLine").forEach(row=>{
    const term=row.querySelector(".psTerm").value;
    const label=row.querySelector(".psLabel").value.trim();
    const amount=Number(row.querySelector(".psAmount").value)||0;
    if(!label&&!amount)return;
    const line={label:label||(term?PAYSLIP_TERMS.find(x=>x.id===term)?.match[0]||"":""),amount,term:term||""};
    if(row.dataset.kind==="earn")out.earnings.push(line);else out.deductions.push(line);
  });
  return out;
}
function psNum(id){const v=Number(($(id).value||"").replace(",","."));return isNaN(v)?0:v}
function updatePsCheck(){
  const lines=readPsLines();
  const sumE=lines.earnings.reduce((a,l)=>a+l.amount,0);
  const sumD=lines.deductions.reduce((a,l)=>a+l.amount,0);
  const g=psNum("psGross"),n=psNum("psNet");
  const el=$("psCheck");
  let diff=0;
  if(g&&sumE)diff=Math.max(diff,Math.abs(g-sumE));
  if(g&&n)diff=Math.max(diff,Math.abs((g-(sumD||g-n))-n));
  if(g&&sumE&&!diff&&(!n||Math.abs(g-sumD-n)<1)){el.textContent=t("psCheckOk");el.className="psCheck ok"}
  else if(diff>0){el.textContent=t("psCheckWarn",{diff:money(diff)});el.className="psCheck warn"}
  else{el.textContent="";el.className="psCheck"}
}
function openPayslipReview(parsed,failed){
  $("payslipPanel").classList.remove("hidden");
  $("payslipReview").classList.remove("hidden");
  $("ocrFailNote").classList.toggle("hidden",!failed);
  $("psGross").value=parsed.gross!=null?parsed.gross:"";
  $("psNet").value=parsed.net!=null?parsed.net:"";
  $("psDays").value=parsed.days!=null?parsed.days:"";
  $("psOt").value=parsed.otHours!=null?Math.round(parsed.otHours*100)/100:"";
  $("psNight").value=parsed.nightHours!=null?Math.round(parsed.nightHours*100)/100:"";
  $("psEmployer").value=(monthlySnapshot(monthlyKey())?.employer)||($("employerName")?.value||"");
  renderPsLines(parsed);
  updatePsCheck();
  $("payslipPanel").scrollIntoView({behavior:"smooth",block:"start"});
}
const PS_MANDATORY=new Set(["healthIns","careIns","pension","employmentIns","incomeTax","residentTax"]);
function savePayslip(){
  const gross=psNum("psGross"),net=psNum("psNet");
  if(!gross||!net){alert(t("psNeedValues"));return}
  const lines=readPsLines();
  const sumD=lines.deductions.reduce((a,l)=>a+l.amount,0);
  const dedTotal=sumD>0?sumD:(gross-net);
  const mandatory=lines.deductions.filter(l=>PS_MANDATORY.has(l.term)).reduce((a,l)=>a+l.amount,0);
  const bonusLine=lines.earnings.find(l=>l.term==="bonusPay");
  const ot=psNum("psOt"),night=psNum("psNight");
  const key=monthlyKey();
  const psSnap={
    gross,net,
    bonus:bonusLine?bonusLine.amount:0,
    mandatoryDeductions:mandatory,
    otherDeductions:Math.max(0,dedTotal-mandatory),
    deductions:dedTotal,
    updatedAt:Date.now(),
    mode,deductionMode:$("deductionMode")?.value||"percent",
    normalHours:0,overtimeHours:ot,offHours:0,offPercent:val("offPercent"),
    nightHours:night,nightDays:0,
    source:"payslip",payslipAt:Date.now(),
    daysWorked:psNum("psDays")||null,
    raiox:{earnings:lines.earnings,deductions:lines.deductions,savedAt:Date.now()}
  };
  const psEmp=(($("psEmployer").value||"").trim())||(monthlySnapshot(key)?.employer||"");
  if(psEmp){
    psSnap.employer=psEmp;
    const empInput=$("employerName");
    if(empInput&&empInput.value.trim()!==psEmp){empInput.value=psEmp;localStorage.setItem(SETTINGS_PREFIX+"employerName",psEmp)}
  }
  saveMonthlySnapshot(key,psSnap);
  $("payslipPanel").classList.add("hidden");
  renderPayslipCard();renderDashboard();renderHome();
  alert(t("psSavedMsg"));
}
// ---------- V5.7: Raio-X do mês ----------
function raioxLineHtml(line){
  const term=line.term?PAYSLIP_TERMS.find(x=>x.id===line.term):null;
  const name=term?termText(term,"name"):(line.label||"—");
  const orig=term&&line.label&&line.label!==termText(term,"name")?`<span class="raioxOrig">${esc(line.label)}</span>`:"";
  const body=term
    ?`<div class="raioxDesc">${esc(termText(term,"desc"))}</div><div class="raioxCheck">✔️ ${esc(termText(term,"check"))}</div>`
    :`<div class="raioxDesc">${esc(t("raioxUnknown"))} — ${esc(t("raioxUnknownNote"))}</div>`;
  return `<div class="raioxLine"><div class="raioxHead"><span class="raioxName">${esc(name)} ${orig}</span><strong>${money(line.amount||0)}</strong></div>${body}</div>`;
}
function openRaiox(){
  const key=monthlyKey();
  const snap=monthlySnapshot(key);
  if(!snap||!snap.raiox)return;
  $("raioxTitle").textContent=t("raioxTitle",{month:monthName(key)});
  let html=`<div class="raioxTotals"><div><span>${esc(t("resGross"))}</span><strong>${money(snap.gross||0)}</strong></div><div><span>${esc(t("resTotalDed"))}</span><strong>${money(snap.deductions||0)}</strong></div><div><span>${esc(t("resNet"))}</span><strong>${money(snap.net||0)}</strong></div></div>`;
  if(snap.raiox.earnings.length){html+=`<h3>${esc(t("psEarnTitle"))}</h3>`+snap.raiox.earnings.map(raioxLineHtml).join("")}
  if(snap.raiox.deductions.length){html+=`<h3>${esc(t("psDedTitle"))}</h3>`+snap.raiox.deductions.map(raioxLineHtml).join("")}
  $("raioxBody").innerHTML=html;
  $("raioxPanel").classList.remove("hidden");
  $("raioxPanel").scrollIntoView({behavior:"smooth",block:"start"});
}
// ---------- V5.7: cartão do holerite ----------
function renderPayslipCard(){
  const btn=$("payslipBtn");if(!btn)return;
  const key=monthlyKey();
  btn.textContent=t("slipBtn",{month:monthName(key)});
  const snap=monthlySnapshot(key);
  $("raioxBtn").classList.toggle("hidden",!(snap&&snap.raiox));
  const chk=$("slipChecked");
  if(snap&&snap.source==="payslip"&&snap.payslipAt){
    chk.textContent=t("slipChecked",{date:new Date(snap.payslipAt).toLocaleDateString(LOCALES[LANG])})+(snap.employer?" · 🏭 "+snap.employer:"");
    chk.classList.remove("hidden");
  }else chk.classList.add("hidden");
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
  return {key,days,hours,overtime,night,nightDays,gross,net,employer:snap?.employer||""};
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
  return {key,days,hours,overtime,night,nightDays,gross,net,offWeighted,employer:snap?.employer||""};
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
      ${x.employer?`<div class="barEmployer" title="${esc(x.employer)}">🏭 ${esc(x.employer)}</div>`:""}
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
    label:labels[i],value:x[field],key:x.key,employer:x.employer||"",
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
  renderPayslipCard();
}
function renderPairChart(title,labels,series,format,chartId){
  const all=series.flatMap(s=>s.values).filter(v=>typeof v==="number");
  const max=Math.max(...all,1);
  const groups=labels.map((lab,i)=>{
    const cols=series.map(s=>{
      const v=s.values[i];
      const h=v==null?0:Math.max(5,(v/max)*100);
      return `<div class="pairCol"><div class="pairTrack"><div class="pairFill" style="height:${h}%;background:${s.color}"></div></div></div>`;
    }).join("");
    return `<div class="barItem" data-month="${series[0].keys[i]}" data-chart="${chartId}"><div class="pairWrap">${cols}</div><div class="barLabel">${lab}</div></div>`;
  }).join("");
  const legend=series.map(s=>`<span class="legendItem"><span class="dot" style="background:${s.color}"></span>${esc(s.name)}</span>`).join("");
  return `<div class="chartBox"><h4>${title}</h4><div class="legend">${legend}</div><div class="bars">${groups}</div><div class="pairHint">${t("pairTapHint")}</div><div class="pairDetail" id="pd-${chartId}" hidden></div></div>`;
}
let coupleCharts=null;
// Toque num mês dos gráficos do casal: mostra os valores daquele mês
// (dele, dela e juntos) só naquele gráfico, sem poluir a tela pequena.
// O botão dentro do detalhe mantém o atalho para os dias do mês.
function pairTap(chartId,key,el){
  const data=coupleCharts; if(!data)return;
  const i=data.months.indexOf(key); if(i<0)return;
  const field=chartId==="pairGross"?"gross":"net";
  const box=$("pd-"+chartId); if(!box)return;
  const parts=data.perEmp.map(({emp,stats})=>{
    const v=stats[i][field];
    return `<span class="legendItem"><span class="dot" style="background:${emp.color}"></span>${esc(emp.name)} <strong>${v==null?"—":money(v)}</strong></span>`;
  });
  const any=data.perEmp.some(({stats})=>stats[i][field]!=null);
  const total=data.perEmp.reduce((acc,{stats})=>acc+(stats[i][field]||0),0);
  box.innerHTML=`<div class="pairDetailHead">${data.labels[i]}</div><div class="pairDetailVals">${parts.join("")}${any?`<span>${t("pairCombined")}: <strong>${money(total)}</strong></span>`:""}</div><button type="button" class="smallBtn pairOpenBtn">${t("viewDaysTitle")} →</button>`;
  box.hidden=false;
  const ob=box.querySelector(".pairOpenBtn");
  if(ob)ob.onclick=()=>openMonth(key);
  if(el&&el.closest){
    const cb=el.closest(".chartBox");
    if(cb)cb.querySelectorAll(".barItem").forEach(b=>b.classList.remove("sel"));
    el.classList.add("sel");
  }
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
  coupleCharts={months,labels,perEmp};
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
    ${renderPairChart(t("chartGross"),labels,series("gross"),"money","pairGross")}
    ${renderPairChart(t("chartNet"),labels,series("net"),"money","pairNet")}
    <div class="dashboardNote">${t("coupleNote",{month:monthName(monthlyKey())})}</div>
    <h4 class="empManageTitle">${t("manageTitle")}</h4>
    ${manage}`;
  box.querySelectorAll("[data-chart]").forEach(el=>{
    el.onclick=()=>pairTap(el.dataset.chart,el.dataset.month,el);
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
    const snapObj={
      gross,net,bonus,mandatoryDeductions:d.mandatory,otherDeductions:d.other,deductions:d.total,updatedAt:Date.now(),
      mode,deductionMode:$("deductionMode")?.value||"percent",
      normalHours:val("normalHours"),
      overtimeHours:val("overtimeHours"),
      offHours:val("offHours"),
      offPercent:val("offPercent"),
      nightHours:val("nightHours"),
      nightDays:val("nightDays")
    };
    const prevSnap=monthlySnapshot(monthlyKey());
    if(prevSnap&&prevSnap.raiox){snapObj.raiox=prevSnap.raiox;snapObj.payslipAt=prevSnap.payslipAt;if(prevSnap.daysWorked!=null)snapObj.daysWorked=prevSnap.daysWorked}
    const empName=(prevSnap&&prevSnap.employer)||($("employerName")?.value||"").trim();
    if(empName)snapObj.employer=empName;
    saveMonthlySnapshot(monthlyKey(),snapObj);
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
const SETTINGS_FIELDS=["hourlyRate","monthlySalary","baseHours","nightPercent","nightFixed","mealMonthly","otherAllowance","summerBonus","winterBonus","deduction","employmentInsurance","incomeTax","advanceSalary","utilities","rentDeduction","otherDeduction","yukiuTotal","offHours","offPercent","employerName"];
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
$("payslipBtn").onclick=()=>$("payslipFile").click();
$("payslipFile").addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(f)runPayslipOcr(f);e.target.value=""});
$("psCancel").onclick=()=>$("payslipPanel").classList.add("hidden");
$("psSave").onclick=savePayslip;
$("psAddEarn").onclick=()=>{$("psEarnLines").appendChild(psLineRow({label:"",amount:"",term:""},"earn"));updatePsCheck()};
$("psAddDed").onclick=()=>{$("psDedLines").appendChild(psLineRow({label:"",amount:"",term:""},"ded"));updatePsCheck()};
$("raioxBtn").onclick=openRaiox;
$("raioxClose").onclick=()=>$("raioxPanel").classList.add("hidden");
["psGross","psNet"].forEach(id=>$(id).addEventListener("input",updatePsCheck));
renderPayslipCard();
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
$("driveUrl").value=localStorage.getItem("msj-driveUrl")||"";
$("driveKey").value=localStorage.getItem("msj-driveKey")||"";
$("driveSave").onclick=driveSaveConfig;
$("driveUp").onclick=()=>{driveUpload()};
$("driveDown").onclick=()=>{driveDownload()};
$("driveNoticeClose").onclick=driveHideNotice;
driveRenderSync();
driveCheckOnOpen();
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
