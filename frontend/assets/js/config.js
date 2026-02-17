// config.js - Configurações globais (carregado PRIMEIRO)
const CONFIG = {
  // API_URL definida dinamicamente conforme ambiente
  get API_URL() {
    const hostname = window.location.hostname;

    // Localhost (desenvolvimento)
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3000/api";
    }

    // Frontend no Vercel → backend no Render
    if (hostname.includes("vercel.app")) {
      return "https://mini-erp-98tn.onrender.com/api"; // URL exata do backend
    }

    // Produção customizada (outros domínios)
    return `https://${hostname}/api`;
  },

  // Timeout padrão para fetch (ms)
  TIMEOUT: 15000, // 15 segundos

  get DEMO_MODE() {
    const hostname = window.location.hostname;

    // Ativar demo apenas no localhost
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return (
        sessionStorage.getItem("modo_demo") === "true" ||
        new URLSearchParams(window.location.search).has("demo")
      );
    }

    // Em produção, nunca ativa demo
    return false;
  },
};

// Impedir alterações acidentais
Object.freeze(CONFIG);
