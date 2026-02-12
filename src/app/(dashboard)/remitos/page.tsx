import { getRemitos } from "@/actions/remitos";
import { getClientes } from "@/actions/clientes";
import { getDepositos } from "@/actions/depositos";
import { auth } from "@/lib/auth";
import { RemitosClient } from "./remitos-client";

export default async function RemitosPage() {
  const session = await auth();
  const [remitos, clientes, depositos] = await Promise.all([
    getRemitos(),
    getClientes(),
    getDepositos(),
  ]);

  return (
    <RemitosClient
      remitos={remitos}
      clientes={clientes}
      depositos={depositos}
      userId={session!.user.id}
      userRol={session!.user.rol}
    />
  );
}
