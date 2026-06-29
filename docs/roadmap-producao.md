# Roadmap para piloto e producao

## Objetivo

Preparar o PaoBom ERP para um piloto interno assistido e, depois, para uso real
com seguranca, rastreabilidade e capacidade de recuperacao.

O roadmap parte do estado atual:

- Web, Mobile, API e PostgreSQL funcionais;
- autenticacao e autorizacao no backend;
- staging local e staging hospedado automatizado;
- testes de dominio, API, interface e E2E do fluxo completo;
- auditoria persistente com mascaramento de dados sensiveis;
- rate limit de login e validacao server-side nos fluxos principais;
- Caddy na borda HTTPS com HSTS no ambiente hospedado.

## Principios de execucao

- Entregas pequenas e demonstraveis ao final de cada sprint
- Nenhum ambiente real sem backup restaurado e rollback ensaiado
- Regra sensivel validada no backend, nunca apenas na interface
- Evidencias de aceite registradas em checklist
- Piloto em paralelo ao processo atual, sem substituicao imediata
- Requisitos contabeis e fiscais validados por profissional habilitado

## Sequencia recomendada

| Fase | Nome | Duracao estimada | Dependencias |
| --- | --- | --- | --- |
| 27 | Sessoes seguras Web e Mobile | Concluida | Estado atual |
| 28 | Testes automatizados de interface | Concluida | Fase 27 |
| 29 | Staging hospedado e observabilidade | Infraestrutura concluida | Fase 27 |
| 30 | Backup, restore e rollback | 1 a 2 sprints | Fase 29 |
| 31 | Validacao contabil e fiscal | 2 a 4 sprints, em paralelo | Inicia na Fase 27 |
| 32 | Piloto interno assistido | 2 sprints | Fases 28 a 31 |

Uma sprint sugerida possui uma semana. A previsao total e de 10 a 14 semanas,
considerando validacao fiscal paralela e disponibilidade da operacao.

## Fase 27 - Sessoes seguras Web e Mobile

### Objetivo

Remover credenciais padrao das interfaces e garantir autenticacao persistente,
revogavel e segura nos dois clientes.

### Entregas

- Tela de login Web com estados de carregamento, erro e sessao expirada
- Remocao de `NEXT_PUBLIC_API_DEFAULT_EMAIL` e senha padrao do fluxo normal
- Persistencia segura do token Mobile em armazenamento protegido
- Restauracao da sessao ao abrir Web e Mobile
- Logout local e revogacao da sessao no backend
- Renovacao controlada ou nova autenticacao ao expirar
- Bloqueio de rotas e acoes conforme permissoes retornadas pela API
- Limpeza da sessao em respostas `401`
- Politica de expiracao e limite de sessoes documentada
- Rate limit no endpoint de login
- Auditoria de login, logout, expiracao e falhas de autenticacao

### Criterios de aceite

- Nenhuma credencial operacional fica embutida no bundle Web ou Mobile
- Reiniciar o Mobile preserva uma sessao valida
- Logout revoga o token e impede sua reutilizacao
- Sessao expirada redireciona para login sem perder integridade da navegacao
- Usuario sem permissao recebe bloqueio na interface e na API
- Logs e mensagens nao exibem senha, token ou segredo

### Metricas

- Taxa de login bem-sucedido
- Falhas de autenticacao por perfil
- Sessoes expiradas e revogadas
- Tempo medio para autenticar

## Fase 28 - Testes automatizados de interface

### Objetivo

Cobrir as jornadas criticas nas interfaces Web e Mobile, complementando os
testes de dominio e API existentes.

### Entregas Web

- Configuracao de Playwright
- Login e logout
- Navegacao filtrada por permissao
- Compra e recebimento
- Consulta de estoque e registro de perda
- Producao
- Venda e fechamento de caixa
- Relatorios e auditoria
- Testes responsivos nos principais viewports
- Captura de screenshot, trace e video em falhas de CI

### Entregas Mobile

- Testes de componentes e hooks com React Native Testing Library
- Login e restauracao de sessao
- Registro de perda
- Inicio e finalizacao de producao
- Carrinho e venda simples
- Estados offline, erro de API e sessao expirada
- Smoke test Android em build de desenvolvimento

### Criterios de aceite

- Jornadas criticas Web executadas automaticamente no CI
- Fluxos transacionais Mobile cobertos em nivel de componente/integracao
- Falha gera evidencia suficiente para diagnostico
- Testes nao dependem de ordem ou dados residuais
- Flaky tests abaixo de 2% em 30 execucoes

### Gate

Nenhuma regressao critica pode seguir para staging hospedado ou piloto.

### Estado implementado

- Playwright executa autenticacao, sessao, permissoes e jornada operacional Web
- Viewports desktop e mobile cobrem acesso e navegacao responsiva
- Jest e React Native Testing Library cobrem login, venda, perda e producao Mobile
- CI publica screenshot, trace e video para diagnostico de falhas Web
- Coberturas de modo offline, sessao expirada Mobile e smoke em dispositivo
  permanecem como evolucao da suite antes do piloto

## Fase 29 - Staging hospedado e observabilidade

### Objetivo

Disponibilizar um ambiente semelhante a producao, acessivel com HTTPS e
monitorado continuamente.

### Entregas

- Infraestrutura hospedada para Web, API e PostgreSQL
- Dominio de staging e certificados HTTPS
- Segredos fora do repositorio
- Pipeline de deploy automatico para staging
- Migrations executadas como etapa controlada do deploy
- Health checks de aplicacao e banco
- Logs estruturados com identificador de requisicao
- Coleta centralizada de erros Web, Mobile e API
- Metricas de latencia, disponibilidade e taxa de erro
- Alertas para indisponibilidade, erro elevado e falha de banco
- Retencao e mascaramento de dados sensiveis nos logs
- Seed de staging idempotente e usuarios de teste controlados

### Criterios de aceite

- Todo acesso externo usa HTTPS
- Deploy de staging e reproduzivel pelo pipeline
- Segredos nao aparecem em codigo, build ou logs
- Alerta de indisponibilidade chega ao responsavel em ate 5 minutos
- Erros podem ser correlacionados entre cliente, API e usuario
- Ambiente suporta a suite E2E sem intervencao manual

### Metas iniciais

- Disponibilidade de staging superior a 99%
- API p95 inferior a 800 ms nos fluxos operacionais
- Taxa de erro HTTP 5xx inferior a 1%

### Estado implementado

- Imagens imutaveis para API e Web
- Compose hospedado com PostgreSQL interno e Caddy na borda HTTPS
- Pipeline de publicacao no GHCR, migrations controladas e deploy por SSH
- Health checks de processo, banco, Web e API
- Logs JSON correlacionados por `X-Request-Id`
- Erros Web e Mobile enviados para coleta centralizada autenticada
- Prometheus, Blackbox Exporter, Grafana, Loki, Vector e Alertmanager
- Dashboard e alertas provisionados como codigo
- Bootstrap idempotente da VPS com Docker, firewall e chave exclusiva
- Ativacao DNS manual ou automatizada para Cloudflare
- Configuracao automatizada de environment, variables e secrets no GitHub
- Orquestracao do primeiro deploy e verificacao de DNS, SSH, HTTPS e TLS

A automacao esta concluida. A execucao externa ainda depende do IP da VPS,
dominios, acesso SSH, token GHCR, autenticacao administrativa no GitHub e
webhook operacional. A fase so deve ser considerada operacionalmente aceita
apos o primeiro deploy HTTPS e o teste de entrega dos alertas.

## Fase 30 - Backup, restore e rollback

### Objetivo

Garantir que uma falha de deploy, banco ou operacao possa ser recuperada com
perda de dados e indisponibilidade conhecidas.

### Entregas

- Backup automatico e criptografado do PostgreSQL
- Politica de retencao diaria, semanal e mensal
- Copia em local diferente do banco principal
- Verificacao automatica de integridade dos backups
- Script e runbook de restore
- Restore ensaiado em ambiente isolado
- Estrategia de migrations compativeis com rollback
- Versionamento de artefatos Web e API
- Procedimento de rollback de aplicacao
- Checklist para incidentes e responsaveis definidos
- Backup manual antes de migrations destrutivas

### Criterios de aceite

- Restore completo comprovado a partir de backup automatico
- Dados restaurados passam health check e E2E
- Rollback para a versao anterior e executado em ensaio
- RPO e RTO medidos e registrados
- Nenhum deploy de producao ocorre sem versao anterior disponivel

### Metas iniciais

- RPO maximo de 24 horas no piloto, evoluindo para 1 hora
- RTO maximo de 4 horas no piloto, evoluindo para 1 hora

## Fase 31 - Validacao contabil e fiscal

### Objetivo

Confirmar que cadastros, calculos, documentos e relatorios atendem a operacao
real da padaria e as obrigacoes aplicaveis.

Esta fase exige participacao de contador e consultoria fiscal. O software nao
deve inferir sozinho regras tributarias.

### Descoberta

- Regime tributario e enquadramento da empresa
- Municipio e estado de operacao
- CNPJ, inscricoes e estabelecimentos
- Tipos de venda: balcao, encomenda, entrega e faturada
- Documentos fiscais exigidos por canal
- Regras de cancelamento, devolucao e contingencia
- Formas de pagamento e conciliacao
- Produtos sujeitos a tributacao distinta
- Integracoes necessarias com emissor, SEFAZ ou prefeitura

### Entregas

- Matriz fiscal por tipo de produto e operacao
- Campos fiscais no cadastro de produtos
- Regras de arredondamento documentadas
- Separacao entre regime de caixa e competencia nos relatorios
- Validacao de descontos, cancelamentos, estornos e devolucoes
- Relatorio de vendas, recebimentos, custos, perdas e impostos
- Exportacao para conferencia contabil
- Trilha de auditoria dos dados fiscais
- Integracao fiscal definida ou implementada conforme escopo aprovado
- Termo de aceite do contador para os cenarios validados

### Criterios de aceite

- Cem por cento dos produtos ativos possuem classificacao fiscal revisada
- Totais de venda e caixa conciliam com os documentos emitidos
- Arredondamentos possuem tolerancia formalmente definida
- Cancelamentos e devolucoes deixam rastreabilidade completa
- Relatorios de um periodo-piloto conciliam com a apuracao do contador
- Nenhuma emissao fiscal depende apenas de regra client-side

### Gate

Sem aceite contabil/fiscal, o piloto pode validar operacao interna, mas nao
deve substituir o sistema oficial de emissao ou escrituracao.

## Fase 32 - Piloto interno assistido

### Objetivo

Executar a operacao real em paralelo ao processo atual, medir divergencias e
decidir com evidencia se o sistema pode avancar para producao assistida.

### Preparacao

- Escolher unidade, turno e responsavel pelo piloto
- Treinar usuarios por papel
- Congelar escopo durante os dias de operacao
- Cadastrar produtos, saldos, fornecedores e clientes reais revisados
- Definir canal de suporte e responsavel tecnico
- Confirmar staging, backup, restore, alertas e rollback
- Criar checklist de abertura e fechamento diario
- Definir processo alternativo para indisponibilidade

### Execucao sugerida

1. Simulacao guiada com dados de staging
2. Meio turno em operacao paralela
3. Um dia completo em operacao paralela
4. Tres dias consecutivos com acompanhamento
5. Revisao dos resultados e decisao de avancar, corrigir ou interromper

### Dados a comparar

- Compras solicitadas e recebidas
- Saldo fisico e saldo do sistema
- Consumo previsto e real de producao
- Quantidade produzida e perdas
- Vendas por forma de pagamento
- Caixa esperado e contado
- Receita, custo, margem e resultado
- Eventos sem rastreabilidade ou autorizacao

### Metricas de sucesso

- Divergencia de estoque inferior a 2%
- Divergencia de caixa inferior a 0,5%
- Cem por cento das vendas do piloto registradas
- Cem por cento das acoes criticas auditadas
- Nenhuma perda de dados
- Nenhum bloqueio operacional critico sem alternativa
- Usuarios concluem os fluxos principais sem ajuda em pelo menos 90% das vezes
- Incidentes criticos resolvidos ou contornados dentro do RTO

### Criterios de aceite

- Checklist diario assinado pelo responsavel da operacao
- Divergencias explicadas e classificadas
- Backlog de problemas priorizado por severidade
- Contador valida o periodo quando houver impacto fiscal
- Restore e rollback continuam disponiveis
- Dono do negocio aprova formalmente a entrada em producao assistida

## Trilhas paralelas

Alguns trabalhos podem ocorrer simultaneamente:

| Trilha | Fases |
| --- | --- |
| Produto e seguranca | Sessoes Web/Mobile, permissoes e UX |
| Qualidade | Testes de interface e manutencao do E2E |
| Plataforma | Staging, observabilidade, backup e rollback |
| Negocio | Validacao contabil/fiscal e preparacao do piloto |

## Definition of Done por fase

Uma fase somente e concluida quando:

- codigo, configuracao e documentacao estao versionados;
- typecheck, lint, testes e build passam;
- criterios de aceite possuem evidencia;
- riscos e limitacoes restantes estao registrados;
- observabilidade cobre os novos fluxos;
- suporte e rollback foram atualizados quando aplicavel;
- a proxima fase nao depende de trabalho oculto.

## Cadencia Agile

### Planejamento semanal

- Selecionar itens pequenos e demonstraveis
- Definir responsavel e criterio de aceite
- Limitar trabalho simultaneo por trilha
- Reservar capacidade para correcoes do staging e piloto

### Revisao

- Demonstrar em staging
- Comparar metricas com a sprint anterior
- Registrar decisoes e riscos
- Atualizar este roadmap e o backlog

### Retrospectiva

- Identificar gargalos tecnicos e operacionais
- Rever tempo de recuperacao e qualidade dos alertas
- Ajustar treinamento, suporte e procedimentos

## Ordem de liberacao

```text
sessoes seguras
  -> testes de interface
  -> staging hospedado e observavel
  -> restore e rollback comprovados
  -> aceite contabil/fiscal
  -> piloto interno assistido
  -> producao assistida
```
