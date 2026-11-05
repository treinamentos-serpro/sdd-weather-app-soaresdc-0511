# Backlog de Tarefas — Weather App

Cada tarefa é uma unidade de implementação ou validação independente, com no máximo dois arquivos prováveis. Os IDs são únicos, mas não indicam ordem; siga a sequência canônica abaixo e confirme as dependências antes de iniciar cada tarefa.

## Ordem de execução

1. **Tipos:** T-02.
2. **Funções puras:** T-03, T-04, T-29, T-05, T-13.
3. **Services:** T-09, T-11.
4. **Hook/estado:** T-15, T-31.
5. **Componentes:** T-17, T-19, T-33, T-34, T-21, T-22, T-37, T-38, T-39, T-40.
6. **Integração:** T-24, T-43.
7. **Testes:** T-06, T-07, T-30, T-08, T-10, T-12, T-14, T-16, T-32, T-18, T-20, T-35, T-36, T-23, T-41, T-42, T-25, T-26, T-27, T-28.
8. **Hardening:** T-01, T-44.

## Rastreabilidade FR → Tarefas

| Requisito da spec | Implementação | Testes associados | Cobertura |
| --- | --- | --- | --- |
| FR1 — Pesquisar cidade | T-03, T-09, T-15, T-17 | T-06, T-10, T-16, T-18, T-25 | Coberto |
| FR2 — Exibir e selecionar resultados | T-03, T-09, T-13, T-15, T-17 | T-06, T-10, T-14, T-16, T-18, T-25 | Coberto |
| FR3 — Exibir clima atual | T-11, T-13, T-31, T-19 | T-12, T-14, T-32, T-20, T-25 | Coberto |
| FR4 — Exibir previsão | T-05, T-11, T-13, T-31, T-33, T-34 | T-08, T-12, T-14, T-32, T-35, T-36, T-25 | Coberto |
| FR5 — Alternar unidades | T-04, T-29, T-31, T-21 | T-07, T-30, T-32, T-23, T-25 | Coberto |
| FR6 — Comunicar estados da consulta | T-09, T-11, T-15, T-31, T-22, T-39 | T-10, T-12, T-16, T-32, T-42, T-26 | Coberto |
| FR7 — Repetir consulta com falha | T-31, T-38 | T-32, T-41, T-26 | Coberto |
| FR8 — Atualizar dados manualmente | T-31, T-37, T-40 | T-32, T-41, T-42, T-26 | Coberto |

Todos os requisitos funcionais FR1–FR8 têm tarefas de implementação e validação associadas. Requisitos sem tarefa correspondente: nenhum.

## Entrega 1 — Fundação e domínio

### T-01 — Adicionar ferramenta de auditoria de acessibilidade
- **Tipo:** Infra
- **Descrição:** incluir `@axe-core/playwright` como dependência de desenvolvimento.
- **Critérios de aceite:** a dependência consta em `devDependencies` e no lockfile.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `package.json`, `pnpm-lock.yaml`
- **Rastreabilidade:** NFR2; plano Tech Stack e Testing Strategy.

### T-02 — Definir contratos de domínio e respostas da API
- **Tipo:** Data
- **Descrição:** criar tipos para `Unit`, `City`, `CurrentWeather`, `ForecastDay`, `WeatherData`, estados de busca/clima, erros e DTOs usados dos endpoints Open-Meteo.
- **Critérios de aceite:** `tsc` aceita os contratos; modelos incluem os campos do plano, medidas ausentes como `number | null`, timezone como `string | null` e errors discriminados; `WeatherData` não contém flag stale.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`
- **Rastreabilidade:** FR2–FR8; AC-FR3.2, AC-FR4.3, AC-FR8.3.

### T-03 — Implementar validação e ordenação de busca
- **Tipo:** Data
- **Descrição:** implementar funções puras para normalizar nomes, validar caracteres aceitos e ordenar resultados com collation `pt-BR` e desempates definidos.
- **Critérios de aceite:** remove espaços externos; preserva caracteres Unicode aceitos; rejeita campo vazio, caracteres de controle e pontuação proibida; ordena por cidade, país, região e ID; retorna até dois candidatos para apresentação.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/lib/citySearch.ts`
- **Rastreabilidade:** FR1–FR2; AC-FR1.1–AC-FR1.5, AC-FR2.1.

### T-04 — Implementar conversão de temperatura
- **Tipo:** Data
- **Descrição:** implementar conversão derivada de Celsius/Fahrenheit sem mutar o modelo Celsius.
- **Critérios de aceite:** conversão nos dois sentidos inclui os casos `20 °C = 68 °F` e `-20,25 °C = -4,5 °F`; nenhuma chamada de rede é necessária.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Rastreabilidade:** FR5; AC-FR5.1–AC-FR5.5.

### T-29 — Implementar formatação regional
- **Tipo:** Data
- **Descrição:** formatar datas, horários, separadores decimais e temperatura convertida.
- **Critérios de aceite:** datas usam `dd/MM/yyyy`, horários 24 h, decimal com vírgula e temperatura com uma casa decimal e regra de arredondamento da spec.
- **Dependências:** T-02, T-04.
- **Arquivos prováveis:** `src/lib/format.ts`
- **Rastreabilidade:** FR5; NFR5; AC-FR5.2, AC-FR5.4, AC-FR5.5.

### T-05 — Implementar agregação diária por fuso local
- **Tipo:** Data
- **Descrição:** agrupar amostras horárias por data local e calcular médias de temperatura, umidade e vento para os cinco dias previstos.
- **Critérios de aceite:** recebe fuso IANA resolvido; calcula dias consecutivos sem depender do fuso do dispositivo; não presume exatamente 24 amostras; retorna campos ausentes como `null`; sem fuso em nenhuma fonte, não gera datas de previsão.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/lib/dailyAggregation.ts`
- **Rastreabilidade:** FR4; AC-FR4.1–AC-FR4.4.

### T-06 — Testar funções de busca
- **Tipo:** Test
- **Descrição:** cobrir normalização, validação, collation, desempate e limite de candidatos.
- **Critérios de aceite:** testes cobrem Unicode, acentos, espaços, pontuação permitida/proibida, campo vazio, empate por cidade/país/região/ID e ordenação estável.
- **Dependências:** T-03.
- **Arquivos prováveis:** `tests/unit/citySearch.test.ts`
- **Rastreabilidade:** AC-FR1.1–AC-FR1.5, AC-FR2.1.

### T-07 — Testar conversão e arredondamento
- **Tipo:** Test
- **Descrição:** validar a conversão de temperatura em ambas as direções.
- **Critérios de aceite:** asserções verificam `20 °C -> 68 °F`, `68 °F -> 20 °C` e `-20,25 °C -> -4,5 °F`; a instância Celsius de entrada permanece inalterada.
- **Dependências:** T-04.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`
- **Rastreabilidade:** AC-FR5.1–AC-FR5.5.

### T-30 — Testar formatação regional
- **Tipo:** Test
- **Descrição:** validar formatos de data/hora e arredondamento exibido.
- **Critérios de aceite:** `2026-11-05` é formatado como `05/11/2026`, `14:05` permanece em 24 h, `12.5` é exibido como `12,5`; temperatura usa uma casa decimal e a regra de empate afastado de zero.
- **Dependências:** T-29.
- **Arquivos prováveis:** `tests/unit/format.test.ts`
- **Rastreabilidade:** NFR5; AC-FR5.2, AC-FR5.4, AC-FR5.5.

### T-08 — Testar agregação diária e fuso
- **Tipo:** Test
- **Descrição:** validar agrupamento das observações e médias por data no fuso local.
- **Critérios de aceite:** cobre amostras ausentes, mudança de dia entre UTC e fuso local, quantidades de amostras diferentes de 24 e ausência de fuso.
- **Dependências:** T-05.
- **Arquivos prováveis:** `tests/unit/dailyAggregation.test.ts`
- **Rastreabilidade:** AC-FR4.1–AC-FR4.4.

## Entrega 2 — Integração Open-Meteo e mapeamento

### T-09 — Implementar serviço de geocoding
- **Tipo:** Data
- **Descrição:** chamar o endpoint de busca diretamente via HTTPS, codificar parâmetros e devolver DTOs sem lógica de apresentação.
- **Critérios de aceite:** envia `name`, `count=100`, `language=pt` e `format=json`; valida HTTP e JSON; aceita timeout/cancelamento de 5 segundos; não faz retry automático.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/services/openMeteoService.ts`
- **Rastreabilidade:** FR1–FR2, FR6–FR7; NFR4, NFR6.

### T-10 — Testar serviço de geocoding
- **Tipo:** Test
- **Descrição:** testar requisição, parsing e falhas do geocoding com `fetch` mockado.
- **Critérios de aceite:** verifica URL/parâmetros, sucesso, resposta sem resultados, HTTP não-2xx, JSON inválido, falha de rede, abort em 5 segundos e descarte de resposta tardia.
- **Dependências:** T-09.
- **Arquivos prováveis:** `tests/unit/openMeteoService.test.ts`
- **Rastreabilidade:** FR1–FR2, FR6; AC-FR2.3, AC-FR6.4.

### T-11 — Implementar serviço de forecast
- **Tipo:** Data
- **Descrição:** buscar `current`, `hourly` e `daily` para as coordenadas selecionadas, com unidades e timezone especificados.
- **Critérios de aceite:** envia os campos da spec, `forecast_days=5`, `timezone=auto`, Celsius, km/h, mm e hPa; valida status/JSON; aceita cancelamento e timeout total de 5 segundos; não repete automaticamente.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/services/openMeteoService.ts`
- **Rastreabilidade:** FR3–FR8; AC-FR3.1, AC-FR4.1, AC-FR6.4, AC-FR7.3.

### T-12 — Testar serviço de forecast
- **Tipo:** Test
- **Descrição:** verificar a chamada ao forecast e os caminhos HTTP/rede com fixtures mockadas.
- **Critérios de aceite:** verifica coordenadas, parâmetros, unidades, fuso, timeout, abort, resposta tardia e erros de status/JSON.
- **Dependências:** T-11.
- **Arquivos prováveis:** `tests/unit/openMeteoService.test.ts`
- **Rastreabilidade:** FR3–FR8; AC-FR6.1, AC-FR6.2, AC-FR6.4.

### T-13 — Mapear respostas para WeatherData
- **Tipo:** Data
- **Descrição:** converter DTOs para modelos de domínio, respeitando precedência de fuso, campos parciais e timestamps.
- **Critérios de aceite:** mapeia geocoding a `City`; usa timezone do forecast antes do geocoding; normaliza timestamps para UTC; agrega os cinco dias via T-05; mantém campos ausentes como `null`; retorna `WeatherData` sem flag stale duplicada.
- **Dependências:** T-02, T-05.
- **Arquivos prováveis:** `src/lib/weatherMapper.ts`
- **Rastreabilidade:** FR2–FR4, FR8; AC-FR2.2, AC-FR3.2, AC-FR4.3, AC-FR4.4, AC-FR8.1.

### T-14 — Testar mapeamento e respostas parciais
- **Tipo:** Test
- **Descrição:** cobrir transformação de DTOs, timestamps, fuso e campos ausentes.
- **Critérios de aceite:** fixtures validam correspondência dos campos, precedência de timezone, normalização UTC, dias locais e ausência parcial sem inventar valores.
- **Dependências:** T-13.
- **Arquivos prováveis:** `tests/unit/weatherMapper.test.ts`
- **Rastreabilidade:** AC-FR3.2, AC-FR4.1–AC-FR4.4, AC-FR8.1.

## Entrega 3 — Orquestração e interface

### T-15 — Implementar estado de busca e seleção
- **Tipo:** UI
- **Descrição:** coordenar busca de cidades, estado da busca e seleção em estado transitório React.
- **Critérios de aceite:** busca usa `idle/loading/success/empty/error`; resultado vazio é distinto de erro; seleção retém `City` e ID sem persistir estado.
- **Dependências:** T-02, T-03, T-09, T-13.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Rastreabilidade:** FR1–FR2, FR6; AC-FR1.1–AC-FR2.3, AC-FR6.1–AC-FR6.3.

### T-16 — Testar busca e seleção no hook
- **Tipo:** Test
- **Descrição:** testar o fluxo de busca e seleção do hook com serviço simulado.
- **Critérios de aceite:** cobre sucesso, zero resultados, erro, timeout, preservação da cidade após seleção e ausência de chamadas enquanto a busca não é enviada.
- **Dependências:** T-15.
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`
- **Rastreabilidade:** AC-FR1.1–AC-FR2.3, AC-FR6.1–AC-FR6.4.

### T-31 — Implementar consulta meteorológica no hook
- **Tipo:** UI
- **Descrição:** coordenar forecast, estados meteorológicos, retry e atualização manual.
- **Critérios de aceite:** estados usam `idle/loading/success/error`; retry/refresh são manuais; unidade começa em Celsius e não persiste; refresh falho conserva dados anteriores e timestamp de sucesso.
- **Dependências:** T-02, T-11, T-13, T-15.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Rastreabilidade:** FR3–FR8; AC-FR3.1–AC-FR8.3.

### T-32 — Testar estado meteorológico no hook
- **Tipo:** Test
- **Descrição:** testar consulta, retry, refresh, unidade e falha de atualização.
- **Critérios de aceite:** cobre success, erro, timeout, retry manual, troca de unidade sem request e retenção dos dados anteriores no refresh falho.
- **Dependências:** T-31.
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`
- **Rastreabilidade:** AC-FR3.1–AC-FR8.3.

### T-17 — Implementar busca e seleção de cidade
- **Tipo:** UI
- **Descrição:** criar entrada com envio explícito e lista de até dois resultados, usando componentes acessíveis.
- **Critérios de aceite:** input vazio/inválido não envia request; Enter/botão envia busca; resultados exibem nome/país e contexto de desambiguação disponível; selecionar cidade chama callback com `City`.
- **Dependências:** T-03, T-15.
- **Arquivos prováveis:** `src/components/SearchBar.tsx`, `src/components/CityResults.tsx`
- **Rastreabilidade:** FR1–FR2; AC-FR1.1–AC-FR2.3; NFR2.

### T-18 — Testar busca e seleção na UI
- **Tipo:** Test
- **Descrição:** testar a interação dos componentes de busca com Testing Library.
- **Critérios de aceite:** cobre submit explícito, teclado, input inválido, lista ordenada e limitada, estado vazio, erro e seleção do ID correto.
- **Dependências:** T-17.
- **Arquivos prováveis:** `tests/unit/SearchBar.test.tsx`, `tests/unit/CityResults.test.tsx`
- **Rastreabilidade:** AC-FR1.1–AC-FR2.3; NFR2.

### T-19 — Implementar CurrentWeather
- **Tipo:** UI
- **Descrição:** apresentar apenas o clima atual com os formatos e campos do domínio.
- **Critérios de aceite:** valores e unidades atuais corretos; cada campo nulo aparece como “Indisponível”; horários e números seguem formatos pt-BR; texto externo é renderizado como texto.
- **Dependências:** T-02, T-13, T-15.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Rastreabilidade:** FR3; AC-FR3.1–AC-FR3.2; NFR5–NFR6.

### T-20 — Testar CurrentWeather
- **Tipo:** Test
- **Descrição:** validar apresentação do clima atual com fixtures completas e parciais.
- **Critérios de aceite:** cobre campos e unidades, “Indisponível” e renderização de valores externos como texto.
- **Dependências:** T-19.
- **Arquivos prováveis:** `tests/unit/CurrentWeather.test.tsx`
- **Rastreabilidade:** AC-FR3.1–AC-FR3.2; NFR2, NFR5, NFR6.

### T-33 — Implementar ForecastCard
- **Tipo:** UI
- **Descrição:** apresentar as métricas de um dia de previsão.
- **Critérios de aceite:** mostra data local e campos diários; valores `null` aparecem como “Indisponível”; formatos seguem pt-BR.
- **Dependências:** T-02, T-05, T-13, T-15.
- **Arquivos prováveis:** `src/components/ForecastCard.tsx`
- **Rastreabilidade:** FR4; AC-FR4.1–AC-FR4.3; NFR2, NFR5.

### T-34 — Implementar ForecastList
- **Tipo:** UI
- **Descrição:** compor e ordenar cinco ForecastCards consecutivos.
- **Critérios de aceite:** apresenta cinco datas no fuso local, em ordem cronológica; sem fuso em forecast e geocoding, não apresenta datas inventadas.
- **Dependências:** T-33.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`
- **Rastreabilidade:** FR4; AC-FR4.1, AC-FR4.4.

### T-35 — Testar ForecastCard
- **Tipo:** Test
- **Descrição:** validar card diário completo e parcial.
- **Critérios de aceite:** cobre métricas, unidades e marcador “Indisponível” sem ocultar campos válidos.
- **Dependências:** T-33.
- **Arquivos prováveis:** `tests/unit/ForecastCard.test.tsx`
- **Rastreabilidade:** AC-FR4.2–AC-FR4.3; NFR2, NFR5.

### T-36 — Testar ForecastList
- **Tipo:** Test
- **Descrição:** validar composição e ordenação dos cinco dias.
- **Critérios de aceite:** verifica cinco datas consecutivas em ordem local e comportamento sem fuso.
- **Dependências:** T-34.
- **Arquivos prováveis:** `tests/unit/ForecastList.test.tsx`
- **Rastreabilidade:** AC-FR4.1, AC-FR4.4.

### T-21 — Implementar UnitToggle
- **Tipo:** UI
- **Descrição:** criar o controle de unidade da temperatura.
- **Critérios de aceite:** mostra a unidade atual, emite alternância para o hook e não inicia request.
- **Dependências:** T-04, T-15.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`
- **Rastreabilidade:** FR5; AC-FR5.1–AC-FR5.5; NFR2.

### T-22 — Implementar estados loading e vazio
- **Tipo:** UI
- **Descrição:** criar apresentações de loading e busca vazia.
- **Critérios de aceite:** estados são distinguíveis; vazio mostra mensagem especificada; estado loading é anunciado semanticamente.
- **Dependências:** T-15.
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`, `src/components/states/EmptyState.tsx`
- **Rastreabilidade:** FR6; AC-FR6.1, AC-FR6.3; NFR2, NFR5.

### T-37 — Implementar RefreshButton
- **Tipo:** UI
- **Descrição:** criar a ação manual de atualização de dados.
- **Critérios de aceite:** emite callback apenas após ação explícita; nome acessível; não agenda atualização automática.
- **Dependências:** T-02, T-31.
- **Arquivos prováveis:** `src/components/RefreshButton.tsx`
- **Rastreabilidade:** FR8; AC-FR8.1–AC-FR8.2; NFR2.

### T-38 — Implementar RetryButton
- **Tipo:** UI
- **Descrição:** criar ação de nova tentativa após erro ou timeout.
- **Critérios de aceite:** emite callback para retry manual, mantém foco acessível e não repete automaticamente.
- **Dependências:** T-02, T-31.
- **Arquivos prováveis:** `src/components/RetryButton.tsx`
- **Rastreabilidade:** FR7; AC-FR7.1–AC-FR7.3; NFR2.

### T-39 — Implementar estados de erro e timeout
- **Tipo:** UI
- **Descrição:** apresentar erro genérico de consulta e timeout como estados distintos.
- **Critérios de aceite:** mensagens correspondem à spec; timeout não é apresentado como vazio; inclui ação de retry acessível.
- **Dependências:** T-02, T-38.
- **Arquivos prováveis:** `src/components/states/ErrorState.tsx`, `src/components/states/TimeoutState.tsx`
- **Rastreabilidade:** FR6–FR7; AC-FR6.2, AC-FR6.4; NFR2, NFR5.

### T-40 — Implementar StaleDataNotice
- **Tipo:** UI
- **Descrição:** indicar que os dados anteriores continuam visíveis após refresh falho.
- **Critérios de aceite:** aviso só é renderizado quando o estado de erro contém `previous`; mostra rótulo “Desatualizado” e última consulta bem-sucedida.
- **Dependências:** T-02, T-31.
- **Arquivos prováveis:** `src/components/states/StaleDataNotice.tsx`
- **Rastreabilidade:** FR8; AC-FR8.3; NFR2, NFR5.

### T-23 — Testar UnitToggle
- **Tipo:** Test
- **Descrição:** validar somente o toggle de unidade com Testing Library.
- **Critérios de aceite:** confirma unidade inicial Celsius, callback de alternância, operação por teclado e ausência de request.
- **Dependências:** T-21.
- **Arquivos prováveis:** `tests/unit/UnitToggle.test.tsx`
- **Rastreabilidade:** AC-FR5.1–AC-FR5.5; NFR2.

### T-41 — Testar controles de refresh e retry
- **Tipo:** Test
- **Descrição:** testar ações manuais de atualizar e tentar novamente.
- **Critérios de aceite:** cada controle emite seu callback só após ação explícita e tem nome acessível; não agenda repetição.
- **Dependências:** T-37, T-38.
- **Arquivos prováveis:** `tests/unit/RefreshRetryButtons.test.tsx`
- **Rastreabilidade:** AC-FR7.1–AC-FR8.2; NFR2.

### T-42 — Testar componentes de estado
- **Tipo:** Test
- **Descrição:** validar estados de loading, vazio, erro, timeout e stale.
- **Critérios de aceite:** cada estado tem conteúdo/role distinto; retry é acionável; stale requer `previous`; todos são utilizáveis por teclado.
- **Dependências:** T-22, T-39, T-40.
- **Arquivos prováveis:** `tests/unit/states.test.tsx`
- **Rastreabilidade:** AC-FR6.1–AC-FR8.3; NFR2.

### T-24 — Compor App
- **Tipo:** UI
- **Descrição:** compor busca, conteúdo meteorológico, controles e estados na página.
- **Critérios de aceite:** fluxo completo usa um único estado de aplicação e encaminha callbacks/dados aos componentes corretos; estilos responsivos ficam em T-43.
- **Dependências:** T-15, T-17, T-19, T-21, T-22, T-31, T-33, T-34, T-37, T-38, T-39, T-40.
- **Arquivos prováveis:** `src/App.tsx`
- **Rastreabilidade:** FR1–FR8.

### T-43 — Aplicar tema e layout responsivo
- **Tipo:** UI
- **Descrição:** configurar dark glassmorphism e regras responsivas do layout.
- **Critérios de aceite:** tema segue as instruções do projeto; layout começa em 320 px e não produz rolagem horizontal até desktop.
- **Dependências:** T-24.
- **Arquivos prováveis:** `src/styles/index.css`, `tailwind.config.js`
- **Rastreabilidade:** NFR1.

## Entrega 4 — E2E, acessibilidade e usabilidade

### T-25 — Cobrir fluxo principal com Playwright
- **Tipo:** Test
- **Descrição:** automatizar o fluxo de busca, seleção e consulta com fixtures interceptadas em desktop e viewport mobile.
- **Critérios de aceite:** no mesmo cenário, executar em 1280 × 800 px e 390 × 844 px; verificar cidade selecionada, clima atual, cinco datas consecutivas e alternância °C/°F sem nova chamada; não depender da API ao vivo.
- **Dependências:** T-24, T-43.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Rastreabilidade:** FR1–FR5; NFR3, NFR5.

### T-26 — Validar erros e atualização em Playwright
- **Tipo:** Test
- **Descrição:** cobrir geocoding vazio, falhas, timeout, resposta parcial, retry e snapshot desatualizado.
- **Critérios de aceite:** fixtures determinísticas verificam mensagens, ausência de retry automático, retry manual, dados parciais e preservação do último sucesso.
- **Dependências:** T-24, T-25, T-43.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Rastreabilidade:** FR6–FR8; AC-FR2.3, AC-FR3.2, AC-FR4.3, AC-FR6.1–AC-FR8.3.

### T-27 — Verificar viewport mobile
- **Tipo:** Test
- **Descrição:** executar os fluxos essenciais em viewports móveis no navegador alvo.
- **Critérios de aceite:** Playwright usa `chrome` em Ubuntu 22.04; testa 320 × 640 px e 390 × 844 px; tarefas essenciais funcionam sem rolagem horizontal.
- **Dependências:** T-24, T-25, T-43.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Rastreabilidade:** NFR1, NFR3.

### T-44 — Auditar acessibilidade automatizada
- **Tipo:** Test
- **Descrição:** executar axe nas páginas e estados principais, complementado por verificação manual.
- **Critérios de aceite:** usa `@axe-core/playwright`; violações WCAG A/AA são corrigidas ou justificadas; teclado, foco e leitor de tela recebem revisão manual.
- **Dependências:** T-01, T-24, T-25, T-26, T-43.
- **Arquivos prováveis:** `tests/e2e/accessibility.spec.ts`
- **Rastreabilidade:** NFR2.

### T-28 — Avaliar usabilidade com a persona prioritária
- **Tipo:** Test
- **Descrição:** conduzir teste de usabilidade do fluxo de planejamento de atividades, sem analytics ou telemetria.
- **Critérios de aceite:** tarefas e observações são registradas; problemas que impedem buscar uma cidade, comparar os cinco dias ou interpretar campos são relatados para triagem; não são coletados eventos de uso em produção.
- **Dependências:** T-24, T-25, T-26, T-27, T-44.
- **Arquivos prováveis:** `docs/usability-test-plan.md`, `docs/usability-test-notes.md`
- **Rastreabilidade:** Overview; avaliação de sucesso definida na spec.