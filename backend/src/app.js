const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Importar rotas
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Importar middlewares
const { errorHandler } = require("./middlewares/error.middleware");
const { requestLogger } = require("./middlewares/logger.middleware");
const authMiddleware = require("./middlewares/auth.middleware");

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://mini-erp-henna.vercel.app",
  ],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Rotas públicas
app.use("/api/auth", authRoutes);

// Rotas protegidas
app.use("/api/users", authMiddleware.authenticate, userRoutes);
app.use("/api/products", authMiddleware.authenticate, productRoutes);
app.use("/api/orders", authMiddleware.authenticate, orderRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API Mini ERP funcionando",
    timestamp: new Date().toISOString(),
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Rota ${req.originalUrl} não encontrada`,
  });
});

app.use(errorHandler);

module.exports = app;
