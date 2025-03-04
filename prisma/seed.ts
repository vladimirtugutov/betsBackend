import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Создаем пользователя user5
  const user = await prisma.user.upsert({
    where: { email: 'user5@example.com' },
    update: {},
    create: {
      username: 'user5',
      email: 'user5@example.com',
      lastLogin: new Date(),
    },
  });

  // Создаем внешнюю учетную запись для пользователя user5
  await prisma.externalApiAccount.create({
    data: {
      userId: user.id,
      externalId: "5", // внешний идентификатор из API ставок
      secretKey: "db0edd04aaac4506f7edab03ac855d56",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
