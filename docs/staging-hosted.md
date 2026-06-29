# Staging hospedado e observabilidade

## Arquitetura

O ambiente hospedado foi preparado para uma VPS Linux com Docker Compose:

```text
Internet
  -> Caddy (HTTPS automatico)
      -> Web Next.js
      -> API Node.js
      -> Grafana

API -> PostgreSQL
Prometheus -> API /metrics e probes HTTPS
Vector -> logs Docker -> Loki
Alertmanager -> webhook operacional
```

Somente as portas `80` e `443` ficam publicas. PostgreSQL, Prometheus, Loki e
Alertmanager permanecem em redes internas do Docker.

O Caddy faz terminacao TLS automatica, redireciona HTTP para HTTPS pelo
comportamento padrao do servidor e aplica `Strict-Transport-Security` nos
dominios Web, API e Grafana.

## Pre-requisitos

- VPS Linux com Docker Engine e Compose v2
- Usuario de deploy com acesso ao Docker
- DNS apontando os dominios Web, API e Grafana para a VPS
- Portas TCP `80` e `443` e UDP `443` liberadas
- Webhook HTTPS para receber alertas
- Pacotes GHCR acessiveis pelo usuario de deploy

## Configuracao

O contrato completo esta em `.env.hosted.example`. Senhas e tokens nao devem
ser versionados. A senha usada em `DATABASE_URL` deve estar codificada para URL.

Validar localmente a renderizacao:

```bash
cp .env.hosted.example .env.hosted
pnpm hosted:config
```

O comando gera arquivos sensiveis em `.runtime/staging`, ignorado pelo Git.

A preparacao e ativacao da VPS, DNS e GitHub esta automatizada em
[staging-activation.md](staging-activation.md).

## Pipeline

O workflow `.github/workflows/deploy-staging.yml`:

1. Executa typecheck, lint, testes e build
2. Publica imagens imutaveis da API e Web no GHCR
3. Envia um bundle de configuracao para a VPS por SSH
4. Executa migrations antes de ativar a nova versao
5. Sobe os servicos com Docker Compose
6. Valida `GET /health/ready` pelo dominio HTTPS
7. Testa login, sessao, dashboard e logout com usuario controlado

O deploy ocorre em push para `main` ou manualmente. O seed enriquecido so roda
quando a entrada `seed` for habilitada no disparo manual.

### Variables do ambiente GitHub `staging`

- `STAGING_API_URL`: por exemplo `https://api.staging.example.com`
- `STAGING_WEB_URL`: por exemplo `https://staging.example.com`

### Secrets do ambiente GitHub `staging`

- `STAGING_ENV_FILE`: conteudo integral do `.env.hosted`
- `STAGING_HOST`
- `STAGING_SSH_PORT`
- `STAGING_SSH_KNOWN_HOSTS`
- `STAGING_USER`
- `STAGING_DEPLOY_PATH`: por exemplo `/opt/paobom`
- `STAGING_SSH_PRIVATE_KEY`
- `STAGING_GHCR_USER`
- `STAGING_GHCR_TOKEN`: token somente com leitura de packages
- `STAGING_SMOKE_EMAIL`: usuario com acesso ao dashboard
- `STAGING_SMOKE_PASSWORD`

Proteja o ambiente `staging` com aprovacao obrigatoria quando o deploy nao
dever ocorrer automaticamente.

## Sinais operacionais

Endpoints da API:

- `/health/live`: processo ativo
- `/health/ready`: processo e PostgreSQL prontos
- `/health`: alias de prontidao
- `/metrics`: formato Prometheus, acessivel apenas pela rede interna no Caddy

Toda resposta inclui `X-Request-Id`. A API registra logs JSON sem corpo,
credenciais ou token, contendo rota, status, duracao e usuario quando
autenticado. Web e Mobile enviam erros globais autenticados para
`POST /observability/client-errors`.

O dashboard provisionado no Grafana mostra:

- disponibilidade HTTPS da Web e API
- latencia p95 da API
- requisicoes por segundo
- erros HTTP 5xx
- logs centralizados de todos os containers

## Alertas

O Alertmanager envia eventos resolvidos e ativos para `ALERT_WEBHOOK_URL`.

| Alerta | Condicao |
| --- | --- |
| Endpoint indisponivel | Probe HTTPS falha por 2 minutos |
| Banco indisponivel | Prontidao do PostgreSQL falha por 1 minuto |
| Taxa de erro elevada | HTTP 5xx acima de 1% por 5 minutos |
| Latencia elevada | p95 acima de 800 ms por 10 minutos |

Os logs ficam no Loki por 14 dias e as metricas no Prometheus por 30 dias.

## Validacao apos deploy

```bash
curl --fail https://api.staging.example.com/health/live
curl --fail https://api.staging.example.com/health/ready
curl --fail https://staging.example.com
```

No Grafana, confirme os datasources Prometheus e Loki e force um alerta de
teste interrompendo temporariamente um endpoint em janela controlada.

## Limites atuais

- O repositorio entrega a infraestrutura e o pipeline, mas VPS, DNS e secrets
  precisam ser fornecidos pelo responsavel pelo ambiente.
- Backup, restore e rollback automatizados pertencem a Fase 30.
- O acesso ao Grafana usa autenticacao local; SSO pode ser adicionado depois.
