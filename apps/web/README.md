# PaoBom Web

Aplicacao administrativa Next.js para operacao do ERP PaoBom.

## Escopo

- login interativo com cookie de sessao `HttpOnly`;
- navegacao por modulos filtrada pelas permissoes retornadas pela API;
- dashboard, relatorios e auditoria;
- cadastros de produtos, fornecedores e clientes;
- compras, estoque, producao, vendas e caixa;
- CRM com listagem e registro de interacoes.

As regras de autorizacao, validacao critica, efeitos transacionais e auditoria
ficam na API. A Web usa `ApiRepository`, React Query e stores locais apenas para
estado de interface e cache.

## Configuracao

No desenvolvimento local, use o `.env` da raiz:

```bash
cp .env.example .env
```

Variavel principal para a Web:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333
```

Para staging local, a API padrao fica em `http://localhost:3335`.

## Execucao

Com PostgreSQL, migrations, seed e API ativos:

```bash
pnpm dev-web
```

A aplicacao abre em `http://localhost:3000`.

## Validacao

```bash
pnpm --filter web typecheck
pnpm --filter web lint
```

Testes Playwright com banco isolado:

```bash
pnpm test:ui:web:local
```

O runner cria banco de teste, aplica migrations, executa seed, sobe API/Web em
portas dedicadas e define `PLAYWRIGHT_USER_PASSWORD` a partir da senha do seed
quando necessario.
