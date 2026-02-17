const bcrypt = require("bcrypt");
const { prisma } = require("../database/prisma");
const { AppError } = require("../middlewares/error.middleware");

const userController = {
  // Criar usuário (SÓ ADMIN)
  async create(req, res, next) {
    try {
      const { name, email, password, role = "USER" } = req.body;

      // Verificar se quem está criando é ADMIN (middleware já faz isso)
      if (!name || !email || !password) {
        throw new AppError("Nome, email e senha são obrigatórios", 400);
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new AppError("Email já cadastrado", 409);
      }

      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Só admin pode criar outro admin
      let userRole = "USER";
      if (role === "ADMIN" && req.user.role === "ADMIN") {
        userRole = "ADMIN";
      }

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: userRole,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        status: "success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  // Listar todos os usuários
  async findAll(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
      });
      res.status(200).json({
        status: "success",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  // Buscar usuário pelo ID
  async findOne(req, res, next) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          orders: {
            select: {
              id: true,
              status: true,
              total: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        throw new AppError("Usuário não encontrado", 404);
      }

      res.status(200).json({
        status: "success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  // Atualizar um usuário pelo ID
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, email, password, role } = req.body;
      const targetId = parseInt(id);

      const existingUser = await prisma.user.findUnique({
        where: { id: targetId },
      });

      if (!existingUser) {
        throw new AppError("Usuário não encontrado", 404);
      }

      // 🔒 REGRAS DE ATUALIZAÇÃO
      const isAdmin = req.user.role === "ADMIN";
      const isOwnUser = req.user.id === targetId;

      // Usuário comum só pode editar a si mesmo
      if (!isAdmin && !isOwnUser) {
        throw new AppError(
          "Você não tem permissão para editar este usuário",
          403,
        );
      }

      const updateData = {};
      if (name) updateData.name = name;

      if (email) {
        const emailExists = await prisma.user.findUnique({ where: { email } });
        if (emailExists && emailExists.id !== targetId) {
          throw new AppError("Email já cadastrado", 409);
        }
        updateData.email = email;
      }

      if (password) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        updateData.password = await bcrypt.hash(password, saltRounds);
      }

      // Só admin pode mudar role
      if (role && isAdmin) {
        // Não pode rebaixar outro admin
        if (existingUser.role === "ADMIN" && role !== "ADMIN" && !isOwnUser) {
          throw new AppError("Não é possível rebaixar um administrador", 400);
        }
        updateData.role = role;
      }

      const user = await prisma.user.update({
        where: { id: targetId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(200).json({
        status: "success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  // 🔐 DELETAR USUÁRIO (COM PROTEÇÕES)
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const targetId = parseInt(id);
      const currentUserId = req.user.id;
      const currentUserRole = req.user.role;

      // Buscar usuário alvo
      const userToDelete = await prisma.user.findUnique({
        where: { id: targetId },
      });

      if (!userToDelete) {
        throw new AppError("Usuário não encontrado", 404);
      }

      // 🚫 REGRA 1: Não pode deletar a si mesmo
      if (currentUserId === targetId) {
        throw new AppError("Você não pode deletar seu próprio usuário", 400);
      }

      // 🚫 REGRA 2: Só admin pode deletar usuários
      if (currentUserRole !== "ADMIN") {
        throw new AppError(
          "Apenas administradores podem deletar usuários",
          403,
        );
      }

      // 🚫 REGRA 3: Admin não pode deletar outro admin
      if (userToDelete.role === "ADMIN") {
        throw new AppError(
          "Administradores não podem deletar outros administradores",
          400,
        );
      }

      // Verificar se tem pedidos
      const orderCount = await prisma.order.count({
        where: { userId: targetId },
      });

      if (orderCount > 0) {
        throw new AppError(
          "Não é possível deletar usuário com pedidos associados",
          400,
        );
      }

      await prisma.user.delete({
        where: { id: targetId },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userController;
