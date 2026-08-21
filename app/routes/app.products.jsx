import { useEffect, useState } from "react";
import {
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Card,
  EmptyState,
  IndexTable,
  InlineStack,
  Page,
  Pagination,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getProductsPage } from "../services/products.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);

  return getProductsPage(admin, {
    after: url.searchParams.get("after"),
    before: url.searchParams.get("before"),
    query: url.searchParams.get("q"),
  });
};

const STATUS_BADGE = {
  ACTIVE: { tone: "success", label: "Activo" },
  DRAFT: { tone: "info", label: "Borrador" },
  ARCHIVED: { tone: undefined, label: "Archivado" },
};

function formatPrice({ minVariantPrice, maxVariantPrice }) {
  const format = ({ amount, currencyCode }) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currencyCode,
    }).format(Number(amount));

  return minVariantPrice.amount === maxVariantPrice.amount
    ? format(minVariantPrice)
    : `${format(minVariantPrice)} – ${format(maxVariantPrice)}`;
}

export default function ProductsPage() {
  const { products, pageInfo, totalCount } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // Búsqueda server-side con debounce: al cambiar el término se reinician
  // los cursores para volver a la primera página del resultado.
  useEffect(() => {
    const handle = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (query === current) return;
      setSearchParams(query ? { q: query } : {}, { replace: true });
    }, 400);
    return () => clearTimeout(handle);
  }, [query, searchParams, setSearchParams]);

  const paginate = (params) =>
    setSearchParams({
      ...(query ? { q: query } : {}),
      ...params,
    });

  const isLoading = navigation.state === "loading";

  return (
    <Page fullWidth>
      <TitleBar title="Productos" />
      <BlockStack gap="400">
        <Card padding="0">
          <Box padding="400">
            <TextField
              label="Buscar productos"
              labelHidden
              placeholder="Buscar por título…"
              value={query}
              onChange={setQuery}
              autoComplete="off"
              clearButton
              onClearButtonClick={() => setQuery("")}
              loading={isLoading}
            />
          </Box>
          {products.length === 0 ? (
            <EmptyState
              heading="No se encontraron productos"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>
                {searchParams.get("q")
                  ? "Prueba con otro término de búsqueda."
                  : "La tienda aún no tiene productos."}
              </p>
            </EmptyState>
          ) : (
            <IndexTable
              resourceName={{ singular: "producto", plural: "productos" }}
              itemCount={products.length}
              selectable={false}
              headings={[
                { title: "" },
                { title: "Producto" },
                { title: "Estado" },
                { title: "Inventario" },
                { title: "Tipo" },
                { title: "Proveedor" },
                { title: "Precio" },
              ]}
            >
              {products.map((product, index) => {
                const status = STATUS_BADGE[product.status] ?? {
                  label: product.status,
                };

                return (
                  <IndexTable.Row
                    id={product.id}
                    key={product.id}
                    position={index}
                  >
                    <IndexTable.Cell>
                      <Thumbnail
                        source={product.imageUrl ?? ImageIcon}
                        alt={product.imageAlt ?? product.title}
                        size="small"
                      />
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text variant="bodyMd" fontWeight="semibold" as="span">
                        {product.title}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      {product.totalInventory ?? 0} disponibles
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      {product.productType || "—"}
                    </IndexTable.Cell>
                    <IndexTable.Cell>{product.vendor || "—"}</IndexTable.Cell>
                    <IndexTable.Cell>
                      {formatPrice(product.priceRange)}
                    </IndexTable.Cell>
                  </IndexTable.Row>
                );
              })}
            </IndexTable>
          )}
          <Box padding="400" borderBlockStartWidth="025" borderColor="border">
            <InlineStack align="center">
              <Pagination
                hasPrevious={pageInfo.hasPreviousPage}
                onPrevious={() => paginate({ before: pageInfo.startCursor })}
                hasNext={pageInfo.hasNextPage}
                onNext={() => paginate({ after: pageInfo.endCursor })}
              />
            </InlineStack>
          </Box>
        </Card>
        <Text as="p" tone="subdued" alignment="center" variant="bodySm">
          {totalCount} productos en total · datos en vivo desde la Admin
          GraphQL API
        </Text>
      </BlockStack>
    </Page>
  );
}
