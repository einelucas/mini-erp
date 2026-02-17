const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Rotas públicas
router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/verify", authController.verifyToken);

module.exports = router;
