# Marketplace Filha

Marketplace simples para venda de roupas, roupas íntimas e roupas de academia. A cliente navega pelos produtos, monta o carrinho e envia o pedido via WhatsApp para a vendedora fechar a venda manualmente.

---

## Funcionalidades

### Loja (pública)
- Vitrine com filtro por categoria (Roupas, Íntimas, Academia)
- Ordenação: promoções primeiro, menor preço, A–Z
- Badge **"X% OFF"** nos cards de produtos em promoção
- Página de detalhe com galeria de fotos e seletor de tamanho
- Carrinho client-side (sem login) com controle de quantidade
- Checkout via WhatsApp com mensagem pré-formatada

### Listas de preços (promoções)
- Desconto percentual com vigência (data de início + expiração)
- Escopo por categoria e/ou produtos individuais
- Override de desconto por produto dentro da mesma lista
- Preço promocional exibido em toda a jornada — vitrine, detalhe, carrinho e mensagem do WhatsApp

### Painel admin (vendedora)
- Autenticação por e-mail e senha (sem OAuth)
- CRUD de produtos com upload de fotos direto para o Cloudinary
- Ativar/desativar produtos (sem deletar do banco)
- CRUD de listas de preços com seleção de categorias e produtos

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 14 (App Router) |
| Banco de dados | PostgreSQL (Railway) |
| ORM | Prisma |
| Autenticação | NextAuth.js (Credentials) |
| Imagens | Cloudinary Upload Widget |
| Estado do carrinho | Zustand (client-side, persistido em localStorage) |
| UI | shadcn/ui + Tailwind CSS |
| Validação | Zod + react-hook-form |
| Deploy frontend | Vercel |
| Deploy banco | Railway |

---

## Modelo de dados

```prisma
model Product {
  id             String          @id @default(cuid())
  name           String
  description    String?
  price          Decimal         @db.Decimal(10, 2)
  category       Category
  sizes          String[]
  images         String[]        // URLs Cloudinary
  active         Boolean         @default(true)
  priceListItems PriceListItem[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model PriceList {
  id          String          @id @default(cuid())
  name        String
  discountPct Decimal         @db.Decimal(5, 2)   // 0.00–100.00
  startsAt    DateTime
  expiresAt   DateTime
  active      Boolean         @default(true)
  categories  Category[]
  items       PriceListItem[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model PriceListItem {
  id          String    @id @default(cuid())
  priceList   PriceList @relation(fields: [priceListId], references: [id], onDelete: Cascade)
  priceListId String
  product     Product   @relation(fields: [productId], references: [id])
  productId   String
  discountPct Decimal?  @db.Decimal(5, 2)  // override por produto

  @@unique([priceListId, productId])
}

enum Category {
  CLOTHES   // Roupas
  LINGERIE  // Roupas Íntimas
  WORKOUT   // Academia
}
```

---

## Fluxo da cliente

1. Acessa a vitrine → filtra por categoria e ordena como preferir
2. Vê badge de desconto nos produtos em promoção
3. Abre o produto → galeria de fotos, preço (com desconto se houver), tamanhos
4. Adiciona ao carrinho com o tamanho escolhido
5. Revisa o carrinho → ajusta quantidades ou remove itens
6. Clica em **Confirmar Pedido** → tela de aviso antes do redirecionamento
7. **Enviar pelo WhatsApp** → abre `wa.me` com mensagem pré-formatada

```
Olá! Gostaria de encomendar:

- Blusa Fitness Tam. P × 2 — R$ 71,92
- Conjunto Íntimo Tam. M × 1 — R$ 120,00

Total estimado: R$ 263,84
```

---

## Fluxo da vendedora (admin)

1. Acessa `/login` → autentica com e-mail e senha
2. Gerencia produtos: cria, edita, ativa/desativa, faz upload de fotos
3. Gerencia listas de preços: define desconto %, período de vigência e escopo
4. Fecha cada venda manualmente pelo WhatsApp

---

## Lógica de resolução de preço

Para cada produto, o sistema verifica todas as listas de preços ativas (`active = true` e dentro do período de vigência), ordenadas da mais recente para a mais antiga. A primeira lista que cobre o produto é aplicada:

1. O produto está nos itens da lista → usa o `discountPct` do item (ou o da lista se não houver override)
2. A categoria do produto está na lista → usa o `discountPct` da lista

Se múltiplas listas cobrem o mesmo produto, a **mais recente** prevalece.

---

## Estrutura de rotas

```
app/
├── (store)/                              ← loja pública (sem auth)
│   ├── page.tsx                          ← vitrine com filtro + ordenação
│   ├── products/[id]/page.tsx            ← detalhe do produto
│   └── cart/page.tsx                     ← carrinho + checkout WhatsApp
│
├── (admin)/                              ← painel da vendedora (requer auth)
│   ├── login/page.tsx
│   └── admin/
│       ├── page.tsx                      ← listagem de produtos
│       ├── products/new/page.tsx
│       ├── products/[id]/edit/page.tsx
│       ├── price-lists/page.tsx          ← listagem de listas de preços
│       ├── price-lists/new/page.tsx
│       └── price-lists/[id]/edit/page.tsx
│
└── api/
    ├── products/route.ts
    ├── products/[id]/route.ts
    ├── price-lists/route.ts
    ├── price-lists/[id]/route.ts
    └── auth/[...nextauth]/route.ts
```

---

## Variáveis de ambiente

```env
# Banco de dados
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=        # openssl rand -base64 32
NEXTAUTH_URL=           # https://seu-dominio.vercel.app

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=   # preset sem assinatura

# Admin
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=    # bcryptjs.hashSync('senha', 12)

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=   # formato: 5511999999999
```

---

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npx prisma migrate dev
npm run dev                  # http://localhost:3000
```

---

## Fora do escopo (v1)

- Pagamento online
- Cadastro de clientes
- Histórico de pedidos
- Controle de estoque por quantidade
- Múltiplos administradores
- Notificações push / e-mail
