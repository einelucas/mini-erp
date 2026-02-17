const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.create({
      data: {
        name: "Teste",
        email: "teste@email.com",
        password: "123456",
        role: "ADMIN",
      },
    });
    console.log("✅ Usuário criado:", user);
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

test();
