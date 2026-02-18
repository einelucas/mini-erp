// ===== script.js - VERSÃO CORRIGIDA =====

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

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const currentPath = window.location.pathname;
  const fileName = currentPath.split("/").pop() || "index.html";

  // Páginas públicas (SÓ index.html na raiz)
  const publicPages = ["index.html"];

  // Se está em página pública
  if (publicPages.includes(fileName)) {
    // Se tem token e está no index, redirecionar para dashboard
    if (token && fileName === "index.html") {
      console.log("🔄 Já logado, redirecionando para dashboard...");
      window.location.href = "/dashboard.html";
    }
    return;
  }

  // Se NÃO está em página pública e NÃO tem token
  if (!token) {
    console.log("🔒 Redirecionando para index.html na raiz...");
    window.location.href = "/index.html";
  }
})();

// ===== FUNÇÃO DE LOGOUT CORRIGIDA =====
function logout() {
  if (confirm("Deseja realmente sair?")) {
    console.log("🔓 Fazendo logout...");

    // Limpar todos os dados
    localStorage.clear();
    sessionStorage.clear();

    // Redirecionar SEMPRE para o index.html na raiz do frontend
    window.location.href = "/index.html";
  }
}

// ===== MOSTRAR INFORMAÇÕES DO USUÁRIO CORRIGIDO =====
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
      // Link para login SEMPRE apontando para index.html na raiz
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
  if (isModoDemo()) return handleDemoRequest(url, options);

  // MODO REAL
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    console.log("🔒 Token não encontrado, redirecionando para login...");
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

    if (!response.ok) {
      // Tentar obter texto de erro de forma segura
      let errorText = "";
      try {
        if (typeof response.text === "function") {
          errorText = await response.text();
        }
      } catch (e) {
        errorText = "Erro desconhecido";
      }
      console.error("❌ Resposta inválida do servidor:", errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    // Verificar se response.json é uma função
    if (typeof response.json !== "function") {
      console.error("❌ response.json não é uma função:", response);
      throw new Error("Resposta inválida do servidor");
    }

    try {
      return await response.json();
    } catch (jsonError) {
      console.error("❌ Erro ao fazer parse do JSON:", jsonError);
      throw new Error("Resposta inválida do servidor (formato JSON incorreto)");
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("⏱️ Tempo limite excedido. Verifique sua conexão.");
    }
    console.error("❌ Erro na requisição:", err);
    throw err;
  }
}

// ===== FUNÇÃO AUXILIAR PARA PEGAR JSON =====
async function fetchJson(url, options = {}) {
  return fetchWithAuth(url, options);
}

// ===== HANDLE DEMO REQUEST - VERSÃO CORRIGIDA =====
async function handleDemoRequest(url, options = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("📦 DEMO:", options.method || "GET", url);

      // HEALTH CHECK
      if (url === "/health") {
        return resolve({
          json: () => Promise.resolve({ status: "ok", mode: "demo" }),
          text: () =>
            Promise.resolve(JSON.stringify({ status: "ok", mode: "demo" })),
          ok: true,
          status: 200,
        });
      }

      // USERS
      if (url === "/users") {
        if (options.method === "GET") {
          const usersData = {
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
            json: () => Promise.resolve(usersData),
            text: () => Promise.resolve(JSON.stringify(usersData)),
            ok: true,
            status: 200,
          });
        }

        if (options.method === "POST") {
          const newUser = JSON.parse(options.body);
          newUser.id = Date.now();
          newUser.role = "USER";
          newUser.createdAt = new Date().toISOString();
          newUser._count = { orders: 0 };
          const responseData = { data: newUser };
          return resolve({
            json: () => Promise.resolve(responseData),
            text: () => Promise.resolve(JSON.stringify(responseData)),
            ok: true,
            status: 201,
          });
        }
      }

      // GET /users/:id
      if (
        url.match(/\/users\/\d+$/) &&
        (!options.method || options.method === "GET")
      ) {
        const id = parseInt(url.split("/")[2]);
        const userData = {
          data: {
            id: id,
            name: "Usuário Demo",
            email: "usuario@demo.com",
            role: "USER",
            createdAt: new Date().toISOString(),
          },
        };
        return resolve({
          json: () => Promise.resolve(userData),
          text: () => Promise.resolve(JSON.stringify(userData)),
          ok: true,
          status: 200,
        });
      }

      // PUT /users/:id
      if (url.match(/\/users\/\d+$/) && options?.method === "PUT") {
        const updatedUser = JSON.parse(options.body);
        updatedUser.id = parseInt(url.split("/")[2]);
        const responseData = { data: updatedUser };
        return resolve({
          json: () => Promise.resolve(responseData),
          text: () => Promise.resolve(JSON.stringify(responseData)),
          ok: true,
          status: 200,
        });
      }

      // DELETE /users/:id
      if (url.match(/\/users\/\d+$/) && options?.method === "DELETE") {
        return resolve({
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(""),
          ok: true,
          status: 204,
        });
      }

      // PRODUCTS
      if (url === "/products") {
        if (options.method === "GET") {
          const productsData = {
            data: [
              {
                id: 1,
                name: "Notebook Dell",
                description: "Core i7, 16GB RAM, SSD 512GB",
                price: 4500.0,
                stock: 15,
              },
              {
                id: 2,
                name: "Mouse Sem Fio",
                description: "Logitech MX Master 3",
                price: 299.9,
                stock: 42,
              },
              {
                id: 3,
                name: "Teclado Mecânico",
                description: "Redragon Switch Blue, RGB",
                price: 199.9,
                stock: 8,
              },
              {
                id: 4,
                name: 'Monitor 24"',
                description: "LG Full HD, IPS",
                price: 899.99,
                stock: 5,
              },
              {
                id: 5,
                name: "SSD 480GB",
                description: "Kingston A400",
                price: 279.99,
                stock: 23,
              },
            ],
          };
          return resolve({
            json: () => Promise.resolve(productsData),
            text: () => Promise.resolve(JSON.stringify(productsData)),
            ok: true,
            status: 200,
          });
        }

        if (options.method === "POST") {
          const newProduct = JSON.parse(options.body);
          newProduct.id = Date.now();
          const responseData = { data: newProduct };
          return resolve({
            json: () => Promise.resolve(responseData),
            text: () => Promise.resolve(JSON.stringify(responseData)),
            ok: true,
            status: 201,
          });
        }
      }

      // GET /products/:id
      if (
        url.match(/\/products\/\d+$/) &&
        (!options.method || options.method === "GET")
      ) {
        const id = parseInt(url.split("/")[2]);
        const productData = {
          data: {
            id: id,
            name: "Produto Demo",
            description: "Descrição do produto demo",
            price: 99.9,
            stock: 10,
          },
        };
        return resolve({
          json: () => Promise.resolve(productData),
          text: () => Promise.resolve(JSON.stringify(productData)),
          ok: true,
          status: 200,
        });
      }

      // PUT /products/:id
      if (url.match(/\/products\/\d+$/) && options?.method === "PUT") {
        const updatedProduct = JSON.parse(options.body);
        updatedProduct.id = parseInt(url.split("/")[2]);
        const responseData = { data: updatedProduct };
        return resolve({
          json: () => Promise.resolve(responseData),
          text: () => Promise.resolve(JSON.stringify(responseData)),
          ok: true,
          status: 200,
        });
      }

      // DELETE /products/:id
      if (url.match(/\/products\/\d+$/) && options?.method === "DELETE") {
        return resolve({
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(""),
          ok: true,
          status: 204,
        });
      }

      // PATCH /products/:id/stock
      if (url.match(/\/products\/\d+\/stock$/) && options?.method === "PATCH") {
        return resolve({
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(""),
          ok: true,
          status: 200,
        });
      }

      // ORDERS
      if (url === "/orders") {
        if (options.method === "GET") {
          const ordersData = {
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
          };
          return resolve({
            json: () => Promise.resolve(ordersData),
            text: () => Promise.resolve(JSON.stringify(ordersData)),
            ok: true,
            status: 200,
          });
        }

        if (options.method === "POST") {
          const newOrder = JSON.parse(options.body);
          newOrder.id = Date.now();
          newOrder.status = "PENDING";
          newOrder.createdAt = new Date().toISOString();
          const responseData = { data: newOrder };
          return resolve({
            json: () => Promise.resolve(responseData),
            text: () => Promise.resolve(JSON.stringify(responseData)),
            ok: true,
            status: 201,
          });
        }
      }

      // GET /orders/:id
      if (
        url.match(/\/orders\/\d+$/) &&
        (!options.method || options.method === "GET")
      ) {
        const id = parseInt(url.split("/")[2]);
        const orderData = {
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
        };
        return resolve({
          json: () => Promise.resolve(orderData),
          text: () => Promise.resolve(JSON.stringify(orderData)),
          ok: true,
          status: 200,
        });
      }

      // PATCH /orders/:id/status
      if (url.match(/\/orders\/\d+\/status$/) && options?.method === "PATCH") {
        return resolve({
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(""),
          ok: true,
          status: 200,
        });
      }

      // POST /orders/:id/cancel
      if (url.match(/\/orders\/\d+\/cancel$/) && options?.method === "POST") {
        return resolve({
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(""),
          ok: true,
          status: 200,
        });
      }

      // DASHBOARD METRICS
      if (url === "/dashboard/metrics") {
        const metricsData = {
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
          json: () => Promise.resolve(metricsData),
          text: () => Promise.resolve(JSON.stringify(metricsData)),
          ok: true,
          status: 200,
        });
      }

      // Fallback
      console.warn("⚠️ Rota não mapeada no demo:", url);
      const fallbackData = { data: [] };
      resolve({
        json: () => Promise.resolve(fallbackData),
        text: () => Promise.resolve(JSON.stringify(fallbackData)),
        ok: true,
        status: 200,
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
  console.log("📍 Estrutura: Frontend com index.html na raiz");

  showDemoBanner();
  displayUserInfo();
});
