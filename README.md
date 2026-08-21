# app-daniel-roa

App embebida de Shopify construida con **Shopify CLI** (template Remix, **JavaScript**) como prueba técnica para **Lobo**. Corre instalada en la tienda de desarrollo `daniel-roa.myshopify.com`.

## Qué hace

| Ruta | Descripción |
| --- | --- |
| `/app` | Home con un único mensaje centrado: **“¡Hola, Lobo Creaciones!”** |
| `/app/products` | Lista **todos** los productos reales de la tienda (~2.150) vía **Admin GraphQL API**, con paginación server-side por cursor, búsqueda y UI Polaris |

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

- **Listado completo con paginación por cursor**: el catálogo tiene ~2.150 productos; traerlos todos en una sola carga excedería el rate-limit de la Admin API. `getProductsPage()` pagina de a 50 con cursores (`first/after`, `last/before`), busca server-side con el parámetro `query` de la conexión `products` y reporta el total real con `productsCount` — el mismo patrón del listado nativo del admin. La capa de datos (`app/services`) queda separada de la UI.
- **Scope mínimo**: solo `read_products` — principio de menor privilegio.
- **UI**: `IndexTable` de Polaris con imagen, estado (badge), inventario, tipo, proveedor y rango de precios formateado con `Intl.NumberFormat`; búsqueda client-side y `EmptyState` para catálogo vacío o búsqueda sin resultados.
- **Sesiones**: la estrategia embebida de `shopify-app-remix` usa token exchange, por lo que el storage SQLite puede ser efímero en hosting free-tier sin romper la app.

## Tienda online (daniel-roa.myshopify.com)

Además de la app, la tienda de desarrollo quedó modernizada de punta a punta:

- **Tema Horizon** (la generación más reciente de temas de Shopify, con theme blocks, quick-add al carrito, búsqueda predictiva y CSS/JS de última generación) publicado como tema activo.
- **Homepage con branding**: announcement bar, hero "Lobo Creaciones: diseño que aúlla" y CTA "Ver catálogo" en español.
- **Colección automática "Lobo Creaciones"** (condición: vendor = Lobo Creaciones, 2.151 productos) con descripción indexable y ficha SEO propia; enlazada desde el menú principal.
- **Navegación en español**: Inicio · Catálogo · Contacto · Lobo Creaciones.
- La tienda está en modo desarrollo: se accede con la contraseña del storefront configurada en Preferences.

### Identidad visual (extraída de lobocreaciones.com)

Se escrapeó el sitio oficial de la agencia para replicar su sistema de diseño en la tienda:

| Token | Valor | Uso |
| --- | --- | --- |
| Azul noche | `#011624` | Color dominante: announcement bar, titulares, hover de botones |
| Teal | `#24677C` | Botones primarios, precios, variantes seleccionadas |
| Turquesa | `#3EC4BC` | Acentos de interacción (coincide con el logo del lobo del catálogo) |
| Fondo claro | `#F7F8F8` / blanco | Superficies |
| Tipografía títulos | **Poppins** | Headings del tema |
| Tipografía cuerpo | **DM Sans** | Texto base |

Implementación: paleta vía **Custom CSS** del tema (sobrescribiendo las variables nativas de Horizon `--color-primary-button-*`, `--color-selected-variant-*`, etc.) y tipografías desde los ajustes nativos de Typography — sin tocar el código del tema, por lo que sobrevive a actualizaciones de Horizon.

### SEO / posicionamiento

**On-page (verificado en el HTML servido):**
- `<title>` de homepage: "Lobo Creaciones — Tienda oficial | Productos artesanales y creativos" (68/70 caracteres).
- Meta descripción de 146 caracteres con propuesta de valor y CTA.
- **Open Graph completo**: `og:title`, `og:url` y `og:image` 1200×628 (imagen social oficial de la marca) para compartir en redes.
- `link rel="canonical"` correcto y JSON-LD `Organization` (Horizon agrega `Product` + `BreadcrumbList` en fichas de producto).
- Ficha SEO dedicada para la colección: título 50/70 y meta descripción 131/160, URL limpia `/collections/lobo-creaciones`.
- Contenido indexable en la colección (descripción con keywords de marca).

**Técnico:**
- `robots.txt` operativo (Shopify lo genera y expone además el endpoint UCP/MCP para agentes de compra).
- Hreflang automático y redirección por país/región activados (Markets).
- hCaptcha en formularios (evita spam que degrada señales de calidad).
- Interlinking: menú principal → colección; colección → productos; breadcrumbs del tema.

**Limitación conocida**: mientras la tienda esté en modo desarrollo (password activa), Google no puede rastrearla y `sitemap.xml` no se publica — es el comportamiento estándar de las dev stores. Todo el SEO queda configurado para ser efectivo desde el momento en que se quite la contraseña con un plan activo.

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

El servidor web corre en **Google Cloud Run** (build desde `Dockerfile`, escala a cero) con las variables `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL` y `SCOPES`:

```bash
gcloud run deploy app-daniel-roa --source . --region us-central1 --allow-unauthenticated
```

---

Desarrollado por **Daniel Roa Díaz** · da.roadiaz@gmail.com
