"use client";

import { useState } from "react";
import { crearProducto, actualizarProducto, eliminarProducto } from "@/actions/productos";
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
import { Plus, Pencil, Trash2, Package } from "lucide-react";

type Producto = {
  id: string;
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  clienteId: string;
  cliente: { razonSocial: string };
};

type Cliente = {
  id: string;
  razonSocial: string;
};

export function ProductosClient({
  productos,
  clientes,
}: {
  productos: Producto[];
  clientes: Cliente[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(false);
  const [clienteId, setClienteId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      codigo: fd.get("codigo") as string,
      descripcion: fd.get("descripcion") as string,
      unidadMedida: fd.get("unidadMedida") as string,
      clienteId,
    };

    if (editing) {
      await actualizarProducto(editing.id, data);
    } else {
      await crearProducto(data);
    }
    setOpen(false);
    setEditing(null);
    setClienteId("");
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await eliminarProducto(id);
  }

  function openEdit(p: Producto) {
    setEditing(p);
    setClienteId(p.clienteId);
    setOpen(true);
  }

  function openNew() {
    setEditing(null);
    setClienteId("");
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Catálogo de productos por cliente</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setClienteId(""); } }}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo producto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.razonSocial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input id="codigo" name="codigo" defaultValue={editing?.codigo ?? ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidadMedida">Unidad</Label>
                  <Input id="unidadMedida" name="unidadMedida" defaultValue={editing?.unidadMedida ?? "UN"} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input id="descripcion" name="descripcion" defaultValue={editing?.descripcion ?? ""} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !clienteId}>
                {loading ? "Guardando..." : editing ? "Actualizar" : "Crear"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {productos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay productos cargados</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.codigo}</TableCell>
                    <TableCell>{p.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.cliente.razonSocial}</Badge>
                    </TableCell>
                    <TableCell>{p.unidadMedida}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
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
      )}
    </div>
  );
}
