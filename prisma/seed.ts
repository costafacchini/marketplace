import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Blusa Floral Verão',
        description: 'Blusa leve com estampa floral, perfeita para dias quentes.',
        price: 89.9,
        category: 'CLOTHES',
        sizes: ['PP', 'P', 'M', 'G'],
        images: [],
        active: true,
      },
      {
        name: 'Conjunto Íntimo Renda',
        description: 'Conjunto com detalhes em renda, confortável e delicado.',
        price: 129.9,
        category: 'LINGERIE',
        sizes: ['P', 'M', 'G', 'GG'],
        images: [],
        active: true,
      },
      {
        name: 'Legging Compressão',
        description: 'Legging de alta compressão para treinos intensos.',
        price: 119.9,
        category: 'WORKOUT',
        sizes: ['PP', 'P', 'M', 'G', 'GG'],
        images: [],
        active: true,
      },
    ],
  })

  console.log('Seed complete — 3 sample products created')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
