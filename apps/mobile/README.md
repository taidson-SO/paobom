# PaoBom Mobile

Aplicativo Expo para operacao transacional da padaria.

## Fluxos

- login e autorizacao por papel;
- consulta de estoque e registro de perdas;
- acompanhamento, inicio e finalizacao de producao;
- venda simples com carrinho e pagamento em dinheiro, cartao ou Pix;
- atualizacao dos dados via React Query apos cada operacao.

Todas as escritas usam a API do PaoBom. As regras de estoque, producao, venda,
permissoes e auditoria continuam validadas no backend.

## Configuracao

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

URLs usuais:

- Android Emulator: `http://10.0.2.2:3333`
- iOS Simulator: `http://localhost:3333`
- dispositivo fisico: `http://IP_DA_MAQUINA:3333`
- staging local: use a mesma regra, trocando a porta para `3335`

O dispositivo e a maquina da API devem estar na mesma rede quando for usado um
IP local.

## Execucao

Com banco, migrations, seed e API ativos:

```bash
pnpm dev-mobile
```

Os usuarios de desenvolvimento e staging sao documentados em
`docs/staging.md`.

## Validacao

```bash
pnpm --filter mobile typecheck
pnpm --filter mobile lint
```

A sessao e armazenada com `expo-secure-store`, restaurada na abertura e
revalidada pela API em `GET /auth/me`. Tokens expirados, revogados ou
rejeitados com `401` sao removidos automaticamente.
