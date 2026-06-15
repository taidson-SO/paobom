# Banco persistente

Fase 15 - Banco de dados persistente

## Objetivo

Preparar a persistencia real do ERP PaoBom com PostgreSQL, Prisma, migration inicial e seed operacional. Esta fase cria a fundacao do banco, mas ainda nao substitui os repositories mock usados pela UI web/mobile.

## Pacote

O banco fica em `packages/database`, respeitando a arquitetura do monorepo:

- `prisma/schema.prisma`: modelo relacional do ERP
- `prisma/migrations`: migrations versionadas
- `prisma/seed.cjs`: dados iniciais da padaria
- `src/index.ts`: Prisma Client compartilhado

## Entidades modeladas

- Produtos/Insumos
- Fornecedores
- Clientes
- Interacoes de CRM
- Compras e itens de compra
- Saldos, lotes, validade, contagens fisicas e movimentacoes de estoque
- Receitas versionadas e ingredientes
- Ordens de producao e consumos
- Vendas e itens de venda
- Lancamentos de caixa
- Abertura/fechamento de caixa
- Usuarios e papeis
- Auditoria

## Comandos

Validar o schema:

```bash
pnpm db:validate
```

Gerar Prisma Client:

```bash
pnpm db:generate
```

Subir PostgreSQL local:

```bash
docker compose up -d postgres
```

Aplicar migrations:

```bash
pnpm db:deploy
```

Rodar migrations em modo desenvolvimento:

```bash
pnpm db:migrate
```

Popular dados iniciais:

```bash
pnpm db:seed
```

Abrir Prisma Studio:

```bash
pnpm db:studio
```

## Fluxo local recomendado

```bash
docker compose up -d postgres
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

Se a porta local `5432` ja estiver em uso:

```bash
POSTGRES_PORT=5433 docker compose up -d postgres
DATABASE_URL=postgresql://paobom:paobom@localhost:5433/paobom?schema=public pnpm db:deploy
DATABASE_URL=postgresql://paobom:paobom@localhost:5433/paobom?schema=public pnpm db:seed
```

## Variaveis

O banco usa `DATABASE_URL`. Em desenvolvimento, os scripts possuem fallback para:

```txt
postgresql://paobom:paobom@localhost:5432/paobom?schema=public
```

Para ambientes reais, defina `DATABASE_URL` explicitamente.

## Evolucao apos Fase 20

O banco ja possui persistencia para estoque real avancado:

- `inventory_lots`: rastreia lote, validade, fornecedor, compra de origem, custo e saldo do lote.
- `stock_movements.lotId`: conecta movimentos ao lote afetado quando aplicavel.
- `physical_inventory_counts`: registra contagem fisica, saldo esperado, saldo contado, divergencia, responsavel e justificativa.

A UI web consome esses dados via API. O mobile permanece em modo operacional/mock ate a fase mobile transacional.
