# Marketplace Pessoal — Especificação Técnica
_Criado em: 2026-08-27_

## Visão Geral

Marketplace simples para venda de roupas, roupas íntimas e roupas de academia.
A cliente navega pelos produtos, monta o carrinho e envia o pedido via WhatsApp para a vendedora fechar a venda manualmente.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Banco de dados | PostgreSQL (Railway) |
| ORM | Prisma |
| Autenticação | NextAuth.js (Credentials) |
| Imagens | Cloudinary |
| Estado do carrinho | Zustand (client-side) |
| UI | shadcn/ui + Tailwind CSS |
| Deploy frontend | Vercel |
| Deploy banco | Railway |

---

## Modelo de Dados

```prisma
model Product {
  id          String    @id @default(cuid())
  name        String
  description String?
  price       Decimal   @db.Decimal(10, 2)
  category    Category
  sizes       String[]
  images      String[]  // URLs Cloudinary
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum Category {
  CLOTHES   // Roupas
  LINGERIE  // Roupas Íntimas
  WORKOUT   // Academia
}
```

Sem tabela de pedidos — o pedido trafega pelo WhatsApp.

---

## Estrutura de Rotas

```
app/
├── (store)/                          ← loja pública (sem auth)
│   ├── page.tsx                      ← vitrine com filtro por categoria
│   ├── products/[id]/page.tsx        ← detalhe do produto
│   └── cart/page.tsx                 ← carrinho + confirmação + link WhatsApp
│
├── (admin)/                          ← painel da vendedora (requer auth)
│   ├── login/page.tsx
│   └── admin/
│       ├── page.tsx                  ← listagem de produtos
│       ├── products/new/page.tsx     ← cadastrar produto + upload de fotos
│       └── products/[id]/edit/page.tsx
│
└── api/
    ├── products/route.ts             ← GET listagem, POST criar
    ├── products/[id]/route.ts        ← GET, PUT, DELETE
    └── auth/[...nextauth]/route.ts
```

---

## Fluxo da Cliente

1. Acessa a vitrine → vê produtos por categoria
2. Clica no produto → vê fotos, descrição, preço, tamanhos disponíveis
3. Seleciona tamanho → adiciona ao carrinho
4. Abre o carrinho → vê itens, quantidades e total estimado
5. Clica em "Confirmar Pedido"
6. Tela de confirmação exibe aviso:
   > _"Você será redirecionada ao WhatsApp para finalizar a compra diretamente com a vendedora."_
7. Botão abre `wa.me/{numero}?text=...` com mensagem pré-formatada

### Formato da mensagem WhatsApp

```
Olá! Gostaria de encomendar:

- Blusa Fitness Tam. P × 2 — R$ 89,90
- Conjunto Íntimo Tam. M × 1 — R$ 120,00

Total estimado: R$ 299,80
```

---

## Fluxo da Vendedora (Admin)

1. Acessa `/login` → autentica com e-mail e senha
2. Painel lista todos os produtos (ativos e inativos)
3. Pode criar produto: nome, descrição, preço, categoria, tamanhos, fotos (Cloudinary Upload Widget — upload direto do browser)
4. Pode editar ou desativar produtos (sem deletar do banco)

---

## Decisões de Arquitetura

| Ponto | Decisão | Motivo |
|---|---|---|
| Auth | NextAuth Credentials | Única usuária admin, sem necessidade de OAuth |
| Cart | Zustand client-only | Cliente não faz login; não há necessidade de persistir pedidos |
| Upload de imagens | Cloudinary Upload Widget | Upload direto browser → Cloudinary, sem overhead no servidor |
| Sem tela de pagamento | WhatsApp redirect | Venda é fechada manualmente pela vendedora |
| Produtos inativos | Flag `active` | Não deletar registros, apenas ocultar da vitrine |

---

## Variáveis de Ambiente

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=

WHATSAPP_NUMBER=  # formato: 5511999999999
```

---

## Fora do Escopo (v1)

- Pagamento online
- Cadastro de clientes
- Histórico de pedidos
- Estoque com controle de quantidade
- Múltiplos administradores
- Notificações push / e-mail
