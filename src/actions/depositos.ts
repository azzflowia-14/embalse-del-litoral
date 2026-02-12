"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDepositos() {
  return prisma.deposito.findMany({
    include: {
      racks: {
        include: {
          ubicaciones: true,
        },
      },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function getDepositoById(id: string) {
  return prisma.deposito.findUnique({
    where: { id },
    include: {
      racks: {
        include: {
          ubicaciones: {
            include: {
              pallet: {
                include: {
                  producto: {
                    include: { cliente: true },
                  },
                },
              },
            },
            orderBy: [
              { fila: "asc" },
              { columna: "asc" },
              { profundidad: "asc" },
            ],
          },
        },
        orderBy: { codigo: "asc" },
      },
    },
  });
}

export async function crearDeposito(data: {
  nombre: string;
  direccion?: string;
}) {
  const deposito = await prisma.deposito.create({ data });
  revalidatePath("/depositos");
  return deposito;
}

export async function actualizarDeposito(
  id: string,
  data: { nombre?: string; direccion?: string }
) {
  const deposito = await prisma.deposito.update({ where: { id }, data });
  revalidatePath("/depositos");
  revalidatePath(`/depositos/${id}`);
  return deposito;
}

export async function crearRack(data: {
  depositoId: string;
  codigo: string;
  filas: number;
  columnas: number;
  profundidad: number;
}) {
  const { depositoId, codigo, filas, columnas, profundidad } = data;

  // Create rack and all ubicaciones in a transaction
  const rack = await prisma.$transaction(async (tx) => {
    const newRack = await tx.rack.create({
      data: { depositoId, codigo, filas, columnas, profundidad },
    });

    // Generate all ubicaciones
    const ubicaciones = [];
    for (let f = 1; f <= filas; f++) {
      for (let c = 1; c <= columnas; c++) {
        for (let p = 1; p <= profundidad; p++) {
          ubicaciones.push({
            rackId: newRack.id,
            fila: f,
            columna: c,
            profundidad: p,
            codigo: `${codigo}-F${f}-C${c}-P${p}`,
          });
        }
      }
    }

    await tx.ubicacion.createMany({ data: ubicaciones });

    // Update deposito capacity
    const totalUbicaciones = await tx.ubicacion.count({
      where: { rack: { depositoId } },
    });
    await tx.deposito.update({
      where: { id: depositoId },
      data: { capacidadTotal: totalUbicaciones },
    });

    return newRack;
  });

  revalidatePath("/depositos");
  revalidatePath(`/depositos/${data.depositoId}`);
  return rack;
}

export async function eliminarRack(rackId: string, depositoId: string) {
  await prisma.$transaction(async (tx) => {
    // Check no pallets assigned
    const occupied = await tx.ubicacion.count({
      where: { rackId, estado: "OCUPADA" },
    });
    if (occupied > 0) {
      throw new Error("No se puede eliminar un rack con pallets almacenados");
    }

    await tx.rack.delete({ where: { id: rackId } });

    const totalUbicaciones = await tx.ubicacion.count({
      where: { rack: { depositoId } },
    });
    await tx.deposito.update({
      where: { id: depositoId },
      data: { capacidadTotal: totalUbicaciones },
    });
  });

  revalidatePath("/depositos");
  revalidatePath(`/depositos/${depositoId}`);
}
