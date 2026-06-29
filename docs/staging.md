# Ambiente staging

## Objetivo

A Fase 25 cria um ambiente de teste com banco real, dados simulados da padaria PaoBom, usuarios por papel operacional e volume minimo para validar fluxos antes de piloto interno.

## Arquivos

- `.env.staging.example`: contrato de variaveis para staging.
- `docker-compose.staging.yml`: PostgreSQL, API, Web, seed one-shot e pgAdmin opcional.
- `packages/database/prisma/seed-staging.cjs`: seed enriquecido com dados proximos da operacao real.

## Como subir

Copiar o arquivo de ambiente:

```bash
cp .env.staging.example .env.staging
```

Definir uma senha controlada para os usuarios simulados:

```bash
$EDITOR .env.staging
```

Atualize `STAGING_SEED_USER_PASSWORD` antes de executar o seed. O seed de
staging recusa a senha local padrao `Paobom@123`; use
`ALLOW_DEFAULT_SEED_PASSWORD=true` apenas em ambientes descartaveis.

Garantir dependencias locais instaladas:

```bash
pnpm install
```

Preparar banco com migrations e dados simulados:

```bash
pnpm staging:seed
```

Subir API e Web:

```bash
pnpm staging:up
```

URLs padrao:

- Web: `http://localhost:3001`
- API: `http://localhost:3335`
- PostgreSQL: `localhost:55432`
- pgAdmin opcional: `docker compose --env-file .env.staging -f docker-compose.staging.yml --profile tools up -d pgadmin`

Para usar o mobile com staging, configure `apps/mobile/.env.local`:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3335
```

Em dispositivo fisico, substitua `10.0.2.2` pelo IP da maquina que executa o
Docker.

Encerrar:

```bash
pnpm staging:down
```

## Usuarios simulados

Todos usam a senha definida em `STAGING_SEED_USER_PASSWORD`. Essa variavel e
obrigatoria para `pnpm staging:seed`.

| Email | Papel |
| --- | --- |
| `dono@paobom.local` | owner |
| `gerente@paobom.local` | manager |
| `caixa@paobom.local` | cashier |
| `padeiro@paobom.local` | baker |
| `estoque@paobom.local` | stock |
| `vendas@paobom.local` | sales |
| `consulta@paobom.local` | viewer |

## Dados simulados

O seed staging executa o seed base e adiciona:

- fornecedores de laticinios e embalagens;
- clientes recorrentes B2B;
- produtos de confeitaria e insumos frios;
- estoque abaixo do minimo para testar alertas;
- compra parcialmente recebida com contas a pagar;
- producao finalizada e ordem planejada de bolo para operacao mobile;
- venda por cartao, venda em dinheiro e venda a prazo;
- caixa aberto, caixa fechado anterior, conciliacoes e divergencia pequena;
- perda de estoque e contagem fisica com justificativa;
- log de auditoria do carregamento staging.

## Validacao rapida

```bash
curl http://localhost:3335/health
```

Login:

```bash
set -a
. ./.env.staging
set +a
curl -s -X POST http://localhost:3335/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"dono@paobom.local\",\"password\":\"${STAGING_SEED_USER_PASSWORD}\"}"
```

Fluxos que devem aparecer com dados reais:

- Dashboard executivo com alertas de caixa projetado, estoque e margem.
- Relatorios por periodo com exportacao CSV/JSON.
- Compras com recebimento parcial.
- Estoque rastreavel com lote, validade, perda e inventario fisico.
- Vendas por forma de pagamento e venda a prazo pendente.
- Caixa com abertura, fechamento, suprimento, conciliacao e divergencias.
- Auditoria com login, seed e eventos da API.
- Mobile registrando perda, avancando producao e concluindo venda simples.

## Observacoes

Este compose continua sendo a opcao local/assistida. A infraestrutura para VPS,
HTTPS, deploy e observabilidade esta em
[staging-hosted.md](staging-hosted.md). Backup, restore e rollback automatizados
continuam reservados para a fase seguinte.
