const express = require("express");
const orderController = require("../controllers/orderController");

const router = express.Router();

// CRUD de pedidos
router.post("/", orderController.create);
router.get("/", orderController.findAll);
router.get("/:id", orderController.findOne);
router.patch("/:id/status", orderController.updateStatus);
router.post("/:id/cancel", orderController.cancel);

// Filtros
router.get("/user/:userId", orderController.findByUser);
router.get("/status/:status", orderController.findByStatus);

module.exports = router;
