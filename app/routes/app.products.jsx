import { useMemo, useState } from "react";
import { useLoaderData } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Card,
  EmptyState,
  IndexTable,
  Page,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getAllProducts } from "../services/products.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const products = await getAllProducts(admin);

  return { products };
};

const STATUS_TONE = {
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
  const { products } = useLoaderData();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter(({ title, vendor, productType }) =>
      [title, vendor, productType].some((field) =>
        field?.toLowerCase().includes(term),
      ),
    );
  }, [products, query]);

  const resourceName = { singular: "producto", plural: "productos" };

  return (
    <Page fullWidth>
      <TitleBar title="Productos" />
      <BlockStack gap="400">
        <Card padding="0">
          <div style={{ padding: "var(--p-space-400)" }}>
            <TextField
              label="Buscar productos"
              labelHidden
              placeholder="Buscar por título, proveedor o tipo…"
              value={query}
              onChange={setQuery}
              autoComplete="off"
              clearButton
              onClearButtonClick={() => setQuery("")}
            />
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              heading="No se encontraron productos"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>
                {products.length === 0
                  ? "La tienda aún no tiene productos."
                  : "Prueba con otro término de búsqueda."}
              </p>
            </EmptyState>
          ) : (
            <IndexTable
              resourceName={resourceName}
              itemCount={filtered.length}
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
              {filtered.map((product, index) => {
                const status = STATUS_TONE[product.status] ?? {
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
                    <IndexTable.Cell>{product.productType || "—"}</IndexTable.Cell>
                    <IndexTable.Cell>{product.vendor || "—"}</IndexTable.Cell>
                    <IndexTable.Cell>
                      {formatPrice(product.priceRange)}
                    </IndexTable.Cell>
                  </IndexTable.Row>
                );
              })}
            </IndexTable>
          )}
        </Card>
        <Text as="p" tone="subdued" alignment="center" variant="bodySm">
          {filtered.length} de {products.length} productos · datos en vivo desde
          la Admin GraphQL API
        </Text>
      </BlockStack>
    </Page>
  );
}
