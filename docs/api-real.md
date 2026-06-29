# Backend/API real

Fase 16 - Backend/API real

## Objetivo

Adicionar uma API HTTP real para operar sobre o PostgreSQL criado na Fase 15. A API fica em `apps/api` e usa Prisma Client diretamente sobre o banco persistente.

A aplicacao web usa `ApiRepository` por padrao e conversa com esta API mantendo
os use cases e os componentes atuais. O mobile tambem autentica contra a API e
executa os fluxos operacionais de estoque, producao e venda simples por
repositories HTTP.

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
- `CORS_ORIGIN`: origem permitida para browser. Padrao: `http://localhost:3000`.
- `AUTH_TOKEN_SECRET`: segredo usado para assinar/hash de tokens de sessao.
- `SESSION_TTL_HOURS`: duracao das sessoes. Padrao: `12`.
- `SESSION_MAX_ACTIVE`: limite de sessoes validas por usuario. Padrao: `5`.
- `SESSION_COOKIE_SECURE`: exige HTTPS para o cookie Web. Use `true` em producao.
- `LOGIN_RATE_LIMIT_WINDOW_MS`: janela do rate limit do `POST /auth/login`. Padrao: `900000` (15 minutos).
- `LOGIN_RATE_LIMIT_MAX_ATTEMPTS`: tentativas maximas de login por IP e email na janela. Padrao: `10`.
- `SEED_USER_PASSWORD`: senha usada nos usuarios iniciais do seed local. Padrao local: `Paobom@123`.
- `STAGING_SEED_USER_PASSWORD`: senha obrigatoria para o seed de staging via `pnpm staging:seed`; nao use a senha local padrao em ambiente compartilhado.
- `NEXT_PUBLIC_API_BASE_URL`: URL da API usada pela web. Padrao local: `http://localhost:3333`.

## Sessoes Web e Mobile

- A Web autentica interativamente e usa cookie `HttpOnly` com `SameSite=Lax`.
- O token nao fica acessivel ao JavaScript da Web.
- O Mobile usa bearer token guardado pelo `expo-secure-store`.
- Ambos validam a sessao restaurada em `GET /auth/me`.
- Logout revoga a sessao no banco.
- Respostas `401` limpam o estado local e exigem nova autenticacao.
- Novo login revoga sessoes expiradas e as mais antigas acima do limite.
- `POST /auth/login` aplica rate limit por IP e email e retorna `429` com
  `Retry-After` quando o limite e excedido.

## Repositories HTTP

A Fase 18 substitui os repositories mock da web por adaptadores HTTP em `apps/web/core/infrastructure/api/api-repositories.ts`.

Os adaptadores preservam os contratos dos repositories do dominio, portanto React Query, Zustand, componentes e use cases continuam na mesma estrutura arquitetural. As operacoes transacionais que a API ja executa de ponta a ponta usam gateways no-op na web para evitar duplicidade de efeitos, como baixa de estoque e lancamentos financeiros em compras, vendas e producao.

Limitacao conhecida: interacoes de CRM ainda usam um modelo reduzido na API persistente. A web lista e registra interacoes via API, mas concluir/cancelar interacao precisa de ampliacao de schema/endpoints em uma fase posterior.

O mobile usa `ApiAuthRepository` e `ApiMobileOperationsRepository` para login,
visao operacional, perdas de estoque, avancos de producao e venda simples.

## Endpoints principais

Saude:

- `GET /health`
- `GET /health/live`
- `GET /health/ready`

Observabilidade:

- `GET /metrics`
- `POST /observability/client-errors`

As respostas incluem `X-Request-Id`. No staging hospedado, `/metrics` fica
restrito a rede interna pelo Caddy.

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
- `GET /purchases/payables`
- `POST /purchases/:id/approve`
- `POST /purchases/:id/receive`
- `POST /purchases/:id/cancel`
- `GET /inventory/balances`
- `GET /inventory/lots`
- `GET /inventory/movements`
- `GET /inventory/counts`
- `POST /inventory/counts`
- `POST /inventory/losses`
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
- `GET /cash/registers/movements`
- `GET /cash/registers/reconciliations`
- `GET /cash/registers`
- `POST /cash/registers/open`
- `POST /cash/registers/:id/movements`
- `POST /cash/registers/:id/reconcile`
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

As rotas de saude, metricas e `POST /auth/login` sao publicas. As demais exigem
sessao; erros de cliente so sao aceitos de usuario autenticado.

```txt
Authorization: Bearer <token>
```

O login retorna o token, os dados do usuario e as permissoes derivadas do papel operacional.

Usuarios iniciais do seed:

- `dono@paobom.local`
- `gerente@paobom.local`
- `caixa@paobom.local`

Senha padrao local, apenas para desenvolvimento/teste:

```txt
Paobom@123
```

Em staging, defina `STAGING_SEED_USER_PASSWORD` antes de rodar `pnpm staging:seed`.
Em ambientes reais, troque `SEED_USER_PASSWORD` e `AUTH_TOKEN_SECRET`.
O seed base aborta com `NODE_ENV=production`; `ALLOW_PRODUCTION_SEED=true` existe
apenas para ambientes controlados e descartaveis.

## Auditoria persistente

A Fase 19 registra auditoria no banco para rotas mutaveis da API:

- `POST`, `PATCH` e `DELETE` operacionais gravam logs automaticamente.
- Falhas de autorizacao, validacao e execucao tambem sao registradas quando ha contexto suficiente.
- Login bem-sucedido, logout e falha de login sao auditados.
- Metadados sensiveis com padroes como `password`, `token`, `authorization`, `secret`, `hash`, `key`, `credential`, `creditCard`, `cardNumber` e `cvv` sao mascarados.
- Logs incluem usuario, papel, entidade, acao, resultado, data/hora, entidade afetada e metadados da request.

Consultar auditoria:

```bash
curl http://localhost:3333/audit-logs \
  -H "Authorization: Bearer <token>"
```

## Limites desta fase

- A API valida campos obrigatorios, enums, limites de tamanho, campos extras e numeros positivos/nao negativos nos fluxos principais. Ainda vale evoluir para schemas compartilhados quando houver uma biblioteca comum entre API e clientes.
- `pnpm --filter api test` cobre permissoes, autenticacao, rate limit e mascaramento de auditoria. Os fluxos completos com PostgreSQL continuam em `pnpm test:e2e`.
