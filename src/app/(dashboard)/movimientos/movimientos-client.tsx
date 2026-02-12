"use client";

import { useState, useEffect } from "react";
import { moverPallet } from "@/actions/movimientos";
import { getUbicacionesLibres } from "@/actions/remitos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeftRight, ArrowRight } from "lucide-react";

type Movimiento = {
  id: string;
  fecha: Date;
  motivo: string | null;
  pallet: {
    id: string;
    lote: string;
    producto: { codigo: string; descripcion: string };
  };
  ubicacionOrigen: { codigo: string; rack: { codigo: string } };
  ubicacionDestino: { codigo: string; rack: { codigo: string } };
  operario: { nombre: string };
};

type PalletActivo = {
  id: string;
  lote: string;
  producto: {
    codigo: string;
    descripcion: string;
    cliente: { razonSocial: string };
  };
  ubicacion: {
    id: string;
    codigo: string;
    rack: { codigo: string; depositoId: string };
  } | null;
};

type UbicacionLibre = {
  id: string;
  codigo: string;
  rack: { codigo: string };
};

export function MovimientosClient({
  movimientos,
  depositos,
  palletsActivos,
  userId,
}: {
  movimientos: Movimiento[];
  depositos: { id: string; nombre: string }[];
  palletsActivos: PalletActivo[];
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [palletId, setPalletId] = useState("");
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [ubicacionesLibres, setUbicacionesLibres] = useState<UbicacionLibre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedPallet = palletsActivos.find((p) => p.id === palletId);

  useEffect(() => {
    if (selectedPallet?.ubicacion) {
      const depositoId = selectedPallet.ubicacion.rack.depositoId;
      getUbicacionesLibres(depositoId).then(setUbicacionesLibres);
    }
  }, [palletId]);

  async function handleMover() {
    setError("");
    if (!palletId || !ubicacionDestinoId) {
      setError("Seleccioná pallet y ubicación destino");
      return;
    }
    setLoading(true);
    try {
      await moverPallet({
        palletId,
        ubicacionDestinoId,
        operarioId: userId,
        motivo: motivo || undefined,
      });
      setOpen(false);
      setPalletId("");
      setUbicacionDestinoId("");
      setMotivo("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al mover pallet");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Movimientos internos</h1>
          <p className="text-muted-foreground">Reubicar pallets dentro del depósito</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPalletId(""); setError(""); } }}>
          <DialogTrigger asChild>
            <Button>
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Mover pallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mover pallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Pallet</Label>
                <Select value={palletId} onValueChange={(v) => { setPalletId(v); setUbicacionDestinoId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar pallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {palletsActivos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.producto.codigo} - {p.lote} ({p.ubicacion?.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPallet && (
                <div className="text-sm p-3 bg-gray-50 rounded-lg space-y-1">
                  <p><span className="text-muted-foreground">Producto:</span> {selectedPallet.producto.descripcion}</p>
                  <p><span className="text-muted-foreground">Cliente:</span> {selectedPallet.producto.cliente.razonSocial}</p>
                  <p><span className="text-muted-foreground">Ubicación actual:</span> <Badge variant="outline">{selectedPallet.ubicacion?.codigo}</Badge></p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Ubicación destino</Label>
                <Select value={ubicacionDestinoId} onValueChange={setUbicacionDestinoId} disabled={!palletId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {ubicacionesLibres.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.codigo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Motivo (opcional)</Label>
                <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Reorganización, acceso, etc." />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button onClick={handleMover} className="w-full" disabled={loading || !palletId || !ubicacionDestinoId}>
                {loading ? "Moviendo..." : "Confirmar movimiento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Historial */}
      {movimientos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay movimientos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de movimientos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="hidden md:table-cell">Operario</TableHead>
                  <TableHead className="hidden md:table-cell">Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">
                      {new Date(m.fecha).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{m.pallet.producto.codigo}</span>
                    </TableCell>
                    <TableCell>{m.pallet.lote}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {m.ubicacionOrigen.codigo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {m.ubicacionDestino.codigo}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{m.operario.nombre}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {m.motivo || "-"}
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
