const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

// CRUD de produtos
router.post("/", productController.create);
router.get("/", productController.findAll);
router.get("/:id", productController.findOne);
router.put("/:id", productController.update);
router.delete("/:id", productController.delete);

// Rota específica para estoque
router.patch("/:id/stock", productController.updateStock);

module.exports = router;
