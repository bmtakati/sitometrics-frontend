# SITOMETRICS — Frontend

React admin dashboard for SITOMETRICS, a food and beverage inventory and procurement ERP. Built with React 18, Vite, and Tailwind CSS.

## Overview

The frontend provides role-based access to:

- **Dashboard** — operational overview
- **Setup** — item categories, items, units, suppliers, stores, locales, modules, statuses
- **Procurement** — purchase requisitions, LPOs, GRNs, store requests, store issues
- **Inventory** — stock adjustments, stock count sessions
- **F&B** — menus, menu recipes, consumption posting, bar transactions
- **Users** — users, roles, permissions, password policy, role handover
- **Logs** — audit trail, application errors, failed logins
- **FAQ & support** — user guides, troubleshooting, contact support
- **Public landing page** — marketing content, login, module overview

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | React 18, Tailwind CSS, Headless UI |
| Build | Vite |
| Routing | React Router v6 |
| Charts | Recharts |
| Icons | React Icons |
| Alerts | SweetAlert2 |
| Export | ExcelJS, jsPDF, html2canvas |

## Prerequisites

- Node.js 18+ (20 recommended)
- npm 9+
- Running [backend API](../backend/README.md) on port 8000

## Installation

```bash
cd frontend
npm install
cp .env.example .env
```

Configure `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=SITOMETRICS
VITE_SHOW_LOGOUT_MODAL=true
VITE_INACTIVITY_TIMEOUT_MINUTES=30
```

## Running

```bash
# Development (http://localhost:3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Routes

| Path | Description |
|------|-------------|
| `/landing` | Public landing page |
| `/` | Dashboard (authenticated) |
| `/setup/*` | Master data and system setup |
| `/procurement/*` | Procurement and inventory workflows |
| `/users/*` | User administration |
| `/logs/*` | Audit and error logs |
| `/faq/*` | Help and documentation |
| `/reports/*` | Reports |

## Project structure

```
frontend/
├── public/
├── src/
│   ├── components/       # Layout, DataTable, FormModal, CRUDPage, etc.
│   ├── context/          # AuthContext
│   ├── hooks/            # useApiCrud and shared hooks
│   ├── pages/
│   │   ├── setup/        # Item category, item, unit, store, …
│   │   ├── procurement/  # PR, LPO, GRN, store ops, F&B
│   │   ├── logs/
│   │   └── faq/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── vite.config.js
└── tailwind.config.js
```

## UI patterns

Most setup and procurement pages use shared CRUD building blocks:

- **`CRUDPage`** — list + create/edit/delete with pagination, search, and filters
- **`DataTable`** — sortable table with actions
- **`FormModal`** — two-column modal forms
- **`PageHeader`** / **`StatsGrid`** — page title and summary cards
- **`useApiCrud`** — API list/create/update/delete hook

Component guides live under `src/components/` and `src/hooks/` (e.g. `DATATABLE_GUIDE.md`, `USEAPICRUD_GUIDE.md`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Serve production build |

## Troubleshooting

**Port in use**

```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

**API errors / CORS**

Confirm `VITE_API_BASE_URL` matches the Laravel server and that the backend is running.

**Stale dependencies**

```bash
rm -rf node_modules package-lock.json
npm install
```

## Related docs

- [Developer guide](README-react.md)
- [Quick start](QUICKSTART.md)
- [Landing page](LANDING_PAGE.md)
- [CRUD components](CRUD_COMPONENTS_GUIDE.md)
- [Backend API](../backend/README.md)

## License

MIT
