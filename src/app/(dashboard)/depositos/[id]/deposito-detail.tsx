"use client";

import { useState } from "react";
import { crearRack, eliminarRack } from "@/actions/depositos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Ubicacion = {
  id: string;
  fila: number;
  columna: number;
  profundidad: number;
  estado: string;
  codigo: string;
  pallet: {
    id: string;
    lote: string;
    cantidad: number;
    estado: string;
    fechaIngreso: Date;
    producto: {
      codigo: string;
      descripcion: string;
      cliente: { razonSocial: string };
    };
  } | null;
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

const estadoColors: Record<string, string> = {
  LIBRE: "bg-green-400 hover:bg-green-500",
  OCUPADA: "bg-red-400 hover:bg-red-500",
  RESERVADA: "bg-yellow-400 hover:bg-yellow-500",
};

export function DepositoDetail({ deposito }: { deposito: Deposito }) {
  const [openRack, setOpenRack] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCrearRack(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await crearRack({
      depositoId: deposito.id,
      codigo: fd.get("codigo") as string,
      filas: parseInt(fd.get("filas") as string),
      columnas: parseInt(fd.get("columnas") as string),
      profundidad: parseInt(fd.get("profundidad") as string),
    });
    setOpenRack(false);
    setLoading(false);
  }

  async function handleEliminarRack(rackId: string) {
    if (!confirm("¿Eliminar este rack y todas sus ubicaciones?")) return;
    try {
      await eliminarRack(rackId, deposito.id);
    } catch {
      alert("No se puede eliminar un rack con pallets almacenados");
    }
  }

  const totalUbicaciones = deposito.racks.reduce(
    (acc, r) => acc + r.ubicaciones.length, 0
  );
  const ocupadas = deposito.racks.reduce(
    (acc, r) => acc + r.ubicaciones.filter((u) => u.estado === "OCUPADA").length, 0
  );
  const libres = totalUbicaciones - ocupadas;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/depositos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{deposito.nombre}</h1>
          {deposito.direccion && (
            <p className="text-muted-foreground">{deposito.direccion}</p>
          )}
        </div>
        <Dialog open={openRack} onOpenChange={setOpenRack}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar rack
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo rack</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrearRack} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input id="codigo" name="codigo" placeholder="A1" required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filas">Pisos (filas)</Label>
                  <Input id="filas" name="filas" type="number" min={1} max={10} defaultValue={3} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="columnas">Columnas</Label>
                  <Input id="columnas" name="columnas" type="number" min={1} max={20} defaultValue={5} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profundidad">Profundidad</Label>
                  <Input id="profundidad" name="profundidad" type="number" min={1} max={10} defaultValue={2} required />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Se generarán automáticamente todas las ubicaciones del rack.
              </p>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando..." : "Crear rack"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{totalUbicaciones}</div>
            <p className="text-sm text-muted-foreground">Total posiciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-red-600">{ocupadas}</div>
            <p className="text-sm text-muted-foreground">Ocupadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{libres}</div>
            <p className="text-sm text-muted-foreground">Libres</p>
          </CardContent>
        </Card>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-400" />
          <span>Libre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-400" />
          <span>Ocupada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-400" />
          <span>Reservada</span>
        </div>
      </div>

      {/* Mapa de racks */}
      {deposito.racks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay racks configurados. Agregá uno para empezar.
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider>
          <div className="grid gap-6 md:grid-cols-2">
            {deposito.racks.map((rack) => (
              <RackGrid
                key={rack.id}
                rack={rack}
                onDelete={() => handleEliminarRack(rack.id)}
              />
            ))}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}

function RackGrid({ rack, onDelete }: { rack: Rack; onDelete: () => void }) {
  const ocupadas = rack.ubicaciones.filter((u) => u.estado === "OCUPADA").length;
  const total = rack.ubicaciones.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Rack {rack.codigo}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {ocupadas}/{total}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {rack.filas} pisos x {rack.columnas} col x {rack.profundidad} prof
        </p>
      </CardHeader>
      <CardContent>
        {/* Render by profundidad layers */}
        <div className="space-y-3">
          {Array.from({ length: rack.profundidad }, (_, pIdx) => {
            const p = pIdx + 1;
            return (
              <div key={p}>
                <p className="text-xs text-muted-foreground mb-1">
                  Prof. {p} {p === 1 ? "(frente)" : p === rack.profundidad ? "(fondo)" : ""}
                </p>
                <div className="flex flex-col-reverse gap-1">
                  {Array.from({ length: rack.filas }, (_, fIdx) => {
                    const f = fIdx + 1;
                    return (
                      <div key={f} className="flex gap-1 items-center">
                        <span className="text-xs text-muted-foreground w-6">P{f}</span>
                        {Array.from({ length: rack.columnas }, (_, cIdx) => {
                          const c = cIdx + 1;
                          const ub = rack.ubicaciones.find(
                            (u) => u.fila === f && u.columna === c && u.profundidad === p
                          );
                          if (!ub) return <div key={c} className="w-8 h-8" />;
                          return (
                            <Tooltip key={c}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-8 h-8 rounded cursor-pointer transition-colors border border-white/50 ${
                                    estadoColors[ub.estado] || "bg-gray-300"
                                  }`}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="text-xs space-y-1">
                                  <p className="font-medium">{ub.codigo}</p>
                                  <p>Estado: {ub.estado}</p>
                                  {ub.pallet && (
                                    <>
                                      <p>Producto: {ub.pallet.producto.descripcion}</p>
                                      <p>Cliente: {ub.pallet.producto.cliente.razonSocial}</p>
                                      <p>Lote: {ub.pallet.lote}</p>
                                      <p>Cant: {ub.pallet.cantidad} - {ub.pallet.estado}</p>
                                    </>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
