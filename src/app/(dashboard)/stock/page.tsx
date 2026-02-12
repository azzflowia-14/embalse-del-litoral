import { prisma } from "@/lib/prisma";
import { getClientes } from "@/actions/clientes";
import { getDepositos } from "@/actions/depositos";
import { StockClient } from "./stock-client";

export default async function StockPage() {
  const [pallets, clientes, depositos] = await Promise.all([
    prisma.pallet.findMany({
      where: { activo: true },
      include: {
        producto: { include: { cliente: true } },
        ubicacion: { include: { rack: { include: { deposito: true } } } },
      },
      orderBy: { fechaIngreso: "desc" },
    }),
    getClientes(),
    getDepositos(),
  ]);

  return (
    <StockClient
      pallets={pallets}
      clientes={clientes}
      depositos={depositos}
    />
  );
}
