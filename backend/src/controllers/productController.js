// src/controllers/product.controller.js
const { prisma } = require('../database/prisma');
const { AppError } = require('../middlewares/error.middleware');

const productController = {
  // Criar produto
  async create(req, res, next) {
    try {
      const { name, description, price, stock } = req.body;

      // Validações
      if (!name || !price) {
        throw new AppError('Nome e preço são obrigatórios', 400);
      }

      if (price <= 0) {
        throw new AppError('Preço deve ser maior que zero', 400);
      }

      if (stock !== undefined && stock < 0) {
        throw new AppError('Estoque não pode ser negativo', 400);
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock: stock || 0
        }
      });

      res.status(201).json({
        status: 'success',
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  // Listar produtos
  async findAll(req, res, next) {
    try {
      const products = await prisma.product.findMany();

      res.status(200).json({
        status: 'success',
        data: products
      });
    } catch (error) {
      next(error);
    }
  },

  // Buscar produto por ID
  async findOne(req, res, next) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) }
      });

      if (!product) {
        throw new AppError('Produto não encontrado', 404);
      }

      res.status(200).json({
        status: 'success',
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  // Atualizar produto
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, price, stock } = req.body;

      // Verificar se produto existe
      const productExists = await prisma.product.findUnique({
        where: { id: parseInt(id) }
      });

      if (!productExists) {
        throw new AppError('Produto não encontrado', 404);
      }

      // Validações
      if (price !== undefined && price <= 0) {
        throw new AppError('Preço deve ser maior que zero', 400);
      }

      if (stock !== undefined && stock < 0) {
        throw new AppError('Estoque não pode ser negativo', 400);
      }

      const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          name,
          description,
          price,
          stock
        }
      });

      res.status(200).json({
        status: 'success',
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  // Deletar produto
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar se produto existe
      const productExists = await prisma.product.findUnique({
        where: { id: parseInt(id) }
      });

      if (!productExists) {
        throw new AppError('Produto não encontrado', 404);
      }

      // Verificar se tem itens em pedidos
      const orderItemCount = await prisma.orderItem.count({
        where: { productId: parseInt(id) }
      });

      if (orderItemCount > 0) {
        throw new AppError('Produto possui itens em pedidos e não pode ser deletado', 409);
      }

      await prisma.product.delete({
        where: { id: parseInt(id) }
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // Atualizar estoque
  async updateStock(req, res, next) {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body; // operation: 'increment' ou 'decrement'

      if (!quantity || quantity <= 0) {
        throw new AppError('Quantidade deve ser maior que zero', 400);
      }

      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) }
      });

      if (!product) {
        throw new AppError('Produto não encontrado', 404);
      }

      let newStock;
      if (operation === 'increment') {
        newStock = product.stock + quantity;
      } else if (operation === 'decrement') {
        newStock = product.stock - quantity;
        if (newStock < 0) {
          throw new AppError('Estoque insuficiente', 400);
        }
      } else {
        throw new AppError('Operação inválida. Use "increment" ou "decrement"', 400);
      }

      const updatedProduct = await prisma.product.update({
        where: { id: parseInt(id) },
        data: { stock: newStock }
      });

      res.status(200).json({
        status: 'success',
        data: updatedProduct
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;