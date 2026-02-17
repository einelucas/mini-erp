// src/database/prisma.js
require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("./generated/prisma/client"); // ✅ SEM .ts
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("❌ DATABASE_URL não definida no .env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Função para testar conexão
async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Conectado ao banco de dados");
  } catch (error) {
    console.error("❌ Erro de conexão:", error);
    process.exit(1);
  }
}

module.exports = { prisma, testConnection };
