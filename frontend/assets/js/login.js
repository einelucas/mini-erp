const API_URL = "https://mini-erp-98tn.onrender.com";

// ===== LOGIN =====
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("errorMessage");

  errorDiv.classList.remove("show");

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao fazer login");
    }

    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));
    window.location.href = "../index.html";
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add("show");
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

  sessionStorage.setItem("token", tokenDemo);
  sessionStorage.setItem("user", JSON.stringify(usuarioDemo));
  sessionStorage.setItem("modo_demo", "true");

  window.location.href = "../index.html";
});

// ===== PRIMEIRO ACESSO =====
document.getElementById("primeiroAcesso").addEventListener("click", openModal);

function openModal() {
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
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao criar usuário");
      }

      alert("Usuário criado com sucesso!");
      modal.remove();
    } catch (error) {
      alert("Erro: " + error.message);
    }
  });
}
