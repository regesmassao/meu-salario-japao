# Meu Salário Japão 🇯🇵

**Versão atual: 4.8**

Aplicativo web (PWA) para calcular o salário no Japão e controlar a jornada de trabalho. Feito para uso pessoal, em português, com valores em iene (¥).

🔗 **Acesse:** https://regesmassao.github.io/meu-salario-japao/

## O que ele faz

### 👥 Funcionários (desde a V4.8)
- **Cadastro de funcionários**: cada pessoa tem seus próprios dias, meses e configurações, identificados por nome e cor
- Um **funcionário ativo** é escolhido no topo do app — tudo o que for preenchido vai para ele
- **Visão do casal**: gráficos de bruto e líquido com os dois funcionários lado a lado, cada um na sua cor, o líquido de cada um no mês e o **total dos dois juntos**
- O funcionário principal usa os dados que o app já tinha, sem mover nada; o backup inclui todos os funcionários

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
- **Backup (desde a V4.7):** botão para exportar todos os dados num arquivo JSON e importar de volta — guarde o arquivo fora do aparelho (Arquivos, e-mail ou nuvem), porque é a única cópia que existe

## Histórico de versões
- **4.8** — Área de funcionários: dados separados por pessoa e visão do casal com total do mês
- **4.7** — Backup dos dados: exportar e importar todos os registros num arquivo
- **4.6** — Gráficos interativos: tocar num mês abre os dias dele na jornada
- **4.5** — Bônus de verão e inverno, com valor manual por estação
- **4.4** — Visual novo, com cara de aplicativo (cartão de saldo, abas segmentadas, modo escuro)
- **4.3** — Vários intervalos por dia no editor; restauração do campo de descontos
