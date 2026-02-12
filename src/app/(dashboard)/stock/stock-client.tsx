"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

type Pallet = {
  id: string;
  lote: string;
  cantidad: number;
  estado: string;
  fechaIngreso: Date;
  producto: {
    codigo: string;
    descripcion: string;
    unidadMedida: string;
    cliente: { id: string; razonSocial: string };
  };
  ubicacion: {
    codigo: string;
    rack: {
      codigo: string;
      deposito: { id: string; nombre: string };
    };
  } | null;
};

export function StockClient({
  pallets,
  clientes,
  depositos,
}: {
  pallets: Pallet[];
  clientes: { id: string; razonSocial: string }[];
  depositos: { id: string; nombre: string }[];
}) {
  const [filtroCliente, setFiltroCliente] = useState("ALL");
  const [filtroDeposito, setFiltroDeposito] = useState("ALL");
  const [filtroLote, setFiltroLote] = useState("");
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  const filtered = pallets.filter((p) => {
    if (filtroCliente !== "ALL" && p.producto.cliente.id !== filtroCliente) return false;
    if (filtroDeposito !== "ALL" && p.ubicacion?.rack.deposito.id !== filtroDeposito) return false;
    if (filtroLote && !p.lote.toLowerCase().includes(filtroLote.toLowerCase())) return false;
    if (filtroBusqueda) {
      const search = filtroBusqueda.toLowerCase();
      if (
        !p.producto.codigo.toLowerCase().includes(search) &&
        !p.producto.descripcion.toLowerCase().includes(search)
      ) return false;
    }
    return true;
  });

  // Summary stats
  const totalPallets = filtered.length;
  const totalCantidad = filtered.reduce((a, p) => a + p.cantidad, 0);
  const clientesUnicos = new Set(filtered.map((p) => p.producto.cliente.id)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stock</h1>
        <p className="text-muted-foreground">Vista de toda la mercadería almacenada</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{totalPallets}</div>
            <p className="text-sm text-muted-foreground">Pallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{totalCantidad.toLocaleString("es-AR")}</div>
            <p className="text-sm text-muted-foreground">Cantidad total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{clientesUnicos}</div>
            <p className="text-sm text-muted-foreground">Clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.razonSocial}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroDeposito} onValueChange={setFiltroDeposito}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Depósito" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los depósitos</SelectItem>
            {depositos.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Buscar producto..."
          value={filtroBusqueda}
          onChange={(e) => setFiltroBusqueda(e.target.value)}
          className="w-48"
        />
        <Input
          placeholder="Filtrar por lote..."
          value={filtroLote}
          onChange={(e) => setFiltroLote(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay stock para mostrar</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="hidden md:table-cell">Depósito</TableHead>
                  <TableHead className="hidden md:table-cell">Ingreso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <span className="font-mono text-xs">{p.producto.codigo}</span>
                        <p className="text-sm">{p.producto.descripcion}</p>
                      </div>
                    </TableCell>
                    <TableCell>{p.producto.cliente.razonSocial}</TableCell>
                    <TableCell className="font-mono">{p.lote}</TableCell>
                    <TableCell>
                      {p.cantidad} {p.producto.unidadMedida}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          p.estado === "COMPLETO"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }
                      >
                        {p.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.ubicacion?.codigo || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.ubicacion?.rack.deposito.nombre || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      {new Date(p.fechaIngreso).toLocaleDateString("es-AR")}
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
