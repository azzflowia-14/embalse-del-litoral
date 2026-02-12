import { getClientes } from "@/actions/clientes";
import { getDepositos } from "@/actions/depositos";
import { getProductos } from "@/actions/productos";
import { auth } from "@/lib/auth";
import { NuevoIngresoClient } from "./nuevo-ingreso-client";

export default async function NuevoIngresoPage() {
  const session = await auth();
  const [clientes, depositos, productos] = await Promise.all([
    getClientes(),
    getDepositos(),
    getProductos(),
  ]);

  return (
    <NuevoIngresoClient
      clientes={clientes}
      depositos={depositos}
      productos={productos}
      userId={session!.user.id}
    />
  );
}
