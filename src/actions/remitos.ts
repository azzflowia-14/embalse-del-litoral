"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getRemitos(filtros?: {
  tipo?: "INGRESO" | "EGRESO";
  clienteId?: string;
  depositoId?: string;
  estado?: "PENDIENTE" | "APROBADO" | "ANULADO";
}) {
  return prisma.remito.findMany({
    where: {
      ...(filtros?.tipo && { tipo: filtros.tipo }),
      ...(filtros?.clienteId && { clienteId: filtros.clienteId }),
      ...(filtros?.depositoId && { depositoId: filtros.depositoId }),
      ...(filtros?.estado && { estado: filtros.estado }),
    },
    include: {
      cliente: true,
      deposito: true,
      operario: true,
      encargado: true,
      detalles: {
        include: {
          producto: true,
          pallet: { include: { ubicacion: true } },
        },
      },
    },
    orderBy: { fecha: "desc" },
  });
}

export async function getRemitoById(id: string) {
  return prisma.remito.findUnique({
    where: { id },
    include: {
      cliente: true,
      deposito: true,
      operario: true,
      encargado: true,
      detalles: {
        include: {
          producto: true,
          pallet: { include: { ubicacion: true } },
        },
      },
    },
  });
}

export async function crearRemitoIngreso(data: {
  clienteId: string;
  depositoId: string;
  origen: "SAP" | "MANUAL";
  numero: string;
  observaciones?: string;
  operarioId: string;
  lineas: {
    productoId: string;
    lote: string;
    cantidad: number;
    ubicacionId: string;
    estadoPallet: "COMPLETO" | "INCOMPLETO";
  }[];
}) {
  const remito = await prisma.$transaction(async (tx) => {
    // Create remito
    const newRemito = await tx.remito.create({
      data: {
        tipo: "INGRESO",
        origen: data.origen,
        numero: data.numero,
        observaciones: data.observaciones,
        clienteId: data.clienteId,
        depositoId: data.depositoId,
        operarioId: data.operarioId,
        estado: "PENDIENTE",
      },
    });

    // Create pallets and detalles for each line
    for (const linea of data.lineas) {
      // Reserve ubicacion
      await tx.ubicacion.update({
        where: { id: linea.ubicacionId },
        data: { estado: "RESERVADA" },
      });

      // Create pallet
      const pallet = await tx.pallet.create({
        data: {
          productoId: linea.productoId,
          lote: linea.lote,
          cantidad: linea.cantidad,
          estado: linea.estadoPallet,
          ubicacionId: linea.ubicacionId,
        },
      });

      // Create detalle
      await tx.remitoDetalle.create({
        data: {
          remitoId: newRemito.id,
          productoId: linea.productoId,
          lote: linea.lote,
          cantidad: linea.cantidad,
          palletId: pallet.id,
        },
      });
    }

    return newRemito;
  });

  revalidatePath("/remitos");
  revalidatePath("/depositos");
  revalidatePath("/stock");
  revalidatePath("/");
  return remito;
}

export async function aprobarRemito(remitoId: string, encargadoId: string) {
  const remito = await prisma.remito.findUnique({
    where: { id: remitoId },
    include: { detalles: { include: { pallet: true } } },
  });

  if (!remito || remito.estado !== "PENDIENTE") {
    throw new Error("Remito no encontrado o ya procesado");
  }

  await prisma.$transaction(async (tx) => {
    // Update remito
    await tx.remito.update({
      where: { id: remitoId },
      data: { estado: "APROBADO", encargadoId },
    });

    if (remito.tipo === "INGRESO") {
      // Mark ubicaciones as OCUPADA
      for (const det of remito.detalles) {
        if (det.pallet?.ubicacionId) {
          await tx.ubicacion.update({
            where: { id: det.pallet.ubicacionId },
            data: { estado: "OCUPADA" },
          });
        }
      }
    } else {
      // EGRESO - liberate ubicaciones and deactivate pallets
      for (const det of remito.detalles) {
        if (det.pallet) {
          if (det.pallet.ubicacionId) {
            await tx.ubicacion.update({
              where: { id: det.pallet.ubicacionId },
              data: { estado: "LIBRE" },
            });
          }
          await tx.pallet.update({
            where: { id: det.pallet.id },
            data: {
              activo: false,
              fechaEgreso: new Date(),
              ubicacionId: null,
            },
          });
        }
      }
    }
  });

  revalidatePath("/remitos");
  revalidatePath(`/remitos/${remitoId}`);
  revalidatePath("/depositos");
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function anularRemito(remitoId: string) {
  const remito = await prisma.remito.findUnique({
    where: { id: remitoId },
    include: { detalles: { include: { pallet: true } } },
  });

  if (!remito || remito.estado !== "PENDIENTE") {
    throw new Error("Solo se pueden anular remitos pendientes");
  }

  await prisma.$transaction(async (tx) => {
    await tx.remito.update({
      where: { id: remitoId },
      data: { estado: "ANULADO" },
    });

    if (remito.tipo === "INGRESO") {
      // Delete pallets and free ubicaciones
      for (const det of remito.detalles) {
        if (det.pallet) {
          if (det.pallet.ubicacionId) {
            await tx.ubicacion.update({
              where: { id: det.pallet.ubicacionId },
              data: { estado: "LIBRE" },
            });
          }
          await tx.pallet.delete({ where: { id: det.pallet.id } });
        }
      }
    }
  });

  revalidatePath("/remitos");
  revalidatePath(`/remitos/${remitoId}`);
  revalidatePath("/depositos");
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function crearRemitoEgreso(data: {
  clienteId: string;
  depositoId: string;
  origen: "SAP" | "MANUAL";
  numero: string;
  observaciones?: string;
  operarioId: string;
  palletIds: string[];
}) {
  const remito = await prisma.$transaction(async (tx) => {
    const newRemito = await tx.remito.create({
      data: {
        tipo: "EGRESO",
        origen: data.origen,
        numero: data.numero,
        observaciones: data.observaciones,
        clienteId: data.clienteId,
        depositoId: data.depositoId,
        operarioId: data.operarioId,
        estado: "PENDIENTE",
      },
    });

    for (const palletId of data.palletIds) {
      const pallet = await tx.pallet.findUnique({
        where: { id: palletId },
      });
      if (!pallet) continue;

      await tx.remitoDetalle.create({
        data: {
          remitoId: newRemito.id,
          productoId: pallet.productoId,
          lote: pallet.lote,
          cantidad: pallet.cantidad,
          palletId: pallet.id,
        },
      });
    }

    return newRemito;
  });

  revalidatePath("/remitos");
  revalidatePath("/stock");
  return remito;
}

// Get ubicaciones libres de un deposito
export async function getUbicacionesLibres(depositoId: string) {
  return prisma.ubicacion.findMany({
    where: {
      estado: "LIBRE",
      rack: { depositoId },
    },
    include: { rack: true },
    orderBy: [
      { rack: { codigo: "asc" } },
      { fila: "asc" },
      { columna: "asc" },
      { profundidad: "asc" },
    ],
  });
}

// Get pallets activos de un cliente en un deposito
export async function getPalletsActivos(clienteId: string, depositoId: string) {
  return prisma.pallet.findMany({
    where: {
      activo: true,
      producto: { clienteId },
      ubicacion: { rack: { depositoId } },
    },
    include: {
      producto: true,
      ubicacion: { include: { rack: true } },
    },
    orderBy: { fechaIngreso: "desc" },
  });
}
