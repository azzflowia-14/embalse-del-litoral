"use client";

import { useState } from "react";
import Link from "next/link";
import { crearDeposito } from "@/actions/depositos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Warehouse, Eye } from "lucide-react";

type Ubicacion = {
  id: string;
  estado: string;
};

type Rack = {
  id: string;
  codigo: string;
  filas: number;
  columnas: number;
  profundidad: number;
  ubicaciones: Ubicacion[];
};

type Deposito = {
  id: string;
  nombre: string;
  direccion: string | null;
  capacidadTotal: number;
  racks: Rack[];
};

export function DepositosClient({ depositos }: { depositos: Deposito[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await crearDeposito({
      nombre: fd.get("nombre") as string,
      direccion: (fd.get("direccion") as string) || undefined,
    });
    setOpen(false);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Depósitos</h1>
          <p className="text-muted-foreground">
            Gestión de depósitos y racks
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo depósito
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo depósito</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" placeholder="Depósito Norte" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" name="direccion" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando..." : "Crear depósito"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {depositos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay depósitos configurados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {depositos.map((dep) => {
            const totalUbicaciones = dep.racks.reduce(
              (acc, r) => acc + r.ubicaciones.length, 0
            );
            const ocupadas = dep.racks.reduce(
              (acc, r) => acc + r.ubicaciones.filter((u) => u.estado === "OCUPADA").length, 0
            );
            const pct = totalUbicaciones > 0 ? Math.round((ocupadas / totalUbicaciones) * 100) : 0;

            return (
              <Card key={dep.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{dep.nombre}</CardTitle>
                    <Badge variant={pct >= 90 ? "destructive" : pct >= 70 ? "secondary" : "default"}>
                      {pct}%
                    </Badge>
                  </div>
                  {dep.direccion && (
                    <p className="text-sm text-muted-foreground">{dep.direccion}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {dep.racks.length} racks - {ocupadas}/{totalUbicaciones} posiciones
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <Link href={`/depositos/${dep.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver depósito
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
