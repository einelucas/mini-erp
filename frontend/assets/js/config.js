// config.js - Configurações globais (carregado PRIMEIRO)
const CONFIG = {
  // API_URL será definida dinamicamente
  get API_URL() {
    // Se estiver no Render, usa a URL do backend
    if (window.location.hostname.includes("onrender.com")) {
      // Extrai o subdomínio do frontend para conectar ao backend
      const subdomain = window.location.hostname.split(".")[0];
      return `https://${subdomain}-backend.onrender.com/api`;
    }

    // Localhost
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:3000/api";
    }

    // Produção customizada
    return `https://${window.location.hostname}/api`;
  },

  // Timeouts
  TIMEOUT: 15000, // 15 segundos

  // Modo demo (pode ser forçado por query string)
  get DEMO_MODE() {
    return (
      sessionStorage.getItem("modo_demo") === "true" ||
      new URLSearchParams(window.location.search).has("demo")
    );
  },
};

// Não permitir modificação
Object.freeze(CONFIG);
