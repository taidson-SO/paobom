# Manual do Usuario - PaoBom ERP

Este manual orienta o uso operacional do PaoBom ERP na rotina de uma
panificadora. Ele cobre o acesso web administrativo, os principais modulos do
sistema, o fluxo diario recomendado e o aplicativo mobile operacional.

## 1. Visao geral

O PaoBom ERP organiza a operacao em quatro grupos:

- **Gestao**: Dashboard, Relatorios e Auditoria.
- **Operacao**: Compras, Producao e Estoque.
- **Atendimento**: Vendas, Caixa e CRM.
- **Cadastros**: Produtos, Fornecedores e Clientes.

A sequencia operacional sugerida pelo sistema e:

1. Compra
2. Estoque
3. Receita
4. Producao
5. Venda
6. Caixa

Nem todos os usuarios veem todos os modulos. A tela exibe apenas as areas
permitidas para o perfil logado.

## 2. Acesso ao sistema

### Entrar

1. Acesse a aplicacao web no endereco informado pela administracao.
2. Na tela **Acesso operacional**, informe e-mail e senha.
3. Clique em **Entrar**.
4. Depois do login, confira seu nome, perfil e e-mail no topo da tela.

### Sair

1. Clique em **Sair**, no canto superior direito.
2. O sistema encerra a sessao e volta para a tela de login.

### Perfis de usuario

O sistema trabalha com perfis e permissoes. Em ambiente local de
desenvolvimento, os usuarios iniciais mais comuns sao:

| Perfil | E-mail |
| --- | --- |
| Proprietario | `dono@paobom.local` |
| Gerente | `gerente@paobom.local` |
| Caixa | `caixa@paobom.local` |

Perfis adicionais podem existir para producao, estoque, vendas e consulta,
dependendo do ambiente.

## 3. Navegacao

A tela principal possui:

- Cabecalho com identificacao da Panificadora PaoBom, usuario logado e botao
  de saida.
- Menu lateral com os modulos disponiveis para o perfil.
- Area central com o conteudo do modulo selecionado.

Para abrir um modulo, clique no nome dele no menu lateral. O endereco da pagina
tambem muda com o identificador do modulo, por exemplo `#estoque` ou
`#vendas`, permitindo voltar diretamente a uma area especifica.

## 4. Fluxo diario recomendado

### Inicio do dia

1. Entre no sistema.
2. Acesse **Caixa** e abra o caixa com o valor inicial, quando aplicavel.
3. Acesse **Dashboard** para verificar alertas, estoque baixo, compras abertas,
   producoes pendentes e caixa projetado.
4. Acesse **Estoque** para conferir produtos abaixo do minimo e lotes proximos
   do vencimento.

### Durante a operacao

1. Registre compras em **Compras**.
2. Receba compras aprovadas para atualizar estoque.
3. Registre perdas ou ajustes em **Estoque** quando houver quebra,
   vencimento, contagem incorreta ou ajuste operacional.
4. Planeje, inicie e finalize ordens em **Producao**.
5. Registre vendas em **Vendas**.
6. Registre suprimentos, sangrias, entradas e saidas financeiras em **Caixa**.

### Fechamento do dia

1. Confira vendas pagas, vendas abertas e cancelamentos.
2. Baixe ou cancele lancamentos financeiros pendentes, quando necessario.
3. Faca conciliacao do caixa por forma de pagamento.
4. Feche o caixa informando valor contado, responsavel e justificativa se
   houver diferenca.
5. Consulte **Relatorios** e **Auditoria** para validar o periodo.

## 5. Cadastros

### Produtos

Use **Produtos** para cadastrar os itens usados ou vendidos pela padaria.

Campos principais:

- Nome
- SKU
- Categoria
- Tipo: Insumo, Produto fabricado, Revenda ou Embalagem
- Unidade: Unidade, Kg, Grama, Mililitro, Litro ou Pacote
- Preco de compra
- Preco de venda
- Estoque minimo

Acoes disponiveis:

- **Criar**: cadastra um novo produto.
- **Salvar**: atualiza um produto selecionado para edicao.
- **Limpar**: cancela a edicao em andamento.
- **Editar**: carrega o produto no formulario.
- **Inativar**: remove o produto da operacao sem apagar o historico.

Observacoes:

- Insumos e embalagens sao usados em compras e receitas.
- Produtos fabricados podem ser usados como saida de producao.
- Produtos fabricados e de revenda podem ser vendidos.

### Fornecedores

Use **Fornecedores** para manter os parceiros de compra.

Campos principais:

- Nome
- Documento
- Contato
- Telefone
- E-mail

Acoes disponiveis:

- Criar fornecedor.
- Editar fornecedor.
- Inativar fornecedor.

Fornecedores ativos aparecem no modulo **Compras**.

### Clientes

Use **Clientes** para registrar compradores identificados, encomendas e
relacionamentos comerciais.

Campos principais:

- Nome
- Documento
- Telefone
- E-mail
- Observacoes

Acoes disponiveis:

- Criar cliente.
- Editar cliente.
- Inativar cliente.

Clientes ativos aparecem em **Vendas** e **CRM**.

## 6. Compras

Use **Compras** para criar pedidos, aprovar, receber mercadorias e controlar
divergencias.

### Criar compra

1. Selecione o fornecedor.
2. Informe a data de previsao.
3. Adicione um ou mais itens.
4. Para cada item, selecione o produto, quantidade e custo unitario.
5. Preencha observacoes, se necessario.
6. Confira o total.
7. Clique em **Criar compra**.

### Aprovar compra

Compras criadas podem ficar com status **Aguardando aprovacao**.

1. Localize a compra na tabela.
2. Clique em **Aprovar**.
3. O sistema registra o responsavel da aprovacao.

### Receber compra

1. Localize uma compra com status **Aprovada**, **Pedido** ou **Parcial**.
2. Confira cada item.
3. Informe a quantidade recebida de cada produto.
4. Preencha o responsavel pelo recebimento.
5. Se houver diferenca entre pedido e recebimento, informe a justificativa.
6. Clique em **Receber**.

Ao receber a compra, o sistema atualiza o estoque e registra a movimentacao de
entrada.

### Cancelar ou estornar

- Use **Cancelar** para compras ainda nao recebidas.
- Use **Estornar** para compras recebidas quando for necessario reverter a
  entrada de estoque e o compromisso financeiro.

## 7. Estoque

Use **Estoque** para acompanhar saldos, lotes, perdas, ajustes, movimentos e
inventario fisico.

Indicadores do modulo:

- Valor estimado do estoque.
- Quantidade de produtos abaixo do minimo.
- Lotes a vencer em ate 7 dias.
- Divergencias de inventario.

### Registrar perda

1. Selecione **Perda**.
2. Escolha o produto.
3. Informe a quantidade.
4. Informe o motivo.
5. Clique em **Registrar**.

Use perda para quebra, vencimento, descarte, avaria ou consumo indevido.

### Registrar ajuste

1. Selecione **Ajuste**.
2. Escolha o produto.
3. Informe a quantidade.
4. Informe o motivo.
5. Clique em **Registrar**.

Use ajuste para corrigir saldos de abertura, divergencias operacionais ou
correcoes autorizadas.

### Inventario fisico

1. Escolha o produto.
2. Informe a quantidade contada.
3. Informe o responsavel.
4. Informe uma justificativa se houver divergencia.
5. Clique em **Registrar contagem**.

O sistema compara a quantidade contada com a esperada e guarda a divergencia.

### Consultas de estoque

O modulo mostra:

- Lotes, quantidade, validade e origem.
- Saldos por produto, tipo, estoque minimo e valor estimado.
- Movimentos por tipo, origem, lote e data.
- Contagens fisicas e divergencias.

Clique em um produto na tabela de saldos para filtrar lotes, movimentos e
contagens daquele produto. Clique novamente para remover o filtro.

## 8. Producao

Use **Producao** para manter fichas tecnicas e executar ordens de producao.

### Criar ficha tecnica

1. Em **Nova versao de ficha tecnica**, informe o nome.
2. Selecione o produto produzido.
3. Informe o rendimento.
4. Adicione os insumos usados na receita.
5. Informe a quantidade de cada insumo.
6. Clique em **Criar ficha**.

Cada nova ficha e registrada como uma nova versao. Versoes anteriores ficam
como historico.

### Planejar ordem

1. Em **Nova ordem**, selecione a ficha tecnica.
2. Informe a quantidade produzida.
3. Preencha observacoes, se necessario.
4. Clique em **Planejar producao**.

### Executar ordem

Status possiveis:

- **A produzir**: ordem planejada e ainda nao iniciada.
- **Iniciada**: insumos baixados do estoque.
- **Finalizada**: produto fabricado entrou no estoque.
- **Cancelada**: ordem encerrada sem conclusao.

Acoes:

- Clique em **Iniciar** para baixar insumos.
- Clique em **Finalizar** para registrar a entrada do produto produzido.
- Clique em **Cancelar** para cancelar uma ordem planejada ou iniciada.

## 9. Vendas

Use **Vendas** para registrar atendimentos de balcao, encomendas e recebimentos.

### Registrar venda

1. Selecione o cliente ou mantenha **Consumidor final**.
2. Escolha a forma de pagamento: Pix, Dinheiro, Cartao ou A prazo.
3. Para Pix, Cartao ou A prazo, informe a referencia do pagamento quando
   aplicavel.
4. Para Cartao, informe bandeira e parcelas.
5. Adicione os produtos vendidos.
6. Para cada item, informe quantidade e preco unitario.
7. Informe desconto, se houver.
8. Preencha observacoes, se necessario.
9. Confira subtotal e total.
10. Clique em **Registrar venda**.

### Desconto acima de 10%

Quando o desconto ultrapassa 10% do subtotal, o sistema exige autorizacao.

1. Informe o responsavel.
2. Informe a justificativa.
3. Registre a venda somente com perfil autorizado.

### Venda acima do estoque

Quando algum item excede o saldo disponivel, o sistema exige autorizacao.

1. Confira os itens destacados.
2. Informe o responsavel.
3. Informe a justificativa.
4. Registre a venda somente com perfil autorizado.

### Receber ou cancelar

A lista de vendas pode ser filtrada por:

- Todas
- Abertas
- Pagas
- Canceladas

Acoes:

- **Receber**: baixa uma venda aberta.
- **Cancelar**: cancela uma venda aberta ou paga e reverte os efeitos
  correspondentes.

## 10. Caixa e financeiro

Use **Caixa** para abrir e fechar caixa, registrar lancamentos, baixar contas,
conciliar valores e controlar suprimentos e sangrias.

### Abrir caixa

1. Informe o valor inicial.
2. Informe o responsavel.
3. Clique em **Abrir caixa**.

### Registrar suprimento ou sangria

1. Escolha o tipo de movimentacao.
2. Informe o valor.
3. Informe o motivo.
4. Informe o responsavel.
5. Registre a movimentacao.

### Conciliar caixa

1. Escolha a forma de pagamento.
2. Informe o valor esperado.
3. Informe o valor contado.
4. Informe o responsavel.
5. Registre observacao se houver divergencia.
6. Salve a conciliacao.

### Fechar caixa

1. Confira o caixa aberto.
2. Informe o valor contado.
3. Informe o responsavel.
4. Informe justificativa se houver divergencia.
5. Clique em **Fechar caixa**.

### Lancamentos financeiros

Campos principais:

- Tipo: entrada ou saida.
- Valor.
- Categoria.
- Descricao.
- Vencimento.

Acoes:

- Registrar lancamento.
- Baixar lancamento.
- Cancelar lancamento.
- Filtrar por status.

## 11. CRM

Use **CRM** para registrar e acompanhar interacoes com clientes.

O modulo apresenta indicadores como:

- Total de interacoes.
- Retornos abertos.
- Interacoes concluidas.

Ao registrar uma interacao, informe cliente, tipo, assunto, descricao, data de
retorno quando necessario, responsavel e status. Depois, use as acoes da lista
para concluir ou cancelar a interacao.

## 12. Dashboard

Use **Dashboard** para acompanhar a saude da operacao.

Principais indicadores:

- Pontuacao de saude do negocio.
- Resultado liquido.
- Receita realizada.
- Caixa projetado.
- Margem bruta.
- Despesas operacionais.
- Perdas de estoque.
- Valor em estoque.
- Compras abertas.
- Taxa de recebimento de compras.
- Taxa de conclusao de producao.
- Movimentos de estoque.

Use os filtros de periodo para mudar o intervalo analisado. O dashboard tambem
exibe focos executivos e alertas, como estoque abaixo do minimo, vendas abertas,
compras pendentes e margens baixas.

## 13. Relatorios

Use **Relatorios** para analise consolidada por periodo.

1. Informe data de inicio e fim.
2. Consulte os cards de resumo.
3. Analise validacoes contabeis basicas.
4. Consulte tabelas por status, pagamento, compras, producao e estoque.
5. Use as opcoes de exportacao disponiveis na tela, quando habilitadas.

Indicadores apresentados:

- Receita.
- Custo de vendas.
- Margem.
- Custo unitario de producao.
- Valor de estoque.
- Resultado liquido.
- Despesas operacionais.
- Entradas e saidas pendentes.

## 14. Auditoria

Use **Auditoria** para consultar a trilha de eventos do sistema.

O modulo mostra:

- Total de eventos.
- Eventos com sucesso.
- Eventos com falha.
- Usuarios envolvidos.

Filtros disponiveis:

- Periodo inicial.
- Periodo final.
- Usuario.
- Entidade.
- Resultado.
- Acao, por exemplo `sale.create`.

Use **Limpar** para remover filtros. A auditoria ajuda a rastrear quem criou,
alterou, cancelou, recebeu, baixou ou estornou registros.

## 15. Aplicativo mobile

O aplicativo mobile e voltado para operacao rapida em estoque, producao e
venda simples.

### Abas

- **Inicio**: mostra estoque abaixo do minimo, producoes ativas e itens a venda.
- **Estoque**: consulta saldos e permite registrar perdas quando o perfil tem
  permissao.
- **Producao**: permite iniciar e finalizar ordens de producao.
- **Venda**: registra venda simples de produtos ativos com preco de venda.

### Atualizar dados

Puxe a tela para baixo para sincronizar novamente com a API.

### Sair

Use o botao **Sair** no cabecalho do aplicativo.

## 16. Permissoes e mensagens de acesso

Quando o usuario pode consultar, mas nao pode alterar um modulo, a tela exibe
um aviso explicando a limitacao. Botoes de criacao, edicao, recebimento,
cancelamento ou fechamento podem ficar indisponiveis conforme o perfil.

Principio geral:

- Proprietario: acesso completo, incluindo gestao de permissoes.
- Gerente: acesso operacional amplo, exceto gestao de permissoes.
- Caixa: vendas, caixa, clientes, relatorios e auditoria.
- Producao: estoque basico e ordens de producao.
- Estoque: compras, recebimentos, ajustes e perdas.
- Vendas: clientes, CRM e vendas.
- Consulta: dashboard e relatorios.

## 17. Boas praticas operacionais

- Cadastre produtos, fornecedores e clientes antes de usar compras, producao e
  vendas.
- Mantenha SKU, categoria e unidade corretos para evitar erro de compra,
  estoque e relatorio.
- Registre compras antes de receber mercadorias.
- Justifique toda divergencia de recebimento, inventario, desconto alto ou
  venda acima do estoque.
- Use perdas para quebras reais e ajustes somente para correcao autorizada.
- Inicie producao apenas quando os insumos estiverem disponiveis.
- Finalize producao assim que o produto estiver pronto para venda ou estoque.
- Feche o caixa no fim do turno ou do dia.
- Consulte auditoria quando houver duvida sobre alteracoes ou cancelamentos.

## 18. Solucao de problemas

| Situacao | O que verificar |
| --- | --- |
| Nao consigo entrar | Confira e-mail, senha e conexao com a API. |
| Modulo nao aparece | Seu perfil pode nao ter permissao para aquele modulo. |
| Botao esta desabilitado | A permissao de escrita pode nao estar liberada para seu perfil. |
| Produto nao aparece em compras | Verifique se o produto esta ativo e se pode ser comprado. |
| Produto nao aparece em vendas | Verifique se o produto esta ativo, tem preco de venda e e vendavel. |
| Venda exige autorizacao | O desconto passou de 10% ou a quantidade excede o saldo. |
| Compra ficou parcial | A quantidade recebida foi menor que a quantidade pedida. |
| Estoque ficou divergente | Consulte movimentos, lotes e inventario fisico do produto. |
| Caixa nao fecha | Verifique se existe caixa aberto e informe valor contado/responsavel. |

