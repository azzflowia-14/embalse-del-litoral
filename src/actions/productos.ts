"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProductos() {
  return prisma.producto.findMany({
    where: { activo: true },
    include: { cliente: true },
    orderBy: { descripcion: "asc" },
  });
}

export async function getProductosByCliente(clienteId: string) {
  return prisma.producto.findMany({
    where: { clienteId, activo: true },
    orderBy: { descripcion: "asc" },
  });
}

export async function crearProducto(data: {
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  clienteId: string;
}) {
  const producto = await prisma.producto.create({ data });
  revalidatePath("/productos");
  return producto;
}

export async function actualizarProducto(
  id: string,
  data: {
    codigo?: string;
    descripcion?: string;
    unidadMedida?: string;
    clienteId?: string;
  }
) {
  const producto = await prisma.producto.update({ where: { id }, data });
  revalidatePath("/productos");
  return producto;
}

export async function eliminarProducto(id: string) {
  await prisma.producto.update({
    where: { id },
    data: { activo: false },
  });
  revalidatePath("/productos");
}
