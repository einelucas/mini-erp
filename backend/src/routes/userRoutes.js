const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware.authenticate);

// Rotas que qualquer usuário logado pode acessar
router.get("/", userController.findAll);
router.get("/:id", adminMiddleware.canAccessUser, userController.findOne);
router.put("/:id", adminMiddleware.canAccessUser, userController.update);

// 🚨 Rota de criar usuário (SÓ ADMIN)
router.post("/", adminMiddleware.isAdmin, userController.create);

// 🚨 Rota de deletar usuário (SÓ ADMIN - com proteções extras)
router.delete("/:id", adminMiddleware.isAdmin, userController.delete);

module.exports = router;
