import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as Parameters<typeof PrismaClient>[0]);

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@embalse.com" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@embalse.com",
      password,
      rol: "ADMIN",
    },
  });

  console.log("Seed completado. Usuario admin: admin@embalse.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
