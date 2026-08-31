# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Clientes da vitrine:** mulheres, público misto — novas visitantes que chegam por link de WhatsApp ou redes sociais, e clientes recorrentes que voltam para ver novidades ou pedir uma peça específica. Navegam predominantemente no celular, em contexto casual (entre tarefas, em casa, no intervalo). A decisão de compra é influenciada por preço, foto do produto e confiança na vendedora.

**Administradora (vendedora):** a própria dona da loja, que gerencia o catálogo, sobe fotos de produtos, cria listas de preços com promoções sazonais e acompanha os pedidos que chegam pelo WhatsApp.

## Product Purpose

Vitrine digital para microempreendedora do segmento de moda feminina. A loja permite que clientes naveguem o catálogo, montem o carrinho e fechem o pedido diretamente com a vendedora pelo WhatsApp — eliminando a fricção de apps de delivery e mantendo o atendimento pessoal como centro da experiência.

## Positioning

Atendimento pessoal via WhatsApp: cada pedido chega diretamente à vendedora, que acompanha, tira dúvidas e personaliza o fechamento. Uma grande loja não pode replicar esse vínculo humano.

## Operating Context

- Clientes compartilham o link da loja em grupos de WhatsApp, Stories do Instagram e conversas diretas.
- A vendedora sobe produtos com fotos tiradas no próprio celular, define tamanhos disponíveis e cria promoções por categoria em datas específicas (Black Friday, liquidação, etc.).
- Pedidos chegam como mensagem pré-formatada no WhatsApp da vendedora; ela confirma disponibilidade, trata pagamento e combina entrega fora do sistema.
- O produto não processa pagamento nem rastreia estoque — é intencionalmente simples.

## Capabilities and Constraints

- Categorias: Roupas, Íntimas, Academia.
- Tamanhos: PP, P, M, G, GG, XGG, Único.
- Imagens hospedadas no Cloudinary via upload direto pelo browser (widget não-signed preset).
- Listas de preços com desconto percentual, janela de datas e escopo por categoria ou produto individual.
- Carrinho persistido em localStorage (Zustand); preço promocional é snapshotado no momento do "Adicionar ao Carrinho".
- Sem processamento de pagamento, sem cadastro de cliente, sem estoque.
- Locale primário: `pt` (Português do Brasil). Suporte a `en` via `NEXT_PUBLIC_LOCALE`.
- Deploy: Vercel (frontend) + Railway (PostgreSQL).

## Brand Commitments

**Nome:** Sonho de Mulher

Voz: próxima, feminina, acolhedora — como uma amiga que indica moda. Sem formalidade corporativa.

## Evidence on Hand

- Código-fonte completo em `/` (Next.js 14 App Router, TypeScript).
- Schema Prisma com Product, PriceList, PriceListItem em `prisma/schema.prisma`.
- Strings de UI em `messages/pt.json` e `messages/en.json`.
- Sem fotos reais de produto, sem logotipo, sem paleta de marca definida ainda.

## Product Principles

1. **O WhatsApp é o caixa.** A vitrine existe para levar a cliente até a mensagem — não para substituir a relação com a vendedora.
2. **Celular primeiro, sempre.** A maioria das visitas vem de link compartilhado em app mobile; qualquer elemento que não funcione bem em 375 px é um bug.
3. **Simples de operar.** A vendedora não é técnica — o admin deve ser rápido, óbvio e tolerante a erros sem manual.
4. **Confiança visual.** Fotos grandes, preços claros e promoções visíveis constroem a decisão de compra antes da mensagem chegar.
5. **Zero fricção no checkout.** O caminho vitrine → carrinho → WhatsApp precisa ter o menor número possível de taps.

## Accessibility & Inclusion

Tap targets mínimos de 44 px em todos os controles interativos (requisito de produto, não apenas acessibilidade). Sem requisito de conformidade formal declarado além disso.
