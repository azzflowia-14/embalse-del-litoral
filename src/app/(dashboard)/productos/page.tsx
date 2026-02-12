import { getProductos } from "@/actions/productos";
import { getClientes } from "@/actions/clientes";
import { ProductosClient } from "./productos-client";

export default async function ProductosPage() {
  const [productos, clientes] = await Promise.all([
    getProductos(),
    getClientes(),
  ]);
  return <ProductosClient productos={productos} clientes={clientes} />;
}
