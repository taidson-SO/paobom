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

## Validacao do MVP Mock

Na estabilizacao da fase 12, estes comandos passam:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Observacao: `pnpm test` ainda executa placeholders. A fase seguinte de qualidade deve substituir esses scripts por testes reais de dominio e fluxos de integracao.

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
- Sem CI/CD
- Sem ambiente staging
- Sem backup, restore ou plano de rollback

## Checkpoint

Tag prevista para esta fase:

```bash
v0.1.0-mock-mvp
```

Objetivo da tag: congelar uma versao demonstravel do ERP PaoBom antes da entrada em DevOps minimo, testes reais, banco persistente e API.

## Proximas Fases

1. DevOps minimo
2. Testes reais de dominio
3. Banco de dados persistente
4. Backend/API real
5. Autenticacao e autorizacao real
6. Migracao dos repositories mock para API
7. Auditoria persistente
8. Estoque, compras, vendas e caixa robustos
9. Mobile transacional
10. Staging, E2E, piloto interno e producao assistida
