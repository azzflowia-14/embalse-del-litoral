import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse, Building2, Package, FileText } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  const [depositos, clientes, productos, remitosHoy] = await Promise.all([
    prisma.deposito.findMany({
      include: {
        racks: {
          include: {
            ubicaciones: true,
          },
        },
      },
    }),
    prisma.cliente.count({ where: { activo: true } }),
    prisma.producto.count({ where: { activo: true } }),
    prisma.remito.count({
      where: {
        fecha: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  const stats = depositos.map((dep) => {
    const totalUbicaciones = dep.racks.reduce(
      (acc, rack) => acc + rack.ubicaciones.length,
      0
    );
    const ocupadas = dep.racks.reduce(
      (acc, rack) =>
        acc + rack.ubicaciones.filter((u) => u.estado === "OCUPADA").length,
      0
    );
    const porcentaje =
      totalUbicaciones > 0
        ? Math.round((ocupadas / totalUbicaciones) * 100)
        : 0;
    return {
      id: dep.id,
      nombre: dep.nombre,
      totalUbicaciones,
      ocupadas,
      porcentaje,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido, {session?.user?.nombre}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Depósitos</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{depositos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remitos hoy</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remitosHoy}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ocupación por depósito */}
      <Card>
        <CardHeader>
          <CardTitle>Ocupación por depósito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay depósitos configurados aún.
            </p>
          ) : (
            stats.map((dep) => (
              <div key={dep.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{dep.nombre}</span>
                  <span className="text-muted-foreground">
                    {dep.ocupadas}/{dep.totalUbicaciones} posiciones ({dep.porcentaje}%)
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      dep.porcentaje >= 90
                        ? "bg-red-500"
                        : dep.porcentaje >= 70
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    )}
                    style={{ width: `${dep.porcentaje}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
