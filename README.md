# PaoBom ERP

ERP web e mobile para gestao operacional e financeira de panificadoras.

O projeto esta em fase de preparacao para piloto interno. Os fluxos centrais
usam API real, PostgreSQL, autorizacao no backend, auditoria persistente e
testes E2E sobre banco isolado.

## Capacidades

- Cadastro de produtos, insumos, fornecedores e clientes
- CRM com registro de interacoes
- Compras com aprovacao, recebimento parcial, divergencias e contas a pagar
- Estoque com lotes, validade, custo medio, perdas e inventario fisico
- Receitas versionadas e ordens de producao
- Vendas com baixa de estoque, descontos, pagamentos e cancelamento
- Caixa com abertura, suprimento, sangria, conciliacao e fechamento
- Custos, margem, lucratividade e fluxo financeiro
- Relatorios por periodo e dashboard executivo
- Usuarios, papeis e permissoes validados pela API
- Login Web interativo com cookie de sessao `HttpOnly`
- Sessao Mobile persistida no armazenamento seguro nativo
- Auditoria persistente das operacoes
- Mobile transacional para estoque, producao e venda simples

## Stack

| Camada | Tecnologias |
| --- | --- |
| Monorepo | pnpm workspaces, Turborepo, TypeScript |
| Web | Next.js 16, React 19, React Query, Zustand, Tailwind CSS |
| Mobile | Expo 56, React Native, Expo Router, React Query, Zustand |
| Backend | Node.js, API HTTP, Prisma |
| Banco | PostgreSQL 16 |
| Qualidade | ESLint, TypeScript, `node:test`, E2E com banco real |
| Infra local | Docker Compose, GitHub Actions |

## Arquitetura

O projeto segue a arquitetura descrita em
[docs/arquitetura.md](docs/arquitetura.md), com separacao por responsabilidade:

```text
apps/
  api/       API HTTP e autorizacao backend
  web/       Aplicacao administrativa Next.js
  mobile/    Aplicacao operacional Expo

packages/
  database/  Schema Prisma, migrations e seeds
  domain/    Entidades, contratos, regras e casos de uso
  constants/
  hooks/
  types/
  ui/
  utils/
```

Dentro das aplicacoes:

- `core`: infraestrutura global, configuracao, providers e DI
- `features`: dominios funcionais isolados
- `shared`: componentes e utilitarios locais sem regra de negocio
- `packages`: codigo compartilhado entre aplicacoes

As interfaces consomem repositories por meio de casos de uso e React Query. As
regras criticas, permissoes e efeitos transacionais permanecem no dominio e no
backend.

## Requisitos

- Node.js 22 ou superior
- pnpm 10.29.3
- Docker com Docker Compose

Instale as dependencias:

```bash
corepack enable
pnpm install
```

## Inicio Rapido

Crie o arquivo local de ambiente:

```bash
cp .env.example .env
```

Prepare o PostgreSQL:

```bash
docker compose up -d postgres
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

Inicie API e Web em terminais separados:

```bash
pnpm dev-api
```

```bash
pnpm dev-web
```

Servicos locais:

| Servico | Endereco |
| --- | --- |
| Web | `http://localhost:3000` |
| API | `http://localhost:3333` |
| PostgreSQL | `localhost:5432` |
| Health check | `http://localhost:3333/health` |

O pgAdmin e opcional:

```bash
docker compose --profile tools up -d
```

Para encerrar a infraestrutura:

```bash
docker compose down
```

## Usuarios Locais

O seed base cria os seguintes usuarios para desenvolvimento. A senha inicial e
definida por `SEED_USER_PASSWORD` e vale `Paobom@123` no exemplo local:

| Perfil | E-mail |
| --- | --- |
| Proprietario | `dono@paobom.local` |
| Gerente | `gerente@paobom.local` |
| Caixa | `caixa@paobom.local` |

O seed de staging adiciona os perfis de producao, estoque, vendas e consulta.

## Mobile

Configure o ambiente do Expo:

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
pnpm dev-mobile
```

Enderecos usuais para `EXPO_PUBLIC_API_BASE_URL`:

| Ambiente | URL |
| --- | --- |
| Android Emulator | `http://10.0.2.2:3333` |
| iOS Simulator | `http://localhost:3333` |
| Dispositivo fisico | `http://IP_DA_MAQUINA:3333` |

O mobile permite:

- Autenticacao com papeis e permissoes reais
- Restauracao segura da sessao entre reinicios
- Consulta de saldo e registro de perdas
- Inicio e finalizacao de producao
- Venda simples em dinheiro, cartao ou Pix

Mais detalhes em [apps/mobile/README.md](apps/mobile/README.md).

## Staging Local

O staging executa PostgreSQL, API e Web isolados, com dados proximos da
operacao da padaria:

```bash
cp .env.staging.example .env.staging
pnpm staging:seed
pnpm staging:up
```

| Servico | Endereco |
| --- | --- |
| Web staging | `http://localhost:3001` |
| API staging | `http://localhost:3335` |
| PostgreSQL staging | `localhost:55432` |

Encerrar:

```bash
pnpm staging:down
```

Consulte [docs/staging.md](docs/staging.md) para usuarios, dados simulados e
uso com o mobile.

## Testes e Qualidade

Validacao completa do monorepo:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Testes de dominio:

```bash
pnpm --filter @paobom/domain test
```

Fluxo E2E completo com PostgreSQL efemero e API real:

```bash
pnpm test:e2e:local
```

O E2E valida:

```text
compra -> estoque -> producao -> venda -> caixa -> relatorio -> auditoria
```

O banco E2E e isolado, usa a porta `55434` e e removido automaticamente. O
runner recusa bancos cujo nome nao contenha `e2e` ou `test`.

Detalhes em [docs/e2e.md](docs/e2e.md).

Testes automatizados das interfaces:

```bash
pnpm test:ui:mobile
pnpm test:ui:web:local
pnpm test:ui
```

O Playwright cobre autenticacao, sessao, permissoes e a jornada operacional Web.
Os testes Mobile validam login, venda, perda de estoque e producao. Consulte
[docs/interface-tests.md](docs/interface-tests.md) para cobertura e diagnostico.

## Comandos Principais

| Comando | Finalidade |
| --- | --- |
| `pnpm dev` | Executar tarefas de desenvolvimento do monorepo |
| `pnpm dev-api` | Iniciar a API |
| `pnpm dev-web` | Iniciar a aplicacao Web |
| `pnpm dev-mobile` | Iniciar o Expo |
| `pnpm db:validate` | Validar o schema Prisma |
| `pnpm db:generate` | Gerar o Prisma Client |
| `pnpm db:deploy` | Aplicar migrations |
| `pnpm db:seed` | Recriar os dados locais |
| `pnpm db:studio` | Abrir o Prisma Studio |
| `pnpm staging:seed` | Preparar dados de staging |
| `pnpm staging:up` | Subir staging |
| `pnpm staging:down` | Encerrar staging |
| `pnpm hosted:render` | Renderizar configuracoes hospedadas |
| `pnpm hosted:config` | Validar o compose hospedado |
| `pnpm staging:activate` | Simular ativacao do staging |
| `pnpm staging:activate -- --apply` | Ativar VPS, DNS, GitHub e deploy |
| `pnpm staging:activation:verify` | Validar DNS, SSH e HTTPS |
| `pnpm test:e2e:local` | Executar o fluxo integrado completo |
| `pnpm test:ui:mobile` | Executar testes de interface Mobile |
| `pnpm test:ui:web:local` | Executar Playwright Web com banco isolado |
| `pnpm test:ui` | Executar as suites Mobile e Web |

## CI

O workflow em `.github/workflows/ci.yml` possui tres jobs:

1. `validate`: schema, typecheck, lint, testes e build
2. `e2e`: PostgreSQL dedicado e fluxo ERP completo
3. `ui`: Playwright Web com PostgreSQL dedicado e artefatos de falha

## Documentacao

| Documento | Conteudo |
| --- | --- |
| [Arquitetura](docs/arquitetura.md) | Camadas, dependencias e convencoes |
| [Banco persistente](docs/banco-persistente.md) | Prisma, migrations e modelo |
| [Backend/API](docs/api-real.md) | Endpoints, autenticacao e auditoria |
| [Staging](docs/staging.md) | Ambiente e dados simulados |
| [Staging hospedado](docs/staging-hosted.md) | HTTPS, deploy e observabilidade |
| [Ativacao do staging](docs/staging-activation.md) | VPS, DNS e secrets GitHub |
| [Testes E2E](docs/e2e.md) | Execucao e protecao do banco |
| [Testes de interface](docs/interface-tests.md) | Playwright Web e testes Mobile |
| [Roadmap para producao](docs/roadmap-producao.md) | Fases, gates e criterios para piloto |
| [Checkpoint mock](docs/v0.1.0-mock-mvp.md) | Registro historico da tag `v0.1.0-mock-mvp` |

## Prontidao Operacional

Ja implementado:

- Persistencia PostgreSQL e migrations
- API e repositories reais
- Autenticacao, autorizacao e auditoria
- Login interativo Web e sessao segura Mobile
- Staging local com seed operacional
- Infraestrutura de staging hospedado com HTTPS e observabilidade
- Automacao de ativacao da VPS, DNS e secrets do staging
- Testes de dominio e E2E do fluxo completo
- Testes automatizados de interface Web e Mobile
- Web administrativa e mobile transacional

Pontos pendentes antes da producao:

- Piloto interno assistido
- Execucao da ativacao com credenciais e dominios reais
- Backup, restore e plano de rollback automatizados
- Validacao contabil e fiscal para operacao real

## Roadmap Imediato

1. Executar a ativacao com credenciais e dominios reais
2. Backup, restore e rollback
3. Validacao contabil e fiscal
4. Piloto interno assistido

O detalhamento, as dependencias e os criterios de aceite estao em
[docs/roadmap-producao.md](docs/roadmap-producao.md).

## Historico

O primeiro MVP demonstravel em memoria foi congelado na tag
`v0.1.0-mock-mvp`. O estado atual substitui os repositories mock dos fluxos
principais por API e PostgreSQL reais.
