// ===== script.js - VERSÃO CORRIGIDA E UNIFICADA =====

// Aguardar CONFIG carregar
if (typeof CONFIG === "undefined") {
  console.error("❌ config.js não carregado!");
}

// ===== VERIFICAÇÃO DE MODO DEMONSTRAÇÃO =====
const isModoDemo = () => CONFIG?.DEMO_MODE || false;

// ===== MOSTRAR BANNER DEMO =====
function showDemoBanner() {
  const demoWarning = document.getElementById("demoWarning");
  if (demoWarning && isModoDemo()) {
    demoWarning.style.display = "block";
  }
}

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
(function checkAuth() {
  // Pular verificação em modo demo
  if (isModoDemo()) {
    console.log("🔓 Modo demo ativo - pulando autenticação");
    return;
  }

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const currentPath = window.location.pathname;
  const fileName = currentPath.split("/").pop() || "index.html";

  // Páginas públicas
  const publicPages = ["login.html", "register.html", "index.html"];

  if (!token && !publicPages.includes(fileName)) {
    console.log("🔒 Redirecionando para login...");
    const loginPath = currentPath.includes("/pages/")
      ? "login.html"
      : "pages/login.html";
    window.location.href = loginPath;
  }
})();

// ===== FUNÇÃO DE LOGOUT =====
function logout() {
  if (confirm("Deseja realmente sair?")) {
    localStorage.clear();
    sessionStorage.clear();
    const currentPath = window.location.pathname;
    const loginPath = currentPath.includes("/pages/")
      ? "login.html"
      : "pages/login.html";
    window.location.href = loginPath;
  }
}

// ===== MOSTRAR INFORMAÇÕES DO USUÁRIO =====
function displayUserInfo() {
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user") || "{}",
  );

  const demoMode = isModoDemo();
  const userInfoElements = document.querySelectorAll(".user-info");

  userInfoElements.forEach((element) => {
    if (user.name || demoMode) {
      const userName = user.name || (demoMode ? "Usuário Demo" : "Visitante");
      const demoBadge = demoMode ? '<span class="demo-badge">DEMO</span>' : "";
      element.innerHTML = `
                <span class="user-avatar icon-user-avatar"></span>
                <span><strong>${userName}</strong>${demoBadge}</span>
                <button onclick="logout()" class="btn btn-cancel">Sair</button>
            `;
    } else {
      element.innerHTML = `
                <a href="login.html" class="btn btn-primary">Entrar</a>
            `;
    }
  });
}

// ===== FUNÇÃO PRINCIPAL DE REQUISIÇÃO =====
async function fetchWithAuth(url, options = {}) {
  // Verificar CONFIG
  if (typeof CONFIG === "undefined") {
    throw new Error("Configuração não carregada");
  }

  // MODO DEMO - retorna dados mock
  if (isModoDemo()) {
    return handleDemoRequest(url, options);
  }

  // MODO REAL - faz requisição autenticada
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    throw new Error("Não autenticado");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    console.log(`📡 Requisição: ${CONFIG.API_URL}${url}`);

    const response = await fetch(`${CONFIG.API_URL}${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "login.html";
      throw new Error("Sessão expirada");
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("⏱️ Tempo limite excedido. Verifique sua conexão.");
    }

    console.error("❌ Erro na requisição:", error);
    throw error;
  }
}

// ===== HANDLE DEMO REQUEST - VERSÃO UNIFICADA =====
async function handleDemoRequest(url, options = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("📦 DEMO:", options.method || "GET", url);

      // HEALTH CHECK
      if (url === "/health") {
        return resolve({
          json: () => Promise.resolve({ status: "ok", mode: "demo" }),
          ok: true,
        });
      }

      // USERS
      if (url === "/users") {
        if (options.method === "GET") {
          return resolve({
            json: () =>
              Promise.resolve({
                data: [
                  {
                    id: 1,
                    name: "Admin Demo",
                    email: "admin@demo.com",
                    createdAt: new Date().toISOString(),
                    _count: { orders: 5 },
                  },
                  {
                    id: 2,
                    name: "João Silva",
                    email: "joao@demo.com",
                    createdAt: new Date().toISOString(),
                    _count: { orders: 3 },
                  },
                  {
                    id: 3,
                    name: "Maria Santos",
                    email: "maria@demo.com",
                    createdAt: new Date().toISOString(),
                    _count: { orders: 2 },
                  },
                  {
                    id: 4,
                    name: "Pedro Oliveira",
                    email: "pedro@demo.com",
                    createdAt: new Date().toISOString(),
                    _count: { orders: 0 },
                  },
                ],
              }),
            ok: true,
          });
        }

        if (options.method === "POST") {
          const newUser = JSON.parse(options.body);
          newUser.id = Date.now();
          newUser.createdAt = new Date().toISOString();
          newUser._count = { orders: 0 };
          return resolve({
            json: () => Promise.resolve({ data: newUser }),
            ok: true,
          });
        }
      }

      // GET /users/:id
      if (
        url.match(/\/users\/\d+$/) &&
        (!options.method || options.method === "GET")
      ) {
        const id = parseInt(url.split("/")[2]);
        return resolve({
          json: () =>
            Promise.resolve({
              data: {
                id: id,
                name: "Usuário Demo",
                email: "usuario@demo.com",
                createdAt: new Date().toISOString(),
              },
            }),
          ok: true,
        });
      }

      // PUT /users/:id
      if (url.match(/\/users\/\d+$/) && options?.method === "PUT") {
        return resolve({
          json: () => Promise.resolve({ data: JSON.parse(options.body) }),
          ok: true,
        });
      }

      // DELETE /users/:id
      if (url.match(/\/users\/\d+$/) && options?.method === "DELETE") {
        return resolve({ status: 204, ok: true });
      }

      // PRODUCTS
      if (url === "/products") {
        if (options.method === "GET") {
          return resolve({
            json: () =>
              Promise.resolve({
                data: [
                  {
                    id: 1,
                    name: "Notebook Dell",
                    description: "Core i7, 16GB RAM",
                    price: 4500.0,
                    stock: 15,
                  },
                  {
                    id: 2,
                    name: "Mouse Sem Fio",
                    description: "Logitech MX Master",
                    price: 299.9,
                    stock: 42,
                  },
                  {
                    id: 3,
                    name: "Teclado Mecânico",
                    description: "Redragon Switch Blue",
                    price: 199.9,
                    stock: 8,
                  },
                  {
                    id: 4,
                    name: 'Monitor 24"',
                    description: "LG Full HD",
                    price: 899.99,
                    stock: 5,
                  },
                  {
                    id: 5,
                    name: "SSD 480GB",
                    description: "Kingston",
                    price: 279.99,
                    stock: 23,
                  },
                ],
              }),
            ok: true,
          });
        }

        if (options.method === "POST") {
          const newProduct = JSON.parse(options.body);
          newProduct.id = Date.now();
          return resolve({
            json: () => Promise.resolve({ data: newProduct }),
            ok: true,
          });
        }
      }

      // GET /products/:id
      if (
        url.match(/\/products\/\d+$/) &&
        (!options.method || options.method === "GET")
      ) {
        const id = parseInt(url.split("/")[2]);
        return resolve({
          json: () =>
            Promise.resolve({
              data: {
                id: id,
                name: "Produto Demo",
                description: "Descrição do produto demo",
                price: 99.9,
                stock: 10,
              },
            }),
          ok: true,
        });
      }

      // PUT /products/:id
      if (url.match(/\/products\/\d+$/) && options?.method === "PUT") {
        return resolve({
          json: () => Promise.resolve({ data: JSON.parse(options.body) }),
          ok: true,
        });
      }

      // DELETE /products/:id
      if (url.match(/\/products\/\d+$/) && options?.method === "DELETE") {
        return resolve({ status: 204, ok: true });
      }

      // PATCH /products/:id/stock
      if (url.match(/\/products\/\d+\/stock$/) && options?.method === "PATCH") {
        return resolve({ ok: true });
      }

      // ORDERS
      if (url === "/orders") {
        if (options.method === "GET") {
          return resolve({
            json: () =>
              Promise.resolve({
                data: [
                  {
                    id: 1001,
                    userId: 1,
                    status: "DELIVERED",
                    total: 4799.9,
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    user: { name: "Admin Demo", email: "admin@demo.com" },
                    items: [
                      {
                        product: { name: "Notebook Dell" },
                        quantity: 1,
                        price: 4500.0,
                      },
                    ],
                  },
                  {
                    id: 1002,
                    userId: 2,
                    status: "PENDING",
                    total: 499.8,
                    createdAt: new Date().toISOString(),
                    user: { name: "João Silva", email: "joao@demo.com" },
                    items: [
                      {
                        product: { name: "Mouse Sem Fio" },
                        quantity: 1,
                        price: 299.9,
                      },
                      {
                        product: { name: "Teclado Mecânico" },
                        quantity: 1,
                        price: 199.9,
                      },
                    ],
                  },
                  {
                    id: 1003,
                    userId: 3,
                    status: "SHIPPED",
                    total: 899.99,
                    createdAt: new Date(Date.now() - 172800000).toISOString(),
                    user: { name: "Maria Santos", email: "maria@demo.com" },
                    items: [
                      {
                        product: { name: 'Monitor 24"' },
                        quantity: 1,
                        price: 899.99,
                      },
                    ],
                  },
                ],
              }),
            ok: true,
          });
        }

        if (options.method === "POST") {
          const newOrder = JSON.parse(options.body);
          newOrder.id = Date.now();
          newOrder.status = "PENDING";
          newOrder.createdAt = new Date().toISOString();
          return resolve({
            json: () => Promise.resolve({ data: newOrder }),
            ok: true,
          });
        }
      }

      // GET /orders/:id
      if (
        url.match(/\/orders\/\d+$/) &&
        (!options.method || options.method === "GET")
      ) {
        const id = parseInt(url.split("/")[2]);
        return resolve({
          json: () =>
            Promise.resolve({
              data: {
                id: id,
                userId: 1,
                status: "PENDING",
                total: 1000,
                createdAt: new Date().toISOString(),
                user: { name: "Cliente Demo", email: "cliente@demo.com" },
                items: [
                  {
                    product: { name: "Produto Demo" },
                    quantity: 1,
                    price: 1000,
                  },
                ],
              },
            }),
          ok: true,
        });
      }

      // PATCH /orders/:id/status
      if (url.match(/\/orders\/\d+\/status$/) && options?.method === "PATCH") {
        return resolve({ ok: true });
      }

      // POST /orders/:id/cancel
      if (url.match(/\/orders\/\d+\/cancel$/) && options?.method === "POST") {
        return resolve({ ok: true });
      }

      // Fallback
      console.warn("⚠️ Rota não mapeada no demo:", url);
      resolve({
        json: () => Promise.resolve({ data: [] }),
        ok: true,
      });
    }, 500); // Delay para simular rede
  });
}

// ===== FUNÇÕES UTILITÁRIAS =====
function formatCurrency(value) {
  if (value === undefined || value === null) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

function showNotification(message, type = "success") {
  const icon = type === "error" ? "❌" : "✅";
  console.log(`${icon} ${message}`);
  alert(`${icon} ${message}`);
}

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Mini ERP inicializado");
  console.log("📡 API URL:", CONFIG?.API_URL);
  console.log("🎮 Modo demo:", isModoDemo() ? "ATIVO" : "inativo");

  showDemoBanner();
  displayUserInfo();
});
