# Discovery — Aplicação de previsão do tempo

## Contexto

A empresa precisa de uma aplicação web responsiva de previsão do tempo para que usuários consultem as condições de uma cidade e planejem os próximos dias. O público prioritário é quem planeja atividades. O produto usa Open-Meteo, oferece previsão diária para hoje e os quatro dias seguintes e apresenta a interface em pt-BR. Sua cobertura geográfica acompanha as localidades disponíveis no Open-Meteo; o caminho técnico de integração será definido posteriormente.

## Personas (hipóteses para validação)

Como o briefing não inclui pesquisa com usuários, estas personas são arquétipos iniciais, não perfis validados.

| Persona | Objetivo principal | Contexto de uso | Métrica de sucesso do ponto de vista da pessoa |
| --- | --- | --- | --- |
| **Planejador de atividades (principal)** | Comparar os próximos dias para escolher quando realizar uma viagem curta ou atividade ao ar livre. | Desktop para planejar com antecedência; mobile para revisar a previsão durante o deslocamento. | Consulta a previsão completa de cinco dias para a cidade correta e identifica um dia adequado à atividade em uma sessão. |
| **Decisora da rotina diária (secundária)** | Consultar rapidamente o clima atual para decidir como se vestir ou se preparar para o deslocamento. | Principalmente mobile, em uma consulta breve antes de sair de casa. | Encontra a cidade e entende as condições atuais sem precisar consultar outra fonte. |

## Requisitos Funcionais

- **RF1 — Buscar cidades:** permitir que o usuário pesquise uma cidade pelo nome e selecione o local desejado.
- **RF2 — Consultar clima atual:** exibir temperatura, umidade, vento, precipitação e pressão para a cidade selecionada.
- **RF3 — Consultar previsão:** exibir previsão diária de hoje e dos quatro dias seguintes, incluindo temperatura, umidade, vento, precipitação e pressão, no fuso horário de Brasília (America/Sao_Paulo).
- **RF4 — Alternar unidades:** permitir alternar temperaturas entre Celsius e Fahrenheit. Exibir velocidade do vento em km/h, precipitação em mm e pressão em hPa.
- **RF5 — Desambiguar cidades:** quando a busca retornar cidades homônimas, apresentar contexto de localização, como estado/região e país, quando disponível, para que o usuário selecione o local correto.
- **RF6 — Informar estados da consulta:** apresentar estados de carregamento, erro e ausência de resultados durante a busca e a consulta de dados meteorológicos.
- **RF7 — Tentar novamente:** permitir repetir uma consulta que falhou e manter a cidade selecionada para evitar que o usuário precise refazer a busca.
- **RF8 — Atualizar dados manualmente:** permitir que o usuário faça uma nova consulta para atualizar os dados e indicar como horário da última atualização o horário dessa consulta.

## Requisitos Não-Funcionais

- **RNF1 — Responsividade e experiência móvel:** a interface deve funcionar em larguras de viewport a partir de 320 px até telas desktop, sem rolagem horizontal ou perda das funcionalidades principais. Os fluxos de busca e consulta devem ser utilizáveis em dispositivos móveis.
- **RNF2 — Acessibilidade:** os fluxos principais devem ser operáveis por teclado e atender ao WCAG 2.2 nível AA. Controles devem ter nomes acessíveis e mudanças relevantes, como carregamento e erro, devem ser comunicadas a tecnologias assistivas.
- **RNF3 — Compatibilidade:** a aplicação deve funcionar nos navegadores desktop e móveis definidos para suporte. Como critério inicial, propõe-se suportar as duas versões estáveis mais recentes de Chrome, Firefox, Edge e Safari, incluindo Safari em iOS e Chrome em Android; a lista deve ser confirmada.
- **RNF4 — Privacidade:** a aplicação não deve coletar localização do usuário, telemetria ou dados de analytics. Não deve armazenar preferências localmente nem persistir dados no servidor.

## Riscos

| Categoria | Risco | Probabilidade | Impacto | Estratégia de mitigação |
| --- | --- | --- | --- | --- |
| Produto | Público-alvo e necessidade não validados podem levar a um app que não resolve a tarefa prioritária dos usuários. | Média | Alto | Entrevistar usuários representativos, validar os principais cenários e definir métricas de sucesso antes de fechar o escopo. |
| Técnico e produto | O Open-Meteo pode não disponibilizar todos os campos definidos para cada localidade coberta. | Média | Alto | Verificar a disponibilidade dos campos requeridos nos locais suportados e tratar dados indisponíveis de forma clara. |
| Produto | Cidades homônimas ou falta de contexto nos resultados podem levar à consulta do local errado. | Média | Alto | Exibir região/estado e país nos resultados quando disponíveis e permitir que a pessoa confirme a cidade. |
| Técnico | Indisponibilidade, limite de requisições, resposta lenta ou mudança na API externa pode interromper ou atrasar busca e previsão. | Média | Alto | Avaliar limites e termos do provedor; tratar falhas, permitir nova consulta manual e comunicar o estado ao usuário. |
| Técnico e produto | Dados imprecisos, desatualizados ou com cobertura desigual podem reduzir a confiança do usuário. | Média | Alto | Validar qualidade e cobertura do provedor nas regiões-alvo e informar o horário da última consulta. |
| Técnico e produto | Erros de conversão de unidade, data ou fuso horário podem apresentar temperaturas e dias incorretos. | Média | Alto | Centralizar conversões e regras de data/fuso e cobrir limites e combinações relevantes com testes automatizados. |
| Técnico e produto | Layout ou interação incompatíveis com dispositivos, navegadores ou tecnologias assistivas podem bloquear tarefas essenciais. | Média | Alto | Prototipar em telas pequenas, validar teclado e leitor de tela e executar testes nos navegadores e dispositivos acordados. |
| Técnico e produto | A consulta de cidade enviada ao provedor externo pode ser tratada conforme as políticas desse provedor, mesmo sem coleta de localização pelo app. | Média | Médio | Revisar os termos e práticas de tratamento do Open-Meteo e não transmitir localização precisa, telemetria ou dados desnecessários. |
| Produto | Incluir login, favoritos, alertas ou suporte offline sem priorização pode ampliar o escopo e atrasar a entrega do valor principal. | Média | Médio | Delimitar MVP e critérios de priorização; tratar recursos adicionais como decisões explícitas de escopo. |
| Produto | Sem critérios de sucesso, a equipe pode entregar funcionalidades sem saber se resolvem a necessidade ou são usadas. | Média | Médio | Definir indicadores e eventos de sucesso antes do lançamento, respeitando minimização de dados e privacidade. |

## Decisões

| Decisão | Justificativa | Pergunta em aberto resolvida |
| --- | --- | --- |
| **Plataforma:** aplicação web responsiva. | Define a plataforma da primeira versão e permite atender ao uso em dispositivos móveis pelo navegador. | O produto será web responsivo, app nativo ou ambos? |
| **Fonte de dados:** Open-Meteo, sem API key. | Evita gerenciar uma chave de API na integração inicial. | Define o provedor; ainda é necessário confirmar disponibilidade dos campos necessários, licença e limites de uso. |
| **Cobertura geográfica:** a mesma disponibilizada pelo Open-Meteo. | Alinha as localidades disponíveis no produto à cobertura da fonte escolhida. | Quais localidades o produto deve cobrir? |
| **Caminho da integração:** será definido posteriormente. | A estratégia de integração depende de uma decisão técnica ainda não fornecida. | Como o app web se comunicará com o Open-Meteo? |
| **Contrato da previsão:** dados diários para hoje e os quatro dias seguintes, com datas no fuso de Brasília (America/Sao_Paulo). | Fixa o período e a interpretação das datas no mercado inicial. | Define que os cinco dias incluem hoje, têm granularidade diária e seguem o fuso de Brasília. |
| **Atualização dos dados:** somente por nova consulta iniciada pelo usuário; o horário da última atualização corresponde ao horário da última consulta. | Torna explícito que não haverá atualização automática e como apresentar a recência dos dados. | Define o modo de atualização e o significado do horário mostrado ao usuário. |
| **Unidades:** Celsius como padrão, com alternância para Fahrenheit; vento em km/h, precipitação em mm e pressão em hPa. | Define unidades consistentes para os dados apresentados. | Define unidade padrão e unidades de vento, precipitação e pressão. |
| **Preferências:** não persistir preferências localmente. | Evita armazenamento de estado de preferência entre sessões. | Define que a unidade escolhida não será lembrada entre acessos. |
| **Autenticação e persistência no servidor:** não haverá na primeira versão. | Mantém o escopo inicial simples e evita armazenar dados de usuário no servidor. | Define que a primeira versão não terá login nem dados persistidos no servidor. |
| **Idioma da interface:** pt-BR. | Define o idioma da experiência inicial. | Define o idioma da interface na primeira versão. |
| **Geolocalização:** fora do MVP. | Mantém a busca explícita por cidade e evita solicitar acesso à localização do dispositivo. | Define que geolocalização automática não faz parte da primeira versão. |
| **Coleta de dados:** não haverá coleta de localização, telemetria ou analytics pelo app. | Limita o tratamento de dados e evita instrumentação de analytics no MVP. | Define que o app não coletará esses dados; a consulta da cidade ainda será enviada ao provedor meteorológico. |

## Perguntas em Aberto
| Tema | Pergunta em aberto | Impacto de seguir sem resposta |
| --- | --- | --- |
| Necessidades do público prioritário | Quais atividades e cenários de planejamento são mais importantes para a persona prioritária? | A previsão pode não apresentar as informações e o fluxo mais úteis à principal tarefa do produto. |
| Sucesso do produto | Como será medido o sucesso do planejador de atividades (por exemplo, conclusão de consultas, satisfação ou retorno)? | Não será possível avaliar se a solução atende à necessidade nem priorizar melhorias. |
| Busca de cidades | Haverá autocomplete ou correção de erros de digitação? Como ordenar e distinguir cidades homônimas? | Usuários podem não encontrar ou selecionar a cidade correta; essas opções também alteram o escopo da busca. |
| Caminho da integração | O app web chamará o Open-Meteo diretamente ou por meio de um serviço intermediário? | Afeta CORS, exposição de metadados da consulta, tratamento de falhas, hospedagem e arquitetura; a decisão técnica será fornecida posteriormente. |
| Fonte de dados | O Open-Meteo atende aos requisitos de precisão, cobertura geográfica e licença para os mercados-alvo? | Podem surgir restrições, cobertura insuficiente ou necessidade de trocar a integração após a implementação. |
| Falha de rede e dados antigos | É necessário cache ou uso parcial offline? Dados em cache podem ser exibidos e por quanto tempo? | Sem decisão, a experiência em falhas pode ser inconsistente ou exibir informação antiga sem contexto. |
| Formatos regionais | Quais formatos de data/hora, separadores numéricos e convenções regionais devem ser usados junto à interface pt-BR? | Datas e valores podem ser interpretados incorretamente; internacionalização tardia aumenta retrabalho. |
| Acessibilidade | WCAG 2.2 nível AA é o padrão esperado? Há necessidades adicionais de teclado, leitor de tela, contraste ou movimento reduzido? | Barreiras podem impedir o uso por pessoas com deficiência e correções tardias podem exigir mudanças estruturais. |
| Dispositivos e navegadores | Quais versões de sistemas operacionais, navegadores e tamanhos de tela devem ser suportados? | Testes e compatibilidade ficam indefinidos, com risco de falhas em dispositivos usados pelo público-alvo. |
| Privacidade e segurança | Quais requisitos de segurança e obrigações legais se aplicam às consultas de cidade enviadas ao provedor externo? | A ausência de analytics e coleta de localização não elimina o tratamento da consulta pelo provedor; termos ou obrigações podem afetar a integração. |
| Preferências e personalização | Favoritos e histórico fazem parte do MVP, apesar da decisão de não persistir preferências localmente nem dados no servidor? | Esses recursos exigem persistência e podem contrariar as decisões de armazenamento ou ampliar o escopo. |
| Alertas e escopo | Alertas de tempo severo, notificações, publicidade ou outros recursos estão no escopo inicial? | Sem delimitação, há risco de expectativas incompatíveis, aumento de escopo e esforço não planejado. |

## Suposições

- O usuário informa uma cidade para consultar; geolocalização está fora do MVP.
- A consulta de clima atual e previsão é feita para a mesma cidade selecionada.
- Celsius e Fahrenheit se aplicam a todas as temperaturas apresentadas; vento é exibido em km/h, precipitação em mm e pressão em hPa.
- A previsão é diária, cobre hoje e os quatro dias seguintes e usa o fuso de Brasília (America/Sao_Paulo).
- Os dados só são atualizados após nova consulta iniciada pelo usuário; o horário da última atualização é o horário dessa consulta.
- O acesso a dados meteorológicos depende de conexão com a internet.
- A primeira versão será web responsiva, sem autenticação, persistência no servidor ou persistência local de preferências.
- O app não coletará localização, telemetria ou analytics; a consulta de cidade será enviada ao provedor para obter os dados meteorológicos.
- O idioma da interface será pt-BR, mas formatos regionais de data, hora e outras medidas ainda precisam ser definidos.
