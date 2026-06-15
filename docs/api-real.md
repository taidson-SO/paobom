# Backend/API real

Fase 16 - Backend/API real

## Objetivo

Adicionar uma API HTTP real para operar sobre o PostgreSQL criado na Fase 15. A API fica em `apps/api` e usa Prisma Client diretamente sobre o banco persistente.

Esta fase cria o backend transacional inicial. A UI web/mobile ainda continua usando repositories mock; a troca para `ApiRepository` fica para a fase de migracao dos repositories.

## Aplicacao

```txt
apps/api/
├── src/server.ts
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

## Comandos

Validar e compilar:

```bash
pnpm typecheck
pnpm build
```

Rodar API compilada:

```bash
pnpm --filter api build
pnpm --filter api start
```

Rodar em modo desenvolvimento:

```bash
pnpm dev-api
```

## Banco local

Fluxo recomendado:

```bash
docker compose up -d postgres
pnpm db:deploy
pnpm db:seed
pnpm db:generate
pnpm --filter api build
pnpm --filter api start
```

Se a porta `5432` estiver ocupada:

```bash
POSTGRES_PORT=5433 docker compose up -d postgres
DATABASE_URL=postgresql://paobom:paobom@localhost:5433/paobom?schema=public pnpm db:deploy
DATABASE_URL=postgresql://paobom:paobom@localhost:5433/paobom?schema=public pnpm db:seed
DATABASE_URL=postgresql://paobom:paobom@localhost:5433/paobom?schema=public pnpm --filter api start
```

## Variaveis

- `DATABASE_URL`: conexao PostgreSQL.
- `API_PORT` ou `PORT`: porta HTTP da API. Padrao: `3333`.
- `CORS_ORIGIN`: origem permitida para browser. Padrao: `*`.

## Endpoints principais

Saude:

- `GET /health`

Cadastros:

- `GET /products`
- `POST /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `GET /suppliers`
- `POST /suppliers`
- `PATCH /suppliers/:id`
- `DELETE /suppliers/:id`
- `GET /customers`
- `POST /customers`
- `POST /customers/:id/interactions`
- `PATCH /customers/:id`
- `DELETE /customers/:id`

Compras e estoque:

- `GET /purchases`
- `POST /purchases`
- `POST /purchases/:id/receive`
- `POST /purchases/:id/cancel`
- `GET /inventory/balances`
- `GET /inventory/movements`
- `POST /inventory/movements`

Producao:

- `GET /production/recipes`
- `POST /production/recipes`
- `GET /production/orders`
- `POST /production/orders`
- `POST /production/orders/:id/start`
- `POST /production/orders/:id/finish`
- `POST /production/orders/:id/cancel`

Vendas e caixa:

- `GET /sales`
- `POST /sales`
- `POST /sales/:id/pay`
- `POST /sales/:id/cancel`
- `GET /cash/entries`
- `POST /cash/entries`
- `POST /cash/entries/:id/settle`
- `POST /cash/entries/:id/cancel`
- `GET /cash/registers`
- `POST /cash/registers/open`
- `POST /cash/registers/:id/close`

Gestao:

- `GET /reports`
- `GET /dashboard`
- `GET /audit-logs`
- `POST /audit-logs`
- `GET /users`

## Efeitos transacionais iniciais

- Receber compra gera movimentacoes `purchase_in` e atualiza saldos.
- Iniciar producao consome insumos e gera movimentacoes `production_out`.
- Finalizar producao gera entrada `production_in` do produto acabado.
- Criar venda baixa estoque com `sale_out` e cria lancamento financeiro.
- Cancelar venda gera reversao de estoque e cancela lancamentos financeiros vinculados.
- Fechar caixa calcula valor esperado a partir dos lancamentos baixados desde a abertura.

## Limites desta fase

- Ainda nao ha autenticacao real.
- Ainda nao ha autorizacao server-side.
- A API nao substitui os repositories mock da UI nesta fase.
- Validacoes de entrada sao basicas e devem evoluir para schemas compartilhados.
- Testes automatizados da API ficam para uma fase posterior.
