# Testes E2E

## Escopo

A Fase 26 valida o fluxo operacional completo usando API e PostgreSQL reais:

1. login do proprietario;
2. criacao, aprovacao e recebimento de compra;
3. entrada do insumo no estoque e atualizacao do custo medio;
4. criacao, inicio e finalizacao da producao;
5. consumo de insumos e entrada do produto acabado;
6. venda paga com baixa de estoque;
7. lancamento financeiro e fechamento do caixa;
8. consolidacao em relatorios;
9. rastreabilidade das acoes na auditoria.

## Execucao local

O comando abaixo inicia um PostgreSQL efemero na porta `55434`, prepara o
banco, inicia a API na porta `3337`, executa o teste e remove o ambiente:

```bash
pnpm test:e2e:local
```

Para controlar os servicos manualmente:

```bash
pnpm e2e:up
pnpm test:e2e
pnpm e2e:down
```

Nesse caso, configure:

```bash
export E2E_DATABASE_URL=postgresql://paobom_e2e:paobom_e2e@localhost:55434/paobom_e2e?schema=public
```

## Protecao de dados

O runner executa migrations e seed, que limpam as tabelas. Por isso ele recusa
qualquer banco cujo nome nao contenha `e2e` ou `test`.

Nunca aponte `E2E_DATABASE_URL` para staging ou producao.

## CI

O workflow `.github/workflows/ci.yml` possui um job separado com PostgreSQL
dedicado. O teste E2E nao faz parte de `pnpm test`, mantendo a suite unitaria
rapida e permitindo diagnostico independente do ambiente integrado.

## Relacao com `pnpm test`

`pnpm test` executa testes rapidos de dominio, mobile e API. A API cobre
permissoes, autenticacao, rate limit de login e mascaramento de auditoria sem
subir banco externo. O fluxo integrado com PostgreSQL real continua separado em
`pnpm test:e2e:local` para proteger dados e facilitar diagnostico.
