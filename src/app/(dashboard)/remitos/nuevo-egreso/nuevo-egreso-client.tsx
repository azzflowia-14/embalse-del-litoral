"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { crearRemitoEgreso, getPalletsActivos } from "@/actions/remitos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";

type PalletActivo = {
  id: string;
  lote: string;
  cantidad: number;
  estado: string;
  producto: { codigo: string; descripcion: string };
  ubicacion: { codigo: string; rack: { codigo: string } } | null;
};

export function NuevoEgresoClient({
  clientes,
  depositos,
  userId,
}: {
  clientes: { id: string; razonSocial: string }[];
  depositos: { id: string; nombre: string }[];
  userId: string;
}) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState("");
  const [depositoId, setDepositoId] = useState("");
  const [origen, setOrigen] = useState<"SAP" | "MANUAL">("MANUAL");
  const [numero, setNumero] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [pallets, setPallets] = useState<PalletActivo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (clienteId && depositoId) {
      getPalletsActivos(clienteId, depositoId).then(setPallets);
      setSelectedIds(new Set());
    } else {
      setPallets([]);
    }
  }, [clienteId, depositoId]);

  function togglePallet(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function selectAll() {
    if (selectedIds.size === pallets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pallets.map((p) => p.id)));
    }
  }

  async function handleSubmit() {
    setError("");
    if (!clienteId || !depositoId || !numero || selectedIds.size === 0) {
      setError("Completá todos los campos y seleccioná al menos un pallet");
      return;
    }

    setLoading(true);
    try {
      await crearRemitoEgreso({
        clienteId,
        depositoId,
        origen,
        numero,
        observaciones: observaciones || undefined,
        operarioId: userId,
        palletIds: Array.from(selectedIds),
      });
      router.push("/remitos");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear remito");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/remitos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nuevo remito de egreso</h1>
          <p className="text-muted-foreground">Registrar egreso de mercadería</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del remito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
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
            <div className="space-y-2">
              <Label>Depósito</Label>
              <Select value={depositoId} onValueChange={setDepositoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar depósito" />
                </SelectTrigger>
                <SelectContent>
                  {depositos.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Origen</Label>
              <Select value={origen} onValueChange={(v) => setOrigen(v as "SAP" | "MANUAL")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="SAP">SAP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Número de remito</Label>
              <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="0001-00001234" />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pallets disponibles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Seleccionar pallets a retirar</CardTitle>
            {pallets.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedIds.size} de {pallets.length} seleccionados
              </p>
            )}
          </div>
          {pallets.length > 0 && (
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedIds.size === pallets.length ? "Deseleccionar" : "Seleccionar"} todos
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!clienteId || !depositoId ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Seleccioná cliente y depósito primero
            </p>
          ) : pallets.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No hay pallets de este cliente en este depósito
              </p>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {pallets.map((p) => (
                <div
                  key={p.id}
                  onClick={() => togglePallet(p.id)}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedIds.has(p.id)
                      ? "border-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-sm">
                      <p className="font-medium">
                        {p.producto.codigo} - {p.producto.descripcion}
                      </p>
                      <p className="text-muted-foreground">Lote: {p.lote}</p>
                      <p className="text-muted-foreground">Cant: {p.cantidad}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs">
                        {p.estado}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        {p.ubicacion?.codigo}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <Link href="/remitos">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={loading || selectedIds.size === 0}>
          {loading ? "Creando..." : `Crear remito de egreso (${selectedIds.size} pallets)`}
        </Button>
      </div>
    </div>
  );
}
