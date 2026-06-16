# SITOMETRICS — React Developer Guide

Technical reference for working on the SITOMETRICS frontend.

## Architecture

```
Browser → React (Vite) → REST API (Laravel /api)
                ↓
         AuthContext (JWT in localStorage)
                ↓
         Protected routes + permission checks
                ↓
         CRUDPage / custom pages → useApiCrud → fetch API
```

- **Entry:** `src/main.jsx` → `App.jsx`
- **Auth:** `src/context/AuthContext.jsx` stores JWT and user; `ProtectedRoute` guards app routes
- **Permissions:** `hasPermission(user, 'view-items')` in route definitions and components
- **API base:** `VITE_API_BASE_URL` from `.env`

## Key directories

```
src/
├── components/
│   ├── Layout/           # Shell: sidebar, header, content area
│   ├── Sidebar/          # Navigation menu
│   ├── CRUDPage/         # Generic list + modal CRUD page
│   ├── DataTable.jsx     # Table with sorting, pagination hooks
│   ├── FormModal/        # Create/edit modal (two-column layout)
│   ├── TableControls.jsx # Search + filter bar
│   ├── SearchableSelect.jsx
│   ├── PageHeader.jsx
│   └── StatsCard.jsx
├── hooks/
│   └── useApiCrud.js     # Standard list/create/update/delete/fetch
├── pages/
│   ├── setup/            # Master data CRUD pages
│   ├── procurement/      # Workflow pages (PR, LPO, GRN, …)
│   └── LandingPage.jsx   # Public site
└── utils/
    ├── permissions.js
    └── formFieldLayout.js
```

## Adding a setup CRUD page

1. Create `src/pages/setup/YourEntity.jsx` using `CRUDPage` or `SetupPageTemplate`.
2. Register the route in `App.jsx` with a permission check.
3. Add a sidebar entry in `src/components/Sidebar/Sidebar.jsx`.
4. Ensure the backend exposes matching `/api/your-entities` endpoints.

Example pattern:

```jsx
<CRUDPage
  title="Item Categories"
  apiEndpoint="/item-categories"
  permissionPrefix="item-categories"
  columns={[...]}
  formFields={[...]}
/>
```

## useApiCrud

The hook handles pagination, search, status filters (`active`, `inactive`, `trashed`), and CRUD operations.

Filter query params sent to the API:

- `status=active|inactive`
- `trashed=only` (for deleted records)
- `search=...`
- `page`, `per_page`

See [USEAPICRUD_GUIDE.md](src/hooks/USEAPICRUD_GUIDE.md).

## Styling

- **Tailwind CSS** with emerald/stone F&B theme
- **Dark mode** via `useDarkMode` hook and `localStorage`
- **Primary palette** in `tailwind.config.js` (`primary`, `success`, etc.)
- Shared layout helpers: `PageHeader`, `StatsGrid`, `DataTable`

## Vite configuration

- Dev server: port **3000** (`vite.config.js`)
- Proxies `/storage` to the Laravel backend for file previews
- `%VITE_APP_NAME%` replaced in `index.html` at build time

## Component guides

| Guide | Topic |
|-------|-------|
| [CRUD_COMPONENTS_GUIDE.md](CRUD_COMPONENTS_GUIDE.md) | CRUD page overview |
| [DATATABLE_GUIDE.md](src/components/DATATABLE_GUIDE.md) | DataTable API |
| [FORMMODAL_GUIDE.md](src/components/FormModal/FORMMODAL_GUIDE.md) | Modal forms |
| [USEAPICRUD_GUIDE.md](src/hooks/USEAPICRUD_GUIDE.md) | Data fetching hook |
| [PAGEHEADER_GUIDE.md](src/components/PAGEHEADER_GUIDE.md) | Page headers |
| [STATSCARD_GUIDE.md](src/components/STATSCARD_GUIDE.md) | Summary cards |

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Sign in at `/landing` with a seeded backend user (see [backend README](../backend/README.md)).

## Build & deploy

```bash
npm run build    # output: dist/
npm run preview  # local preview of dist/
```

Serve `dist/` with any static host. Set `VITE_API_BASE_URL` to the production API URL before building.

## Further reading

- [Frontend README](README.md)
- [Quick start](QUICKSTART.md)
- [Landing page](LANDING_PAGE.md)
