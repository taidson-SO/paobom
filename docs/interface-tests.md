# Testes automatizados de interface

Os testes de interface validam as jornadas criticas do ERP nas aplicacoes Web
e Mobile, complementando os testes de dominio e o E2E da API.

## Comandos

```bash
# Componentes e operacoes da aplicacao Mobile
pnpm test:ui:mobile

# Interface Web com PostgreSQL isolado via Docker
pnpm test:ui:web:local

# Executa Mobile e Web em sequencia
pnpm test:ui
```

Para executar somente o Playwright contra um PostgreSQL ja disponivel:

```bash
E2E_DATABASE_URL=postgresql://usuario:senha@localhost:5432/paobom_ui_test?schema=public \
  pnpm test:ui:web
```

O nome do banco deve conter `e2e` ou `test`. Antes da execucao, o runner aplica
as migrations, recria os dados de seed e inicia API e Web em portas dedicadas.
O runner define `PLAYWRIGHT_USER_PASSWORD` a partir de `SEED_USER_PASSWORD`
quando a variavel especifica nao for informada, evitando que os testes
autenticados sejam pulados em execucoes locais/CI controladas.

## Cobertura

Web:

- Login invalido, restauracao de sessao e logout
- Navegacao filtrada pelas permissoes do usuario
- Viewports desktop e mobile para autenticacao e navegacao
- Jornada desktop de compra, estoque, producao, venda, caixa, relatorios e auditoria

Mobile:

- Login valido e tratamento de credenciais invalidas
- Permissoes por perfil operacional
- Registro de venda simples
- Registro de perda de estoque
- Inicio de ordem de producao

## Diagnostico

O Playwright salva screenshot, trace e video quando um teste falha. No CI, os
arquivos de `playwright-report/` e `test-results/playwright/` sao publicados
como artefato por sete dias.
