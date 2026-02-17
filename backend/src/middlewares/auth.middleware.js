const jwt = require("jsonwebtoken");
const { AppError } = require("./error.middleware");
const { prisma } = require("../database/prisma");

const authMiddleware = {
  async authenticate(req, res, next) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        throw new AppError("Acesso negado. Token não fornecido.", 401);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new AppError("Usuário não encontrado", 401);
      }

      // ✅ Incluir role no req.user
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // 👈 ADICIONADO!
      };

      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        next(new AppError("Token inválido", 401));
      } else if (error.name === "TokenExpiredError") {
        next(new AppError("Sessão expirada. Faça login novamente.", 401));
      } else {
        next(error);
      }
    }
  },
};

module.exports = authMiddleware;
