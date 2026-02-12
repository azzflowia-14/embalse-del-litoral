"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMovimientos(depositoId?: string) {
  return prisma.movimientoInterno.findMany({
    where: depositoId
      ? { ubicacionOrigen: { rack: { depositoId } } }
      : undefined,
    include: {
      pallet: { include: { producto: true } },
      ubicacionOrigen: { include: { rack: true } },
      ubicacionDestino: { include: { rack: true } },
      operario: true,
    },
    orderBy: { fecha: "desc" },
    take: 100,
  });
}

export async function moverPallet(data: {
  palletId: string;
  ubicacionDestinoId: string;
  operarioId: string;
  motivo?: string;
}) {
  await prisma.$transaction(async (tx) => {
    const pallet = await tx.pallet.findUnique({
      where: { id: data.palletId },
    });

    if (!pallet || !pallet.ubicacionId || !pallet.activo) {
      throw new Error("Pallet no encontrado o sin ubicación");
    }

    const destino = await tx.ubicacion.findUnique({
      where: { id: data.ubicacionDestinoId },
    });

    if (!destino || destino.estado !== "LIBRE") {
      throw new Error("Ubicación destino no disponible");
    }

    // Free origin
    await tx.ubicacion.update({
      where: { id: pallet.ubicacionId },
      data: { estado: "LIBRE" },
    });

    // Occupy destination
    await tx.ubicacion.update({
      where: { id: data.ubicacionDestinoId },
      data: { estado: "OCUPADA" },
    });

    // Update pallet location
    await tx.pallet.update({
      where: { id: data.palletId },
      data: { ubicacionId: data.ubicacionDestinoId },
    });

    // Record movement
    await tx.movimientoInterno.create({
      data: {
        palletId: data.palletId,
        ubicacionOrigenId: pallet.ubicacionId,
        ubicacionDestinoId: data.ubicacionDestinoId,
        operarioId: data.operarioId,
        motivo: data.motivo,
      },
    });
  });

  revalidatePath("/movimientos");
  revalidatePath("/depositos");
  revalidatePath("/stock");
}
