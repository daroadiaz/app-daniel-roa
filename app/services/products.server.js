const PRODUCTS_PAGE_SIZE = 100;

const PRODUCTS_QUERY = `#graphql
  query ListProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: TITLE) {
      pageInfo {
        hasNextPage
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
 * Trae TODOS los productos de la tienda paginando por cursor,
 * y los aplana a la forma que consume la UI.
 */
export async function getAllProducts(admin) {
  const products = [];
  let after = null;

  do {
    const response = await admin.graphql(PRODUCTS_QUERY, {
      variables: { first: PRODUCTS_PAGE_SIZE, after },
    });
    const { data } = await response.json();
    const { nodes, pageInfo } = data.products;

    products.push(
      ...nodes.map((node) => ({
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
    );

    after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (after);

  return products;
}
