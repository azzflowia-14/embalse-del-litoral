"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { crearRemitoIngreso, getUbicacionesLibres } from "@/actions/remitos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

type Ubicacion = {
  id: string;
  codigo: string;
  rack: { codigo: string };
};

type Linea = {
  productoId: string;
  lote: string;
  cantidad: number;
  ubicacionId: string;
  estadoPallet: "COMPLETO" | "INCOMPLETO";
};

export function NuevoIngresoClient({
  clientes,
  depositos,
  productos,
  userId,
}: {
  clientes: { id: string; razonSocial: string }[];
  depositos: { id: string; nombre: string }[];
  productos: { id: string; codigo: string; descripcion: string; clienteId: string }[];
  userId: string;
}) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState("");
  const [depositoId, setDepositoId] = useState("");
  const [origen, setOrigen] = useState<"SAP" | "MANUAL">("MANUAL");
  const [numero, setNumero] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [ubicacionesLibres, setUbicacionesLibres] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const productosCliente = productos.filter((p) => p.clienteId === clienteId);

  useEffect(() => {
    if (depositoId) {
      getUbicacionesLibres(depositoId).then(setUbicacionesLibres);
    } else {
      setUbicacionesLibres([]);
    }
  }, [depositoId]);

  // Filter out already used ubicaciones
  const ubicacionesDisponibles = ubicacionesLibres.filter(
    (u) => !lineas.some((l) => l.ubicacionId === u.id)
  );

  function addLinea() {
    setLineas([
      ...lineas,
      { productoId: "", lote: "", cantidad: 1, ubicacionId: "", estadoPallet: "COMPLETO" },
    ]);
  }

  function updateLinea(idx: number, field: keyof Linea, value: string | number) {
    const updated = [...lineas];
    (updated[idx] as Record<string, unknown>)[field] = value;
    setLineas(updated);
  }

  function removeLinea(idx: number) {
    setLineas(lineas.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    setError("");
    if (!clienteId || !depositoId || !numero || lineas.length === 0) {
      setError("Completá todos los campos y agregá al menos una línea");
      return;
    }

    const invalid = lineas.some(
      (l) => !l.productoId || !l.lote || !l.cantidad || !l.ubicacionId
    );
    if (invalid) {
      setError("Completá todos los campos de cada línea");
      return;
    }

    setLoading(true);
    try {
      await crearRemitoIngreso({
        clienteId,
        depositoId,
        origen,
        numero,
        observaciones: observaciones || undefined,
        operarioId: userId,
        lineas,
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
          <h1 className="text-2xl font-bold">Nuevo remito de ingreso</h1>
          <p className="text-muted-foreground">Registrar ingreso de mercadería</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos del remito */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del remito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={(v) => { setClienteId(v); setLineas([]); }}>
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
              <Select value={depositoId} onValueChange={(v) => { setDepositoId(v); setLineas([]); }}>
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>

            {depositoId && (
              <div className="text-sm text-muted-foreground">
                Ubicaciones disponibles: <Badge variant="outline">{ubicacionesDisponibles.length}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Líneas:</span>
              <span className="font-medium">{lineas.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total pallets:</span>
              <span className="font-medium">{lineas.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cantidad total:</span>
              <span className="font-medium">{lineas.reduce((a, l) => a + (l.cantidad || 0), 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Líneas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Líneas de detalle</CardTitle>
          <Button
            size="sm"
            onClick={addLinea}
            disabled={!clienteId || !depositoId || ubicacionesDisponibles.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar línea
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {!clienteId || !depositoId
                ? "Seleccioná cliente y depósito primero"
                : "Agregá líneas de detalle para el remito"}
            </p>
          ) : (
            lineas.map((linea, idx) => (
              <div key={idx} className="grid gap-3 md:grid-cols-6 items-end border-b pb-4">
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs">Producto</Label>
                  <Select value={linea.productoId} onValueChange={(v) => updateLinea(idx, "productoId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productosCliente.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.codigo} - {p.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Lote</Label>
                  <Input
                    value={linea.lote}
                    onChange={(e) => updateLinea(idx, "lote", e.target.value)}
                    placeholder="LOT-001"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={linea.cantidad}
                    onChange={(e) => updateLinea(idx, "cantidad", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ubicación</Label>
                  <Select value={linea.ubicacionId} onValueChange={(v) => updateLinea(idx, "ubicacionId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {ubicacionesDisponibles
                        .concat(linea.ubicacionId ? ubicacionesLibres.filter((u) => u.id === linea.ubicacionId) : [])
                        .filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i)
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.codigo}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Estado</Label>
                    <Select
                      value={linea.estadoPallet}
                      onValueChange={(v) => updateLinea(idx, "estadoPallet", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPLETO">Completo</SelectItem>
                        <SelectItem value="INCOMPLETO">Incompleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeLinea(idx)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <Link href="/remitos">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={loading || lineas.length === 0}>
          {loading ? "Creando..." : "Crear remito de ingreso"}
        </Button>
      </div>
    </div>
  );
}
