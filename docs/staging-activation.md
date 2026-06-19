# Ativacao da VPS, DNS e secrets do staging

## Objetivo

Ativar a infraestrutura definida em `docker-compose.hosted.yml` sem armazenar
credenciais no repositorio. O processo prepara uma VPS Ubuntu/Debian, configura
DNS, cria o ambiente `staging` no GitHub, dispara o deploy e valida HTTPS.

## O que e automatizado

- Geracao idempotente das senhas de PostgreSQL, Grafana, seed e sessao
- Geracao de chave SSH exclusiva para o pipeline
- Instalacao oficial do Docker Engine e Compose plugin
- Usuario de deploy, firewall, fail2ban e endurecimento SSH
- DNS manual ou upsert pela API Cloudflare
- Environment variables e secrets do GitHub Actions
- Deploy inicial com migrations e seed controlado
- Validacao de DNS, SSH, health checks e certificados TLS

Os arquivos sensiveis ficam em `.runtime/staging-activation`, com acesso local
restrito, e nunca devem ser enviados para Git.

## Pre-requisitos externos

- VPS nova com Ubuntu ou Debian e acesso root ou sudo sem senha
- IPv4 publico fixo
- Tres nomes DNS para Web, API e Grafana
- Portas TCP `22`, `80`, `443` e UDP `443` liberadas no firewall do provedor
- GitHub CLI autenticado com administracao do repositorio
- Token GHCR com permissao `read:packages`
- Webhook HTTPS para receber alertas

O bootstrap segue o repositorio APT oficial do Docker e instala
`docker-compose-plugin`. Consulte a
[documentacao oficial](https://docs.docker.com/engine/install/ubuntu/).

## Configuracao

```bash
cp .env.activation.example .env.activation
```

Preencha:

- IP e usuario inicial da VPS
- fingerprint SSH exibido pelo provedor, quando disponivel
- dominios de staging
- repositorio GitHub no formato `owner/repo`
- usuario e token GHCR
- webhook de alertas
- provedor DNS

Para Cloudflare, use um API Token restrito a `DNS Read` e `DNS Write` na zona:

```dotenv
DNS_PROVIDER=cloudflare
CLOUDFLARE_ZONE_ID=zone-id
CLOUDFLARE_API_TOKEN=token-restrito
DNS_PROXIED=false
```

Para outro provedor:

```dotenv
DNS_PROVIDER=manual
```

Crie tres registros `A` apontando para `STAGING_HOST` antes da ativacao:

- `STAGING_WEB_DOMAIN`
- `STAGING_API_DOMAIN`
- `STAGING_GRAFANA_DOMAIN`

## Simulacao

```bash
pnpm staging:activate
```

Esse comando exibe as etapas sem alterar VPS, DNS ou GitHub.

Preparar apenas os segredos e a chave de deploy:

```bash
pnpm staging:activation:prepare
```

A preparacao pode ser repetida sem rotacionar os segredos existentes.

## Ativacao completa

Mantenha uma segunda sessao SSH aberta durante o primeiro bootstrap. O processo
desabilita login por senha depois de instalar e validar a chave de deploy.

```bash
pnpm staging:activate -- --apply
```

Ordem executada:

1. Prepara segredos e chave SSH
2. Instala e endurece a VPS
3. Configura ou valida DNS
4. Cria o environment `staging` e seus secrets no GitHub
5. Confirma acesso SSH do usuario de deploy
6. Dispara `.github/workflows/deploy-staging.yml` com seed
7. Aguarda o workflow
8. Valida DNS, HTTPS e certificados

## Execucao por etapa

```bash
pnpm staging:activation:prepare
pnpm staging:activation:bootstrap
pnpm staging:activation:dns -- --apply
pnpm staging:activation:github
pnpm staging:activation:verify -- --phase preflight
```

Depois do deploy:

```bash
pnpm staging:activation:verify -- --phase post-deploy
```

## GitHub

O configurador usa `gh secret set --env` e `gh variable set --env`, conforme a
documentacao oficial do
[GitHub CLI](https://cli.github.com/manual/gh_secret_set).

A chave publica SSH da VPS e armazenada em `STAGING_SSH_KNOWN_HOSTS`. Quando
`VPS_SSH_HOST_FINGERPRINT` e informado, a ativacao compara o fingerprint antes
de confiar no host.

Secrets criados:

- `STAGING_ENV_FILE`
- `STAGING_HOST`
- `STAGING_SSH_PORT`
- `STAGING_SSH_KNOWN_HOSTS`
- `STAGING_USER`
- `STAGING_DEPLOY_PATH`
- `STAGING_SSH_PRIVATE_KEY`
- `STAGING_GHCR_USER`
- `STAGING_GHCR_TOKEN`
- `STAGING_SMOKE_EMAIL`
- `STAGING_SMOKE_PASSWORD`

Variables criadas:

- `STAGING_API_URL`
- `STAGING_WEB_URL`

Configure revisores obrigatorios e limite de branch na pagina do environment
quando o plano GitHub disponibilizar essas regras. Environments bloqueiam o
acesso aos secrets ate que suas regras de protecao sejam satisfeitas:
[GitHub environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

## Evidencias de aceite

- `docker version` e `docker compose version` funcionam com o usuario de deploy
- DNS dos tres dominios esta propagado
- Workflow de deploy conclui com sucesso
- Web, API e Grafana respondem por HTTPS
- `/health/ready` confirma PostgreSQL
- Certificados possuem pelo menos 14 dias de validade restante
- Smoke confirma login, dashboard e logout
- Nenhuma porta do PostgreSQL ou da observabilidade esta publica

## Limites

A ativacao real nao pode ocorrer sem IP, dominio, acesso SSH, token GHCR,
webhook e autenticacao administrativa no GitHub. O modo de simulacao permite
validar o plano antes de fornecer esses dados.
