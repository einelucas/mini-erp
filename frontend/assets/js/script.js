// ===== script.js - VERSÃO CORRIGIDA PARA PRODUÇÃO =====

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

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO CORRIGIDA =====
(function checkAuth() {
  // Pular verificação em modo demo
  if (isModoDemo()) {
    console.log("🔓 Modo demo ativo - pulando autenticação");
    return;
  }

  const currentPath = window.location.pathname;
  const fileName = currentPath.split("/").pop() || "index.html";

  // Páginas públicas
  const publicPages = ["index.html"];

  // Se está em página pública, não precisa verificar
  if (publicPages.includes(fileName)) {
    // Se tem token e está no index, redirecionar para dashboard
    setTimeout(() => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token && fileName === "index.html") {
        console.log("🔄 Já logado, redirecionando para dashboard...");
        window.location.href = "/dashboard.html";
      }
    }, 100);
    return;
  }

  // Para páginas protegidas, verificar token com retry
  setTimeout(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      console.log("🔒 Token não encontrado, redirecionando para login...");
      window.location.href = "/index.html";
    } else {
      console.log("🔓 Token encontrado, acesso permitido");
    }
  }, 100);
})();

// ===== FUNÇÃO DE LOGOUT CORRIGIDA =====
function logout() {
  if (confirm("Deseja realmente sair?")) {
    console.log("🔓 Fazendo logout...");

    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/index.html";
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
        <a href="/index.html" class="btn btn-primary">Entrar</a>
      `;
    }
  });
}

// ===== FUNÇÃO PRINCIPAL DE REQUISIÇÃO CORRIGIDA =====
async function fetchWithAuth(url, options = {}) {
  if (typeof CONFIG === "undefined")
    throw new Error("Configuração não carregada");

  // MODO DEMO - retorna dados mock
  if (isModoDemo()) {
    const demoResponse = await handleDemoRequest(url, options);
    // Garantir que a resposta tenha o formato correto
    return {
      ok: demoResponse.ok,
      status: demoResponse.status,
      json: async () => {
        if (typeof demoResponse.json === "function") {
          return demoResponse.json();
        }
        return demoResponse.data || {};
      },
      text: async () => {
        if (typeof demoResponse.text === "function") {
          return demoResponse.text();
        }
        return JSON.stringify(demoResponse.data || {});
      },
    };
  }

  // MODO REAL
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    console.log("🔒 Token não encontrado, redirecionando...");
    window.location.href = "/index.html";
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
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("⏱️ Tempo limite excedido. Verifique sua conexão.");
    }
    console.error("❌ Erro na requisição:", err);
    throw err;
  }
}

// ===== HANDLE DEMO REQUEST - VERSÃO SIMPLIFICADA =====
async function handleDemoRequest(url, options = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("📦 DEMO:", options.method || "GET", url);

      // HEALTH CHECK
      if (url === "/health") {
        return resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: "ok", mode: "demo" }),
          data: { status: "ok", mode: "demo" },
        });
      }

      // USERS
      if (url === "/users") {
        if (options.method === "GET") {
          const data = {
            data: [
              {
                id: 1,
                name: "Admin Demo",
                email: "admin@demo.com",
                role: "ADMIN",
                createdAt: new Date().toISOString(),
                _count: { orders: 5 },
              },
              {
                id: 2,
                name: "João Silva",
                email: "joao@demo.com",
                role: "USER",
                createdAt: new Date().toISOString(),
                _count: { orders: 3 },
              },
              {
                id: 3,
                name: "Maria Santos",
                email: "maria@demo.com",
                role: "USER",
                createdAt: new Date().toISOString(),
                _count: { orders: 2 },
              },
              {
                id: 4,
                name: "Pedro Oliveira",
                email: "pedro@demo.com",
                role: "USER",
                createdAt: new Date().toISOString(),
                _count: { orders: 0 },
              },
            ],
          };
          return resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(data),
            data: data,
          });
        }

        if (options.method === "POST") {
          const newUser = JSON.parse(options.body);
          newUser.id = Date.now();
          newUser.role = "USER";
          newUser.createdAt = new Date().toISOString();
          newUser._count = { orders: 0 };
          const data = { data: newUser };
          return resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve(data),
            data: data,
          });
        }
      }

      // GET /users/:id
      if (url.match(/\/users\/\d+$/)) {
        const id = parseInt(url.split("/")[2]);
        const data = {
          data: {
            id: id,
            name: "Usuário Demo",
            email: "usuario@demo.com",
            role: "USER",
            createdAt: new Date().toISOString(),
          },
        };
        return resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(data),
          data: data,
        });
      }

      // DELETE /users/:id
      if (url.match(/\/users\/\d+$/) && options?.method === "DELETE") {
        return resolve({
          ok: true,
          status: 204,
          json: () => Promise.resolve({}),
          data: {},
        });
      }

      // PRODUCTS
      if (url === "/products") {
        if (options.method === "GET") {
          const data = {
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
          };
          return resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(data),
            data: data,
          });
        }

        if (options.method === "POST") {
          const newProduct = JSON.parse(options.body);
          newProduct.id = Date.now();
          const data = { data: newProduct };
          return resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve(data),
            data: data,
          });
        }
      }

      // GET /products/:id
      if (url.match(/\/products\/\d+$/)) {
        const id = parseInt(url.split("/")[2]);
        const data = {
          data: {
            id: id,
            name: "Produto Demo",
            description: "Descrição do produto demo",
            price: 99.9,
            stock: 10,
          },
        };
        return resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(data),
          data: data,
        });
      }

      // DELETE /products/:id
      if (url.match(/\/products\/\d+$/) && options?.method === "DELETE") {
        return resolve({
          ok: true,
          status: 204,
          json: () => Promise.resolve({}),
          data: {},
        });
      }

      // PATCH /products/:id/stock
      if (url.match(/\/products\/\d+\/stock$/)) {
        return resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
          data: {},
        });
      }

      // ORDERS
      if (url === "/orders") {
        if (options.method === "GET") {
          const data = {
            data: [
              {
                id: 1001,
                userId: 1,
                status: "DELIVERED",
                total: 4799.9,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                user: { name: "Admin Demo" },
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
                user: { name: "João Silva" },
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
                user: { name: "Maria Santos" },
                items: [
                  {
                    product: { name: 'Monitor 24"' },
                    quantity: 1,
                    price: 899.99,
                  },
                ],
              },
            ],
          };
          return resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(data),
            data: data,
          });
        }

        if (options.method === "POST") {
          const newOrder = JSON.parse(options.body);
          newOrder.id = Date.now();
          newOrder.status = "PENDING";
          newOrder.createdAt = new Date().toISOString();
          const data = { data: newOrder };
          return resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve(data),
            data: data,
          });
        }
      }

      // GET /orders/:id
      if (url.match(/\/orders\/\d+$/)) {
        const id = parseInt(url.split("/")[2]);
        const data = {
          data: {
            id: id,
            userId: 1,
            status: "PENDING",
            total: 1000,
            createdAt: new Date().toISOString(),
            user: { name: "Cliente Demo", email: "cliente@demo.com" },
            items: [
              { product: { name: "Produto Demo" }, quantity: 1, price: 1000 },
            ],
          },
        };
        return resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(data),
          data: data,
        });
      }

      // PATCH /orders/:id/status
      if (url.match(/\/orders\/\d+\/status$/)) {
        return resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
          data: {},
        });
      }

      // POST /orders/:id/cancel
      if (url.match(/\/orders\/\d+\/cancel$/)) {
        return resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
          data: {},
        });
      }

      // DASHBOARD METRICS
      if (url === "/dashboard/metrics") {
        const data = {
          data: {
            totalUsers: 25,
            totalProducts: 48,
            totalOrders: 156,
            totalRevenue: 45789.9,
            recentOrders: [
              {
                id: 1001,
                total: 4799.9,
                status: "DELIVERED",
                createdAt: new Date().toISOString(),
              },
              {
                id: 1002,
                total: 499.8,
                status: "PENDING",
                createdAt: new Date().toISOString(),
              },
            ],
          },
        };
        return resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(data),
          data: data,
        });
      }

      // Fallback
      const fallbackData = { data: [] };
      resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(fallbackData),
        data: fallbackData,
      });
    }, 500);
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
