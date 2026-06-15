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
- `AUTH_TOKEN_SECRET`: segredo usado para assinar/hash de tokens de sessao.
- `SESSION_TTL_HOURS`: duracao das sessoes. Padrao: `12`.
- `SEED_USER_PASSWORD`: senha usada nos usuarios iniciais do seed. Padrao: `Paobom@123`.

## Endpoints principais

Saude:

- `GET /health`

Autenticacao:

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

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
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`

## Efeitos transacionais iniciais

- Receber compra gera movimentacoes `purchase_in` e atualiza saldos.
- Iniciar producao consome insumos e gera movimentacoes `production_out`.
- Finalizar producao gera entrada `production_in` do produto acabado.
- Criar venda baixa estoque com `sale_out` e cria lancamento financeiro.
- Cancelar venda gera reversao de estoque e cancela lancamentos financeiros vinculados.
- Fechar caixa calcula valor esperado a partir dos lancamentos baixados desde a abertura.

## Autenticacao e autorizacao

Todas as rotas, exceto `GET /health` e `POST /auth/login`, exigem header:

```txt
Authorization: Bearer <token>
```

O login retorna o token, os dados do usuario e as permissoes derivadas do papel operacional.

Usuarios iniciais do seed:

- `dono@paobom.local`
- `gerente@paobom.local`
- `caixa@paobom.local`

Senha padrao local:

```txt
Paobom@123
```

Em ambientes reais, troque `SEED_USER_PASSWORD` e `AUTH_TOKEN_SECRET`.

## Auditoria persistente

A Fase 19 registra auditoria no banco para rotas mutaveis da API:

- `POST`, `PATCH` e `DELETE` operacionais gravam logs automaticamente.
- Falhas de autorizacao, validacao e execucao tambem sao registradas quando ha contexto suficiente.
- Login bem-sucedido, logout e falha de login sao auditados.
- Metadados sensiveis como `password`, `token`, `authorization` e `secret` sao mascarados.
- Logs incluem usuario, papel, entidade, acao, resultado, data/hora, entidade afetada e metadados da request.

Consultar auditoria:

```bash
curl http://localhost:3333/audit-logs \
  -H "Authorization: Bearer <token>"
```

## Limites desta fase

- A API nao substitui os repositories mock da UI nesta fase.
- Validacoes de entrada sao basicas e devem evoluir para schemas compartilhados.
- Testes automatizados da API ficam para uma fase posterior.
