// src/controllers/order.controller.js
const { prisma } = require("../database/prisma");
const { AppError } = require("../middlewares/error.middleware");

const orderController = {
  // Criar pedido
  async create(req, res, next) {
    try {
      const { userId, items } = req.body;

      if (!userId || !items || !items.length) {
        throw new AppError("Usuário e itens do pedido são obrigatórios", 400);
      }

      // Verificar se usuário existe
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      });

      if (!user) {
        throw new AppError("Usuário não encontrado", 404);
      }

      // Verificar produtos e estoque
      let total = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: parseInt(item.productId) },
        });

        if (!product) {
          throw new AppError(
            `Produto ID ${item.productId} não encontrado`,
            404,
          );
        }

        if (product.stock < item.quantity) {
          throw new AppError(`Estoque insuficiente para ${product.name}`, 400);
        }

        const itemTotal = product.price * item.quantity;
        total += itemTotal;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });
      }

      // Criar pedido em transação
      const order = await prisma.$transaction(async (tx) => {
        // Criar pedido
        const newOrder = await tx.order.create({
          data: {
            userId: parseInt(userId),
            total,
            items: {
              create: orderItems,
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        // Atualizar estoque
        for (const item of items) {
          await tx.product.update({
            where: { id: parseInt(item.productId) },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        return newOrder;
      });

      res.status(201).json({
        status: "success",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  // Listar pedidos
  async findAll(req, res, next) {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({
        status: "success",
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  },

  // Buscar pedido por ID
  async findOne(req, res, next) {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new AppError("Pedido não encontrado", 404);
      }

      res.status(200).json({
        status: "success",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  // Atualizar status
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = [
        "PENDING",
        "APPROVED",
        "SHIPPED",
        "DELIVERED",
        "CANCELED",
      ];

      if (!status || !validStatuses.includes(status)) {
        throw new AppError("Status inválido", 400);
      }

      const order = await prisma.order.findUnique({
        where: { id: parseInt(id) },
      });

      if (!order) {
        throw new AppError("Pedido não encontrado", 404);
      }

      const updatedOrder = await prisma.order.update({
        where: { id: parseInt(id) },
        data: { status },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      res.status(200).json({
        status: "success",
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  },

  // Cancelar pedido
  async cancel(req, res, next) {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id: parseInt(id) },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new AppError("Pedido não encontrado", 404);
      }

      if (order.status === "DELIVERED" || order.status === "CANCELED") {
        throw new AppError("Pedido não pode ser cancelado", 400);
      }

      // Cancelar pedido e restaurar estoque em transação
      const cancelledOrder = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id: parseInt(id) },
          data: { status: "CANCELED" },
        });

        // Restaurar estoque
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        return updated;
      });

      res.status(200).json({
        status: "success",
        data: cancelledOrder,
      });
    } catch (error) {
      next(error);
    }
  },

  // Pedidos por usuário
  async findByUser(req, res, next) {
    try {
      const { userId } = req.params;

      const orders = await prisma.order.findMany({
        where: { userId: parseInt(userId) },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({
        status: "success",
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  },

  // Pedidos por status
  async findByStatus(req, res, next) {
    try {
      const { status } = req.params;

      const validStatuses = [
        "PENDING",
        "APPROVED",
        "SHIPPED",
        "DELIVERED",
        "CANCELED",
      ];

      if (!validStatuses.includes(status)) {
        throw new AppError("Status inválido", 400);
      }

      const orders = await prisma.order.findMany({
        where: { status },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({
        status: "success",
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = orderController;
