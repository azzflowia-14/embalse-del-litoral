"use client";

import { useState } from "react";
import { crearUsuario, actualizarUsuario, eliminarUsuario } from "@/actions/usuarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Rol } from "@/generated/prisma/enums";

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  depositoId: string | null;
  deposito: { nombre: string } | null;
};

type Deposito = {
  id: string;
  nombre: string;
};

const rolColors: Record<Rol, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  ENCARGADO: "bg-blue-100 text-blue-800",
  OPERARIO: "bg-green-100 text-green-800",
  AUDITOR: "bg-gray-100 text-gray-800",
};

export function UsuariosClient({
  usuarios,
  depositos,
}: {
  usuarios: Usuario[];
  depositos: Deposito[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [rol, setRol] = useState<Rol>("OPERARIO");
  const [depositoId, setDepositoId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    if (editing) {
      const data: Record<string, unknown> = {
        nombre: fd.get("nombre") as string,
        email: fd.get("email") as string,
        rol,
        depositoId: depositoId || null,
      };
      const pwd = fd.get("password") as string;
      if (pwd) data.password = pwd;
      await actualizarUsuario(editing.id, data as Parameters<typeof actualizarUsuario>[1]);
    } else {
      await crearUsuario({
        nombre: fd.get("nombre") as string,
        email: fd.get("email") as string,
        password: fd.get("password") as string,
        rol,
        depositoId: depositoId || undefined,
      });
    }
    setOpen(false);
    setEditing(null);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Desactivar este usuario?")) return;
    await eliminarUsuario(id);
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setRol(u.rol);
    setDepositoId(u.depositoId || "");
    setOpen(true);
  }

  function openNew() {
    setEditing(null);
    setRol("OPERARIO");
    setDepositoId("");
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de usuarios y roles</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" defaultValue={editing?.nombre ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editing?.email ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Contraseña {editing && "(dejar vacío para no cambiar)"}
                </Label>
                <Input id="password" name="password" type="password" required={!editing} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={rol} onValueChange={(v) => setRol(v as Rol)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="ENCARGADO">Encargado</SelectItem>
                      <SelectItem value="OPERARIO">Operario</SelectItem>
                      <SelectItem value="AUDITOR">Auditor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Depósito</Label>
                  <Select value={depositoId} onValueChange={setDepositoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {depositos.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : editing ? "Actualizar" : "Crear"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden md:table-cell">Depósito</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nombre}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge className={rolColors[u.rol]}>{u.rol}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {u.deposito?.nombre || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
