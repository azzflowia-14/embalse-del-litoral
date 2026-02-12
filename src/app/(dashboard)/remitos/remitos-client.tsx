"use client";

import { useState } from "react";
import { aprobarRemito, anularRemito } from "@/actions/remitos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, FileText, Check, X, Eye } from "lucide-react";
import Link from "next/link";
import type { Rol } from "@/generated/prisma/enums";

type Remito = {
  id: string;
  tipo: string;
  origen: string;
  numero: string;
  fecha: Date;
  estado: string;
  observaciones: string | null;
  cliente: { razonSocial: string };
  deposito: { nombre: string };
  operario: { nombre: string };
  encargado: { nombre: string } | null;
  detalles: {
    id: string;
    lote: string;
    cantidad: number;
    producto: { codigo: string; descripcion: string };
    pallet: {
      id: string;
      estado: string;
      ubicacion: { codigo: string } | null;
    } | null;
  }[];
};

const estadoColors: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  APROBADO: "bg-green-100 text-green-800",
  ANULADO: "bg-red-100 text-red-800",
};

const tipoColors: Record<string, string> = {
  INGRESO: "bg-blue-100 text-blue-800",
  EGRESO: "bg-orange-100 text-orange-800",
};

export function RemitosClient({
  remitos,
  clientes,
  depositos,
  userId,
  userRol,
}: {
  remitos: Remito[];
  clientes: { id: string; razonSocial: string }[];
  depositos: { id: string; nombre: string }[];
  userId: string;
  userRol: Rol;
}) {
  const [filtroTipo, setFiltroTipo] = useState<string>("ALL");
  const [filtroEstado, setFiltroEstado] = useState<string>("ALL");
  const [detalle, setDetalle] = useState<Remito | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = remitos.filter((r) => {
    if (filtroTipo !== "ALL" && r.tipo !== filtroTipo) return false;
    if (filtroEstado !== "ALL" && r.estado !== filtroEstado) return false;
    return true;
  });

  async function handleAprobar(remitoId: string) {
    if (!confirm("¿Aprobar este remito?")) return;
    setLoading(true);
    await aprobarRemito(remitoId, userId);
    setDetalle(null);
    setLoading(false);
  }

  async function handleAnular(remitoId: string) {
    if (!confirm("¿Anular este remito? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    await anularRemito(remitoId);
    setDetalle(null);
    setLoading(false);
  }

  const canApprove = userRol === "ADMIN" || userRol === "ENCARGADO";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Remitos</h1>
          <p className="text-muted-foreground">Ingresos y egresos de mercadería</p>
        </div>
        <div className="flex gap-2">
          <Link href="/remitos/nuevo-ingreso">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ingreso
            </Button>
          </Link>
          <Link href="/remitos/nuevo-egreso">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Egreso
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="INGRESO">Ingreso</SelectItem>
            <SelectItem value="EGRESO">Egreso</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
            <SelectItem value="APROBADO">Aprobado</SelectItem>
            <SelectItem value="ANULADO">Anulado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay remitos</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Depósito</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-medium">{r.numero}</TableCell>
                    <TableCell>
                      <Badge className={tipoColors[r.tipo]}>{r.tipo}</Badge>
                    </TableCell>
                    <TableCell>{r.origen}</TableCell>
                    <TableCell className="hidden md:table-cell">{r.cliente.razonSocial}</TableCell>
                    <TableCell className="hidden md:table-cell">{r.deposito.nombre}</TableCell>
                    <TableCell>
                      <Badge className={estadoColors[r.estado]}>{r.estado}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(r.fecha).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setDetalle(r)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detalle dialog */}
      <Dialog open={!!detalle} onOpenChange={(v) => !v && setDetalle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Remito {detalle?.tipo} #{detalle?.numero}
            </DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>{" "}
                  <span className="font-medium">{detalle.cliente.razonSocial}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Depósito:</span>{" "}
                  <span className="font-medium">{detalle.deposito.nombre}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Origen:</span>{" "}
                  <span className="font-medium">{detalle.origen}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Operario:</span>{" "}
                  <span className="font-medium">{detalle.operario.nombre}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>{" "}
                  <Badge className={estadoColors[detalle.estado]}>{detalle.estado}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha:</span>{" "}
                  <span className="font-medium">
                    {new Date(detalle.fecha).toLocaleDateString("es-AR")}
                  </span>
                </div>
              </div>

              {detalle.observaciones && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Observaciones:</span>{" "}
                  {detalle.observaciones}
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Pallet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalle.detalles.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <span className="font-mono text-xs">{d.producto.codigo}</span>{" "}
                        {d.producto.descripcion}
                      </TableCell>
                      <TableCell>{d.lote}</TableCell>
                      <TableCell>{d.cantidad}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {d.pallet?.ubicacion?.codigo || "-"}
                      </TableCell>
                      <TableCell>
                        {d.pallet && (
                          <Badge variant="outline">{d.pallet.estado}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {detalle.estado === "PENDIENTE" && canApprove && (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => handleAnular(detalle.id)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Anular
                  </Button>
                  <Button
                    onClick={() => handleAprobar(detalle.id)}
                    disabled={loading}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprobar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
