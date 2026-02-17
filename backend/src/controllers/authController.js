const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { prisma } = require("../database/prisma");
const { AppError } = require("../middlewares/error.middleware");

const authController = {
  // Login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError("Email e senha são obrigatórios", 400);
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError("Email ou senha inválidos", 401);
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new AppError("Email ou senha inválidos", 401);
      }

      // 🔥 INCLUIR ROLE NO TOKEN
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // 👈 ADICIONADO!
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        status: "success",
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Verificar token
  async verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        throw new AppError("Token não fornecido", 401);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true, // 👈 INCLUIR ROLE
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError("Usuário não encontrado", 401);
      }

      res.json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        next(new AppError("Token inválido", 401));
      } else if (error.name === "TokenExpiredError") {
        next(new AppError("Token expirado", 401));
      } else {
        next(error);
      }
    }
  },

  // Registrar primeiro usuário (setup inicial)
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // Verificar se já existe algum usuário
      const userCount = await prisma.user.count();

      if (userCount > 0) {
        throw new AppError("Sistema já possui usuários. Faça login.", 400);
      }

      if (!name || !email || !password) {
        throw new AppError("Nome, email e senha são obrigatórios", 400);
      }

      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 🔥 PRIMEIRO USUÁRIO É ADMIN!
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "ADMIN", // 👈 PRIMEIRO É ADMIN
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      res.status(201).json({
        status: "success",
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
