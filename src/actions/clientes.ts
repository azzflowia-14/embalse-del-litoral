"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClientes() {
  return prisma.cliente.findMany({
    where: { activo: true },
    orderBy: { razonSocial: "asc" },
  });
}

export async function getClienteById(id: string) {
  return prisma.cliente.findUnique({ where: { id } });
}

export async function crearCliente(data: {
  razonSocial: string;
  cuit: string;
  contacto?: string;
  telefono?: string;
  email?: string;
}) {
  const cliente = await prisma.cliente.create({ data });
  revalidatePath("/clientes");
  return cliente;
}

export async function actualizarCliente(
  id: string,
  data: {
    razonSocial?: string;
    cuit?: string;
    contacto?: string;
    telefono?: string;
    email?: string;
  }
) {
  const cliente = await prisma.cliente.update({ where: { id }, data });
  revalidatePath("/clientes");
  return cliente;
}

export async function eliminarCliente(id: string) {
  await prisma.cliente.update({
    where: { id },
    data: { activo: false },
  });
  revalidatePath("/clientes");
}
