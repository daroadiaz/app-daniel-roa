const PAGE_SIZE = 50;

const PRODUCTS_PAGE_QUERY = `#graphql
  query ProductsPage(
    $first: Int
    $last: Int
    $after: String
    $before: String
    $query: String
  ) {
    productsCount(query: $query) {
      count
    }
    products(
      first: $first
      last: $last
      after: $after
      before: $before
      query: $query
      sortKey: TITLE
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        title
        handle
        status
        vendor
        productType
        totalInventory
        featuredMedia {
          preview {
            image {
              url(transform: { maxWidth: 120, maxHeight: 120 })
              altText
            }
          }
        }
        priceRangeV2 {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

/**
 * Página de productos con paginación por cursor (50 por página), búsqueda
 * server-side y total real del catálogo. Con catálogos grandes (miles de
 * productos) esto evita el rate-limit de la Admin API y mantiene la carga
 * constante, igual que el listado nativo del admin de Shopify.
 */
export async function getProductsPage(admin, { after, before, query } = {}) {
  const variables = {
    query: query || null,
    ...(before ? { last: PAGE_SIZE, before } : { first: PAGE_SIZE, after: after || null }),
  };

  const response = await admin.graphql(PRODUCTS_PAGE_QUERY, { variables });
  const { data } = await response.json();

  return {
    totalCount: data.productsCount.count,
    pageInfo: data.products.pageInfo,
    products: data.products.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      status: node.status,
      vendor: node.vendor,
      productType: node.productType,
      totalInventory: node.totalInventory,
      imageUrl: node.featuredMedia?.preview?.image?.url ?? null,
      imageAlt: node.featuredMedia?.preview?.image?.altText ?? null,
      priceRange: node.priceRangeV2,
    })),
  };
}
