# Especificação de Produto — Weather App

## Overview

O Weather App é uma aplicação web responsiva, em pt-BR, para ajudar principalmente pessoas que planejam atividades a comparar o clima de uma cidade. O usuário pesquisa e seleciona uma cidade, consulta o clima atual e uma previsão diária de cinco dias (hoje e os quatro dias seguintes), podendo alternar a temperatura entre Celsius e Fahrenheit.

A fonte meteorológica definida é Open-Meteo, sem API key, chamada diretamente pela aplicação web. Os campos requeridos estão disponíveis nas localidades cobertas, sem limitações conhecidas no momento. Cada cidade usa seu fuso horário local para determinar os dias da previsão. O sucesso do produto será avaliado exclusivamente por testes de usabilidade.

## Functional Requirements

- **FR1 — Pesquisar cidade:** a pessoa informa o nome de uma cidade e inicia a busca por ação explícita; não há busca automática enquanto digita. Aceitar letras Unicode, marcas diacríticas, números, espaços, hífens, apóstrofos e pontos; remover espaços no início e no fim e rejeitar caracteres de controle e demais pontuações.
- **FR2 — Exibir e selecionar resultados:** ordenar todos os candidatos pelo nome da cidade usando collation pt-BR e, em caso de empate, por país, região e identificador do provedor; apresentar no máximo os dois primeiros. Cada resultado exibe nome e país, região/estado quando disponível e coordenadas quando nome, país e região/estado não bastarem para distingui-lo. A seleção mantém o identificador único do local.
- **FR3 — Exibir clima atual:** para a cidade selecionada, exibir temperatura e umidade instantâneas, vento atual com velocidade, direção e rajadas, precipitação acumulada na última hora e pressão atmosférica atual reduzida ao nível do mar.
- **FR4 — Exibir previsão:** apresentar uma previsão diária para hoje e os quatro dias seguintes, segundo o fuso local da cidade selecionada. Para cada dia, exibir temperaturas mínima e máxima, código/ícone e condição meteorológica, umidade média, velocidade média do vento, direção predominante, rajadas máximas, precipitação acumulada e probabilidade máxima de precipitação.
- **FR5 — Alternar unidades:** iniciar temperaturas em Celsius e permitir alternar entre Celsius e Fahrenheit, exibidas com uma casa decimal e arredondamento para o décimo mais próximo (empates afastados de zero). Exibir vento em km/h, precipitação em mm e pressão em hPa.
- **FR6 — Comunicar estados da consulta:** apresentar estados distintos de carregamento, erro, timeout e ausência de resultados para busca e consulta meteorológica. A operação iniciada pela pessoa tem prazo total de 10 segundos, incluindo as chamadas necessárias ao provedor; respostas recebidas após o prazo são ignoradas.
- **FR7 — Repetir consulta com falha:** permitir que a pessoa inicie uma nova tentativa após falha ou timeout, mantendo a cidade selecionada. Não realizar novas tentativas automaticamente.
- **FR8 — Atualizar dados manualmente:** permitir iniciar uma nova consulta para atualizar os dados. Em caso de falha, manter os últimos dados bem-sucedidos, identificá-los como desatualizados, informar que a atualização falhou e indicar o horário de conclusão da última consulta bem-sucedida. Não há atualização automática.

## User Stories

- **US1 (FR1 — Pesquisar cidade):** Como planejador de atividades, quero buscar uma cidade pelo nome e enviar a busca para encontrar o local que desejo consultar.
- **US2 (FR2 — Exibir e selecionar resultados):** Como planejador de atividades, quero comparar os resultados pelo nome da cidade e país e selecionar o local correto para consultar sua previsão.
- **US3 (FR3 — Exibir clima atual):** Como decisora da rotina diária, quero ver a temperatura e as condições meteorológicas atuais da cidade selecionada para me preparar para o dia.
- **US4 (FR4 — Exibir previsão):** Como planejador de atividades, quero comparar as condições diárias de hoje e dos quatro dias seguintes para escolher quando realizar uma atividade.
- **US5 (FR5 — Alternar unidades):** Como decisora da rotina diária, quero alternar a temperatura entre Celsius e Fahrenheit para interpretar o valor na unidade que prefiro naquela sessão.
- **US6 (FR6 — Comunicar estados da consulta):** Como planejador de atividades, quero saber quando uma busca ou consulta está carregando, falhou ou não encontrou resultados para entender o que está acontecendo.
- **US7 (FR7 — Repetir consulta com falha):** Como planejador de atividades, quero tentar novamente uma consulta que falhou sem selecionar a cidade outra vez para obter seus dados.
- **US8 (FR8 — Atualizar dados manualmente):** Como planejador de atividades, quero solicitar uma nova consulta e ver seu horário para saber quando os dados foram consultados.

## Acceptance Criteria

- **AC-FR1.1**
	- **Given** a busca está disponível e o campo contém um nome de cidade não vazio
	- **When** a pessoa aciona o comando de busca
	- **Then** o sistema envia uma única busca com o nome informado.
- **AC-FR1.2**
	- **Given** a pessoa está digitando um nome de cidade no campo de busca
	- **When** ela ainda não aciona o comando de busca
	- **Then** o sistema não envia uma busca.
- **AC-FR1.3**
	- **Given** o campo de busca está vazio ou contém apenas espaços
	- **When** a pessoa tenta iniciar a busca
	- **Then** o sistema não envia a busca e solicita um nome de cidade.
- **AC-FR1.4**
	- **Given** o campo contém um caractere de controle
	- **When** a pessoa tenta enviar a busca
	- **Then** o sistema rejeita a entrada, não envia a consulta e solicita um nome válido.

- **AC-FR1.5**
	- **Given** o nome contém apenas letras Unicode, marcas diacríticas, números, espaços internos, hífens, apóstrofos ou pontos
	- **When** a pessoa envia a busca
	- **Then** o sistema aceita a entrada após remover espaços externos e preserva os caracteres do nome.
- **AC-FR2.1**
	- **Given** a busca retorna um ou mais candidatos
	- **When** o sistema apresenta os resultados
	- **Then** ordena todos os candidatos por nome usando collation pt-BR e, em caso de empate, por país, região e identificador do provedor; apresenta no máximo os dois primeiros, com nome e país, região/estado quando disponível, e coordenadas quando nome, país e região/estado não distinguirem os resultados.
- **AC-FR2.2**
	- **Given** há pelo menos um resultado de busca apresentado
	- **When** a pessoa seleciona um resultado
	- **Then** o identificador único associado ao resultado passa a identificar a cidade usada nas consultas meteorológicas.
- **AC-FR2.3**
	- **Given** a busca não encontra cidades
	- **When** a resposta vazia é apresentada
	- **Then** a interface exibe “Cidade não encontrada. Verifique a grafia e tente novamente.”
- **AC-FR3.1**
	- **Given** uma cidade foi selecionada e o provedor retorna todos os campos atuais solicitados
	- **When** a consulta do clima atual termina com sucesso
	- **Then** a interface apresenta temperatura e umidade instantâneas, velocidade e direção atuais do vento, rajadas, precipitação acumulada na última hora e pressão reduzida ao nível do mar, usando Celsius, km/h, mm e hPa, respectivamente.
- **AC-FR3.2**
	- **Given** uma cidade foi selecionada e o provedor não retorna um ou mais campos atuais solicitados
	- **When** o clima atual é apresentado
	- **Then** os campos ausentes mostram “Indisponível”, os demais campos válidos continuam visíveis e nenhum valor é inventado.
- **AC-FR4.1**
	- **Given** uma cidade selecionada tem um fuso horário local definido
	- **When** a previsão diária é apresentada
	- **Then** são exibidas cinco datas consecutivas, começando pela data atual no fuso local dessa cidade.
- **AC-FR4.2**
	- **Given** o provedor retorna os campos previstos para cada uma das cinco datas
	- **When** a previsão é apresentada
	- **Then** cada dia mostra temperaturas mínima e máxima, ícone e descrição da condição WMO, umidade e velocidade média do vento, direção predominante, rajada máxima, precipitação acumulada e probabilidade máxima.
- **AC-FR4.3**
	- **Given** o provedor não retorna um ou mais campos previstos para uma data
	- **When** essa data é apresentada
	- **Then** os campos ausentes mostram “Indisponível”, os demais campos válidos continuam visíveis e nenhum valor é inventado.
- **AC-FR4.4**
	- **Given** o provedor não fornece um fuso horário para a cidade selecionada
	- **When** o sistema tenta montar as datas da previsão
	- **Then** não usa o fuso do dispositivo como substituto, mantém o clima atual disponível se houver dados e informa que a previsão local está indisponível.
- **AC-FR5.1**
	- **Given** a sessão começa sem uma escolha de unidade
	- **When** uma temperatura é apresentada
	- **Then** ela é exibida em Celsius.
- **AC-FR5.2**
	- **Given** uma temperatura de 20 °C está apresentada
	- **When** a pessoa alterna a unidade para Fahrenheit
	- **Then** a mesma temperatura é apresentada como 68,0 °F, sem nova consulta e sem alterar a cidade selecionada.
- **AC-FR5.4**
	- **Given** uma temperatura é convertida entre Celsius e Fahrenheit
	- **When** o valor convertido é exibido
	- **Then** ele é arredondado para uma casa decimal, com valores exatamente no meio arredondados para longe de zero.
- **AC-FR5.5**
	- **Given** a temperatura é -20,25 °C
	- **When** a pessoa seleciona Fahrenheit
	- **Then** o valor exibido é -4,5 °F.
- **AC-FR5.3**
	- **Given** vento, precipitação ou pressão estão apresentados
	- **When** a pessoa alterna a unidade de temperatura
	- **Then** vento permanece em km/h, precipitação em mm e pressão em hPa.
- **AC-FR6.1**
	- **Given** uma busca ou consulta meteorológica foi iniciada e ainda não terminou
	- **When** a interface representa essa operação
	- **Then** apresenta o estado de carregamento.
- **AC-FR6.2**
	- **Given** uma busca ou consulta meteorológica termina com erro
	- **When** a interface apresenta o resultado da operação
	- **Then** exibe “Não foi possível consultar os dados do tempo. Tente novamente.” e uma ação de nova tentativa, sem apresentar o erro como carregamento ou ausência de resultados.
- **AC-FR6.3**
	- **Given** uma busca termina com zero resultados
	- **When** a interface apresenta o resultado
	- **Then** comunica o estado vazio com a mensagem definida em AC-FR2.3, sem apresentá-lo como erro.
- **AC-FR6.4**
	- **Given** uma operação iniciada pela pessoa ainda aguarda resposta do provedor
	- **When** 10 segundos se passam desde o início da operação
	- **Then** o sistema encerra a operação, ignora respostas tardias, exibe “A consulta excedeu 10 segundos. Tente novamente.” e oferece uma ação de nova tentativa, sem apresentar o timeout como ausência de resultados.
- **AC-FR7.1**
	- **Given** uma consulta falhou e a cidade selecionada permanece disponível
	- **When** a pessoa aciona tentar novamente
	- **Then** o sistema envia uma nova consulta para a mesma cidade sem exigir nova busca.
- **AC-FR7.2**
	- **Given** a nova tentativa retorna com sucesso
	- **When** a resposta é apresentada
	- **Then** a interface apresenta os dados retornados para a cidade selecionada.
- **AC-FR7.3**
	- **Given** uma consulta falhou ou expirou
	- **When** a pessoa ainda não aciona tentar novamente
	- **Then** o sistema não envia outra consulta automaticamente.
- **AC-FR8.1**
	- **Given** uma cidade está selecionada
	- **When** a pessoa aciona atualizar
	- **Then** o sistema inicia uma nova consulta para essa cidade e, se concluída com sucesso, indica o horário de conclusão como “Última consulta bem-sucedida”.
- **AC-FR8.2**
	- **Given** a consulta manual foi concluída
	- **When** a interface permanece aberta sem outra ação da pessoa
	- **Then** o sistema não inicia consultas periódicas ou em segundo plano.
- **AC-FR8.3**
	- **Given** há dados de uma consulta bem-sucedida anterior para a cidade selecionada
	- **When** uma atualização manual falha ou expira
	- **Then** os dados anteriores permanecem visíveis com o rótulo “Desatualizado”, a falha é comunicada e “Última consulta bem-sucedida” mantém o horário de conclusão da resposta anterior bem-sucedida.

## Traceability Matrix

| User Story | Requisito funcional | Critérios de aceite | Requisitos não-funcionais relevantes |
| --- | --- | --- | --- |
| US1 — Pesquisar cidade | FR1 | AC-FR1.1 a AC-FR1.5 | NFR1, NFR2, NFR3, NFR4, NFR5, NFR6 |
| US2 — Exibir e selecionar resultados | FR2 | AC-FR2.1 a AC-FR2.3 | NFR1, NFR2, NFR3, NFR4, NFR5, NFR6 |
| US3 — Exibir clima atual | FR3 | AC-FR3.1 a AC-FR3.2 | NFR1, NFR2, NFR3, NFR4, NFR5, NFR6 |
| US4 — Exibir previsão | FR4 | AC-FR4.1 a AC-FR4.4 | NFR1, NFR2, NFR3, NFR4, NFR5, NFR6 |
| US5 — Alternar unidades | FR5 | AC-FR5.1 a AC-FR5.5 | NFR1, NFR2, NFR3, NFR4, NFR5 |
| US6 — Comunicar estados da consulta | FR6 | AC-FR6.1 a AC-FR6.4 | NFR1, NFR2, NFR3, NFR5, NFR6 |
| US7 — Repetir consulta com falha | FR7 | AC-FR7.1 a AC-FR7.3 | NFR1, NFR2, NFR3, NFR4, NFR5, NFR6 |
| US8 — Atualizar dados manualmente | FR8 | AC-FR8.1 a AC-FR8.3 | NFR1, NFR2, NFR3, NFR4, NFR5, NFR6 |

## Non-Functional Requirements

- **NFR1 — Responsividade:** os fluxos principais devem funcionar de 320 px a telas desktop, sem rolagem horizontal ou perda de funcionalidades essenciais.
- **NFR2 — Acessibilidade:** os fluxos principais devem ser operáveis por teclado e atender ao WCAG 2.2 nível AA. Controles têm nomes acessíveis e estados de carregamento e erro são comunicados a tecnologias assistivas.
- **NFR3 — Compatibilidade:** suportar a versão estável mais recente do Google Chrome em Ubuntu 22.04. A interface deve continuar responsiva nas larguras previstas em NFR1.
- **NFR4 — Privacidade:** o app não coleta localização do dispositivo, telemetria ou analytics, não persiste preferências localmente e não persiste dados no servidor. A cidade pesquisada é enviada ao provedor meteorológico para realizar a consulta.
- **NFR5 — Idioma e formatos:** textos da interface em pt-BR; datas no formato `dd/MM/yyyy`, horários em formato de 24 horas e separador decimal por vírgula.
- **NFR6 — Transporte seguro:** servir a aplicação e realizar chamadas ao provedor exclusivamente por HTTPS. Dados de texto retornados pelo provedor devem ser apresentados como texto, sem interpretação como marcação executável.

## Edge Cases

- Campo de busca vazio ou contendo apenas espaços: não enviar consulta e solicitar um nome de cidade.
- Nome de cidade com acentos, espaços internos, hífens ou apóstrofos: aceitar e preservar esses caracteres; remover espaços externos. Rejeitar caracteres de controle e não enviar a consulta.
- Nenhuma cidade encontrada: informar que a cidade não foi encontrada e sugerir verificar a grafia.
- Cidades com nome e país iguais: incluir região/estado quando disponível; se nome, país e região/estado não distinguirem os resultados, apresentar coordenadas. A seleção deve permanecer vinculada ao identificador único do local.
- A resposta do provedor não contém um ou mais campos solicitados: mostrar “Indisponível” em cada campo ausente e manter visíveis os demais dados válidos.
- Falha de rede, limite de uso ou erro do provedor: mostrar “Não foi possível consultar os dados do tempo. Tente novamente.” e oferecer nova tentativa manual sem perder a cidade selecionada.
- Timeout: após 10 segundos desde o início da operação, encerrar a espera, ignorar respostas tardias, informar “A consulta excedeu 10 segundos. Tente novamente.” e não repetir automaticamente.
- Atualização manual falha após uma consulta anterior bem-sucedida: manter os dados anteriores com o rótulo “Desatualizado”, informar a falha e preservar o horário de conclusão da última consulta bem-sucedida.
- A cidade selecionada não tem fuso horário disponível: não usar o fuso do dispositivo para inventar datas; manter dados atuais se disponíveis e informar que a previsão local não pôde ser calculada.
- Mudança de dia no fuso local da cidade: as cinco datas devem ser determinadas pelo fuso local, não pelo fuso do dispositivo do usuário.
- A unidade de temperatura é alternada: converter somente a apresentação da temperatura; não refazer a busca nem alterar os demais valores.

## Assumptions

- As personas são hipóteses; o planejador de atividades é prioritário e a pessoa que consulta o clima atual é secundária.
- As localidades disponíveis seguem a cobertura oferecida pelo Open-Meteo; não se presume cobertura uniforme de todos os campos.
- A previsão é diária e inclui o dia atual e quatro dias seguintes no fuso local da cidade selecionada.
- Os valores atuais de temperatura e umidade são instantâneos; os valores previstos de temperatura e umidade são médias diárias.
- Os dados dependem de conexão com a internet.
- Não há autenticação, geolocalização automática, atualização automática, persistência de preferências, persistência no servidor, telemetria ou analytics.
- As chamadas meteorológicas são feitas diretamente ao Open-Meteo; não há cache de respostas nem suporte offline.
- A escolha de unidade vale somente para a sessão atual.
- O sucesso do produto será avaliado exclusivamente por testes de usabilidade, sem métricas de analytics em produção.

## Risks

| Risco | Mitigação |
| --- | --- |
| Mudança futura na disponibilidade dos campos meteorológicos do Open-Meteo. | Tratar campos ausentes explicitamente, sem criar valores, e verificar a disponibilidade dos dados quando houver mudança no provedor. |
| Nome da cidade e país não distinguirem homônimos. | Exibir região/estado quando disponível, coordenadas quando os demais campos não bastarem e manter a seleção ligada ao identificador único do local. |
| Datas incorretas por conversão ou uso do fuso do dispositivo em vez do local pesquisado. | Usar o fuso local associado à cidade e testar limites de mudança de dia. |
| Indisponibilidade, limite de uso ou alteração do provedor interromper consultas. | Revisar termos e limites do Open-Meteo, apresentar erros claros e permitir nova consulta manual. |
| Usuários interpretarem o horário da consulta como garantia de frescor dos dados meteorológicos. | Rotular o horário como horário da consulta e, se disponível, distinguir o horário de referência informado pela fonte. |
| Sem analytics, a equipe não terá medição contínua de adoção e sucesso após o lançamento. | Avaliar o produto exclusivamente por testes de usabilidade, conforme definido para o MVP. |

## Out of Scope

- Aplicativo nativo para iOS ou Android.
- Login, contas de usuário e persistência de dados no servidor.
- Persistência local de preferências entre sessões.
- Geolocalização automática do usuário.
- Atualização automática ou em segundo plano.
- Telemetria e analytics no produto.
- Previsão horária; o escopo definido é previsão diária.
- Cache de respostas meteorológicas e uso offline.
- Favoritos e histórico de cidades.
- Alertas meteorológicos e notificações.

## Open Questions

Nenhuma pergunta em aberto no momento.
