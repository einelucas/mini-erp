// ===== LOGIN =====
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("errorMessage");

  errorDiv.classList.remove("show");

  try {
    // IMPORTANTE: Usar CONFIG.API_URL em vez de API_URL
    const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao fazer login");
    }

    // Sucesso no login
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));

    // Redirecionar para dashboard
    window.location.href = "dashboard.html";
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add("show");
    console.error("Erro no login:", error);
  }
});

// ===== MODO DEMONSTRAÇÃO =====
document.getElementById("testeGratis").addEventListener("click", function (e) {
  e.preventDefault();

  const usuarioDemo = {
    id: 999,
    name: "Usuário Demonstração",
    email: "demo@erp.com",
    role: "ADMIN",
  };

  const tokenDemo =
    "demo_" + Math.random().toString(36).substring(2) + Date.now();

  // Usar sessionStorage para modo demo
  sessionStorage.setItem("token", tokenDemo);
  sessionStorage.setItem("user", JSON.stringify(usuarioDemo));
  sessionStorage.setItem("modo_demo", "true");

  window.location.href = "dashboard.html";
});

// ===== PRIMEIRO ACESSO =====
document.getElementById("primeiroAcesso").addEventListener("click", openModal);

function openModal() {
  // Verificar se modal já existe
  if (document.getElementById("setupModal")) return;

  const modalHtml = `
    <div class="modal-overlay" id="setupModal">
        <div class="modal-box">
            <h2>Criar Administrador</h2>
            <form id="setupForm">
                <input type="text" id="setupName" placeholder="Nome completo" required>
                <input type="email" id="setupEmail" placeholder="E-mail" required>
                <input type="password" id="setupPassword" placeholder="Senha" required>
                <input type="password" id="setupConfirmPassword" placeholder="Confirmar senha" required>
                <div class="modal-actions">
                    <button type="button" class="modal-cancel" id="closeModal">Cancelar</button>
                    <button type="submit">Criar Administrador</button>
                </div>
            </form>
        </div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modal = document.getElementById("setupModal");

  // Fechar ao clicar fora
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  document.getElementById("closeModal").addEventListener("click", () => {
    modal.remove();
  });

  document.getElementById("setupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("setupName").value;
    const email = document.getElementById("setupEmail").value;
    const password = document.getElementById("setupPassword").value;
    const confirm = document.getElementById("setupConfirmPassword").value;

    if (password !== confirm) {
      alert("As senhas não conferem!");
      return;
    }

    if (password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      const response = await fetch(`${CONFIG.API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao criar usuário");
      }

      alert("Usuário criado com sucesso! Faça o login.");
      modal.remove();
    } catch (error) {
      alert("Erro: " + error.message);
    }
  });
}

// ===== LOGIN COM DIAGNÓSTICO =====
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  console.log("🔵 1. Evento de submit capturado");
  
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("errorMessage");

  console.log("🔵 2. Email:", email);
  console.log("🔵 3. API URL:", CONFIG.API_URL);
  
  errorDiv.classList.remove("show");

  try {
    console.log("🔵 4. Fazendo fetch para:", `${CONFIG.API_URL}/auth/login`);
    
    const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    console.log("🔵 5. Resposta recebida. Status:", response.status);
    
    const data = await response.json();
    console.log("🔵 6. Dados da resposta:", data);

    if (!response.ok) {
      throw new Error(data.message || "Erro ao fazer login");
    }

    console.log("🔵 7. Login bem-sucedido!");
    console.log("🔵 8. Token:", data.data?.token ? "✓ Recebido" : "✗ Ausente");
    console.log("🔵 9. User:", data.data?.user ? "✓ Recebido" : "✗ Ausente");

    // Sucesso no login
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));

    console.log("🔵 10. Dados salvos no localStorage");
    console.log("🔵 11. Redirecionando para dashboard.html");

    // Redirecionar para dashboard
    window.location.href = "dashboard.html";
    
  } catch (error) {
    console.error("❌ ERRO:", error);
    errorDiv.textContent = error.message;
    errorDiv.classList.add("show");
  }
});