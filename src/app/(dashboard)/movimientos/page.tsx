import { getMovimientos } from "@/actions/movimientos";
import { getDepositos } from "@/actions/depositos";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MovimientosClient } from "./movimientos-client";

export default async function MovimientosPage() {
  const session = await auth();
  const [movimientos, depositos, palletsActivos] = await Promise.all([
    getMovimientos(),
    getDepositos(),
    prisma.pallet.findMany({
      where: { activo: true, ubicacionId: { not: null } },
      include: {
        producto: { include: { cliente: true } },
        ubicacion: { include: { rack: true } },
      },
      orderBy: { fechaIngreso: "desc" },
    }),
  ]);

  return (
    <MovimientosClient
      movimientos={movimientos}
      depositos={depositos}
      palletsActivos={palletsActivos}
      userId={session!.user.id}
    />
  );
}
