const { AppError } = require("./error.middleware");
const { prisma } = require("../database/prisma");

const adminMiddleware = {
  // Verificar se é administrador
  async isAdmin(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user || user.role !== "ADMIN") {
        throw new AppError("Acesso negado. Apenas administradores.", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  // Verificar se pode acessar/modificar o usuário
  async canAccessUser(req, res, next) {
    try {
      const targetUserId = parseInt(req.params.id);
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      // Admin pode acessar qualquer um
      if (currentUser.role === "ADMIN") {
        return next();
      }

      // Usuário comum só pode acessar a si mesmo
      if (currentUser.id !== targetUserId) {
        throw new AppError(
          "Você não tem permissão para acessar este usuário",
          403,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminMiddleware;
