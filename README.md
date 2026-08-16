<div align="center">

# Mini ERP

**Sistema de gestão empresarial com autenticação, usuários, produtos, estoque, pedidos e indicadores operacionais.**

<img src="https://skillicons.dev/icons?i=js,nodejs,express,postgres,prisma,html,css,vercel&theme=dark" alt="JavaScript, Node.js, Express, PostgreSQL, Prisma, HTML, CSS e Vercel" />

</div>

## Sobre o projeto

O Mini ERP é uma aplicação full-stack criada para demonstrar a construção de um sistema de gestão do início ao fim. O frontend é uma interface estática responsiva em HTML, CSS e JavaScript; o backend disponibiliza uma API REST com Express, autenticação JWT e persistência em PostgreSQL com Prisma.

O sistema trabalha com usuários, produtos, estoque e pedidos. A criação e o cancelamento de pedidos utilizam transações para manter o estoque consistente.

## Funcionalidades

- Primeiro acesso com criação do usuário administrador
- Login e verificação de sessão por JWT
- Perfis `ADMIN` e `USER`
- Cadastro, consulta, edição e exclusão de usuários
- CRUD completo de produtos
- Entrada e saída de estoque com validação de saldo
- Criação de pedidos com vários produtos
- Atualização de status do pedido
- Cancelamento com devolução automática dos itens ao estoque
- Filtros de pedidos por usuário e status
- Dashboard com usuários, produtos, pedidos e faturamento
- Modo demonstração local com dados simulados
- Endpoint de verificação de saúde da API

## Arquitetura

```text
Navegador
   │
   ▼
Frontend estático (HTML, CSS e JavaScript)
   │  API REST + JWT
   ▼
Node.js + Express
   │
   ▼
Prisma ORM + PostgreSQL
```

```text
mini-erp/
├── backend/
│   ├── prisma/              # Schema e migrations
│   └── src/
│       ├── controllers/     # Regras de usuários, produtos e pedidos
│       ├── database/        # Cliente Prisma e conexão PostgreSQL
│       ├── middlewares/     # Autenticação, autorização, logs e erros
│       └── routes/          # Endpoints da API
└── frontend/
    ├── assets/              # Estilos, scripts e imagens
    ├── pages/               # Usuários, produtos e pedidos
    ├── index.html           # Login e primeiro acesso
    └── dashboard.html       # Indicadores do sistema
```

## Tecnologias

| Área | Tecnologias |
| --- | --- |
| Frontend | HTML5, CSS3 e JavaScript |
| Backend | Node.js e Express |
| Banco | PostgreSQL, Prisma ORM e adapter `pg` |
| Segurança | JWT, bcrypt, CORS e autorização por papel |
| Produção | Vercel no frontend e Render no backend |

## Como executar

### Requisitos

- Node.js 20 ou superior
- npm
- PostgreSQL
- Um servidor estático, como Live Server

### Backend

```bash
git clone https://github.com/einelucas/mini-erp.git
cd mini-erp/backend
npm install
```

Crie `backend/.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/mini_erp"
JWT_SECRET="substitua-por-um-segredo-longo"
JWT_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS="10"
PORT="3000"
```

Prepare o banco e inicie a API:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

A API ficará em `http://localhost:3000/api`.

### Frontend

Em outro terminal, na raiz do repositório:

```bash
npx serve frontend -l 5500
```

Outra opção é abrir a pasta `frontend` com a extensão **Live Server** na porta `5500`. Acesse `http://localhost:5500`.

## Endpoints principais

| Método | Endpoint | Função |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Cria o primeiro administrador |
| `POST` | `/api/auth/login` | Autentica e retorna o JWT |
| `GET` | `/api/auth/verify` | Valida a sessão atual |
| `GET/POST` | `/api/users` | Lista ou cria usuários |
| `GET/PUT/DELETE` | `/api/users/:id` | Consulta, atualiza ou remove usuário |
| `GET/POST` | `/api/products` | Lista ou cria produtos |
| `GET/PUT/DELETE` | `/api/products/:id` | Gerencia um produto |
| `PATCH` | `/api/products/:id/stock` | Atualiza o estoque |
| `GET/POST` | `/api/orders` | Lista ou cria pedidos |
| `PATCH` | `/api/orders/:id/status` | Atualiza o status |
| `POST` | `/api/orders/:id/cancel` | Cancela e restaura o estoque |
| `GET` | `/api/health` | Verifica a disponibilidade da API |

Todas as rotas de usuários, produtos e pedidos exigem `Authorization: Bearer <token>`.

## Regras importantes

- Apenas o primeiro cadastro feito em `/api/auth/register` é permitido; ele recebe o papel `ADMIN`.
- Novos usuários são criados por um administrador.
- Um usuário comum pode consultar ou alterar apenas o próprio cadastro.
- Produtos vinculados a pedidos não podem ser excluídos.
- Um pedido reduz o estoque dentro de uma transação.
- Cancelar um pedido restaura as quantidades, também dentro de uma transação.

## Deploy configurado

- Frontend: [mini-erp-henna.vercel.app](https://mini-erp-henna.vercel.app/)
- Backend: [mini-erp-98tn.onrender.com](https://mini-erp-98tn.onrender.com/api/health)

O arquivo `frontend/assets/js/config.js` seleciona automaticamente a API local ou a API publicada conforme o domínio acessado.
