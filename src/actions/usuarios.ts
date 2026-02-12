"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type { Rol } from "@/generated/prisma/enums";

export async function getUsuarios() {
  return prisma.usuario.findMany({
    where: { activo: true },
    include: { deposito: true },
    orderBy: { nombre: "asc" },
  });
}

export async function crearUsuario(data: {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  depositoId?: string;
}) {
  const hashed = await bcrypt.hash(data.password, 10);
  const usuario = await prisma.usuario.create({
    data: { ...data, password: hashed },
  });
  revalidatePath("/admin/usuarios");
  return usuario;
}

export async function actualizarUsuario(
  id: string,
  data: {
    nombre?: string;
    email?: string;
    rol?: Rol;
    depositoId?: string | null;
    password?: string;
  }
) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  } else {
    delete updateData.password;
  }
  const usuario = await prisma.usuario.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/admin/usuarios");
  return usuario;
}

export async function eliminarUsuario(id: string) {
  await prisma.usuario.update({
    where: { id },
    data: { activo: false },
  });
  revalidatePath("/admin/usuarios");
}
