# app-daniel-roa

App embebida de Shopify construida con **Shopify CLI** (template Remix, **JavaScript**) como prueba técnica para **Lobo**. Corre instalada en la tienda de desarrollo `daniel-roa.myshopify.com`.

## Qué hace

| Ruta | Descripción |
| --- | --- |
| `/app` | Home con un único mensaje centrado: **“¡Hola, Lobo Creaciones!”** |
| `/app/products` | Lista **todos** los productos reales de la tienda vía **Admin GraphQL API**, con paginación por cursor, búsqueda y UI Polaris |

## Stack

- **Remix** (Vite) — framework del template oficial de Shopify CLI
- **@shopify/shopify-app-remix** — autenticación embebida (token exchange / sesión OAuth)
- **Polaris** + **App Bridge** — UI nativa del admin de Shopify
- **Prisma + SQLite** — almacenamiento de sesiones
- **Admin GraphQL API 2026-10** — datos de productos

## Estructura

```
app/
├── routes/
│   ├── app._index.jsx      # Home: mensaje centrado
│   ├── app.products.jsx    # Listado de productos (loader + UI)
│   ├── app.jsx             # Layout embebido + navegación
│   ├── auth.$.jsx          # OAuth
│   └── webhooks.*.jsx      # app/uninstalled, scopes_update
├── services/
│   └── products.server.js  # Acceso a datos: pagina por cursor hasta traer todo
├── shopify.server.js       # Config del SDK de Shopify
└── db.server.js            # Cliente Prisma
```

## Decisiones técnicas

- **Traer todos los productos**: el loader de `/app/products` delega en `getAllProducts()`, que recorre `products(first: 100, after: $cursor)` hasta agotar `pageInfo.hasNextPage`. Así el listado es completo sin importar el tamaño del catálogo, y la capa de datos queda separada de la UI.
- **Scope mínimo**: solo `read_products` — principio de menor privilegio.
- **UI**: `IndexTable` de Polaris con imagen, estado (badge), inventario, tipo, proveedor y rango de precios formateado con `Intl.NumberFormat`; búsqueda client-side y `EmptyState` para catálogo vacío o búsqueda sin resultados.
- **Sesiones**: la estrategia embebida de `shopify-app-remix` usa token exchange, por lo que el storage SQLite puede ser efímero en hosting free-tier sin romper la app.

## Desarrollo local

Requisitos: Node ≥ 22.12, cuenta Shopify Partners con acceso a la app.

```bash
npm install
npm run dev        # shopify app dev: tunnel + instalación en la tienda dev
```

## Deploy

```bash
npm run deploy     # shopify app deploy: publica la versión de la app
```

El servidor web corre en Render (Docker, ver `Dockerfile`) con las variables `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL` y `SCOPES`.

---

Desarrollado por **Daniel Roa Díaz** · da.roadiaz@gmail.com
