# PaoBom ERP

ERP para gestao de panificadora, construido em monorepo com versoes web e mobile.

Este repositorio esta estabilizado como MVP demonstravel em modo mock/in-memory na tag `v0.1.0-mock-mvp`.

## Estado Atual

O MVP mock cobre os principais fluxos operacionais da padaria:

- Produtos e insumos
- Fornecedores
- Clientes e CRM
- Compras com custo
- Estoque rastreavel, perdas e ajustes
- Receitas versionadas
- Producao com status
- Vendas com estoque, desconto e cancelamento
- Caixa com abertura e fechamento
- Custos e lucratividade
- Relatorios por periodo
- Dashboard executivo
- Permissoes por perfil operacional
- Auditoria de eventos
- Mobile de acompanhamento operacional

## Arquitetura

O projeto segue a arquitetura definida em [docs/arquitetura.md](docs/arquitetura.md):

- `apps/web`: aplicacao Next.js
- `apps/mobile`: aplicacao Expo/React Native
- `packages/domain`: regras de dominio compartilhadas
- `packages/*`: pacotes compartilhados do monorepo
- `features/*`: isolamento por dominio funcional
- `core/*`: infraestrutura global, DI, providers, EventBus e configuracoes

As features usam DTOs, mappers, repositories, use cases, React Query e Zustand conforme o padrao adotado no projeto.

## Requisitos Locais

- Node.js compativel com o lockfile do projeto
- `pnpm` 10.29.3

Instalacao:

```bash
pnpm install
```

## Comandos

Executar validacoes:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Rodar web:

```bash
pnpm dev-web
```

Rodar API:

```bash
pnpm dev-api
```

Rodar mobile:

```bash
pnpm dev-mobile
```

Tambem e possivel usar filtros diretos:

```bash
pnpm --filter web dev
pnpm --filter mobile dev
pnpm --filter mobile typecheck
pnpm --filter mobile lint
```

## DevOps Local

A Fase 13 adiciona os artefatos minimos para preparar automacao e infraestrutura local:

- `.env.example`: contrato inicial de variaveis de ambiente
- `docker-compose.yml`: PostgreSQL local e pgAdmin opcional
- `.github/workflows/ci.yml`: pipeline com `typecheck`, `lint`, `test` e `build`

Subir somente PostgreSQL:

```bash
docker compose up -d postgres
```

Subir PostgreSQL com pgAdmin:

```bash
docker compose --profile tools up -d
```

Encerrar os servicos:

```bash
docker compose down
```

## Banco Persistente

A Fase 15 adiciona o pacote `@paobom/database` com PostgreSQL + Prisma, migration inicial e seed local. A documentacao detalhada fica em [docs/banco-persistente.md](docs/banco-persistente.md).

Validar schema e gerar client:

```bash
pnpm db:validate
pnpm db:generate
```

Aplicar migrations e popular dados locais:

```bash
docker compose up -d postgres
pnpm db:deploy
pnpm db:seed
```

## Backend/API Real

A Fase 16 adiciona `apps/api`, uma API HTTP real sobre PostgreSQL/Prisma. A Fase 17 adiciona autenticacao por sessao, usuarios, papeis e permissoes validadas no backend. A documentacao detalhada fica em [docs/api-real.md](docs/api-real.md).

Fluxo local basico:

```bash
docker compose up -d postgres
pnpm db:deploy
pnpm db:seed
pnpm db:generate
pnpm build
pnpm --filter api start
```

## Validacao do MVP Mock

Na estabilizacao da fase 12, estes comandos passam:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Observacao: `pnpm test` agora executa testes reais no pacote de dominio. Web e mobile ainda mantem placeholders e devem receber testes de UI/integracao nas proximas fases.

## Testes de Dominio

A Fase 14 substitui o placeholder do pacote `@paobom/domain` por testes reais com `node:test`, cobrindo:

- Produtos/Insumos
- Estoque rastreavel
- Compras com custo
- Receitas versionadas e producao
- Vendas com estoque, desconto e cancelamento
- Caixa, fluxo financeiro e lucratividade
- Permissoes
- Auditoria

Executar somente os testes de dominio:

```bash
pnpm --filter @paobom/domain test
```

## Perfis de Permissao Mock

A aplicacao web permite alternar entre perfis operacionais no cabecalho:

- Dono
- Gerente
- Caixa
- Producao
- Estoque
- Atendimento
- Consulta

As permissoes filtram navegacao, secoes e acoes sensiveis. Nesta versao, elas sao client-side e mockadas.

## Mobile

O mobile entrega uma visao operacional compacta:

- Resumo executivo
- Estoque
- Vendas
- Producao
- Caixa
- Auditoria

Nesta versao, o mobile e voltado para acompanhamento. Acoes transacionais mobile ficam para uma fase posterior.

## Limitacoes Conhecidas

Esta versao nao esta pronta para producao real. Ela e um MVP demonstravel com as seguintes limitacoes:

- Dados em memoria/mock
- Sem backend/API real
- Sem banco persistente
- Sem autenticacao real
- Permissoes sem validacao server-side
- Auditoria em memoria
- Sem testes reais automatizados
- Sem ambiente staging
- Sem backup, restore ou plano de rollback

## Checkpoint

Tag prevista para esta fase:

```bash
v0.1.0-mock-mvp
```

Objetivo da tag: congelar uma versao demonstravel do ERP PaoBom antes da entrada em DevOps minimo, testes reais, banco persistente e API.

## Proximas Fases

1. Testes reais de dominio
2. Banco de dados persistente
3. Backend/API real
4. Autenticacao e autorizacao real
5. Migracao dos repositories mock para API
6. Auditoria persistente
7. Estoque, compras, vendas e caixa robustos
8. Mobile transacional
9. Staging, E2E, piloto interno e producao assistida
