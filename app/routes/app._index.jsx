import { Text } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {
  return (
    <>
      <TitleBar title="Inicio" />
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "calc(100vh - 60px)",
        }}
      >
        <Text as="h1" variant="heading2xl">
          ¡Hola, Lobo Creaciones!
        </Text>
      </div>
    </>
  );
}
