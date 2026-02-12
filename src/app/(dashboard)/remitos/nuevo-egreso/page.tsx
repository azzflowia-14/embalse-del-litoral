import { getClientes } from "@/actions/clientes";
import { getDepositos } from "@/actions/depositos";
import { auth } from "@/lib/auth";
import { NuevoEgresoClient } from "./nuevo-egreso-client";

export default async function NuevoEgresoPage() {
  const session = await auth();
  const [clientes, depositos] = await Promise.all([
    getClientes(),
    getDepositos(),
  ]);

  return (
    <NuevoEgresoClient
      clientes={clientes}
      depositos={depositos}
      userId={session!.user.id}
    />
  );
}
