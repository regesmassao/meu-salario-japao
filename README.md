# Meu Salário Japão 🇯🇵

**Versão atual: 4.6**

Aplicativo web (PWA) para calcular o salário no Japão e controlar a jornada de trabalho. Feito para uso pessoal, em português, com valores em iene (¥).

🔗 **Acesse:** https://regesmassao.github.io/meu-salario-japao/

## O que ele faz

### 💴 Calculadora salarial
- Pagamento **por hora** ou **mensal**
- Horas extras com adicional de **25%**
- Adicional noturno (percentual ou valor fixo por dia) e dias de trabalho noturno
- Refeição/benefício mensal e outros adicionais
- Descontos em dois modos: **percentual estimado** ou **detalhado** (seguro-desemprego, imposto de renda, adiantamento, utilidades, aluguel e outros)

### 🎌 Bônus 2x ao ano (desde a V4.5)
- Parcelas de **verão** e **inverno**, cada uma com **valor preenchido manualmente** (o bônus é variável) e **mês de pagamento configurável** (padrão: julho e dezembro)
- A parcela entra no salário bruto **somente no mês em que cai**, e a linha "Bônus do mês (parcela)" aparece no resultado
- Os valores ficam salvos no aparelho

### 📅 Controle de jornada
- Calendário mensal com registro de **entrada e saída** por dia
- **Vários intervalos (kyukei) por dia**, somados e descontados das horas trabalhadas, extras e noturnas
- Suporte a turno noturno que vira o dia (ex.: 22h → 06h)
- Totais do mês: dias trabalhados, horas normais, extras e noturnas

### 📈 Evolução mensal (gráficos interativos desde a V4.6)
- Últimos 6 meses: bruto, líquido, horas trabalhadas, extras, noturnas e dias, com comparação ao mês anterior
- **Toque na barra de um mês** para abrir aquele mês no controle de jornada e ver os dias, horários e intervalos dele

## Dados e privacidade
- Todos os dados (dias registrados, valores da calculadora) ficam salvos **somente no aparelho** (localStorage do navegador)
- Funciona offline depois de instalado, como um aplicativo

## Histórico de versões
- **4.6** — Gráficos interativos: tocar num mês abre os dias dele na jornada
- **4.5** — Bônus de verão e inverno, com valor manual por estação
- **4.4** — Visual novo, com cara de aplicativo (cartão de saldo, abas segmentadas, modo escuro)
- **4.3** — Vários intervalos por dia no editor; restauração do campo de descontos
