import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import type { Rol } from "@/generated/prisma/enums";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userRol={session.user.rol as Rol}
        userName={session.user.nombre || ""}
      />
      <main className="md:ml-64 min-h-screen">
        <div className="p-4 md:p-6 pt-14 md:pt-6">{children}</div>
      </main>
    </div>
  );
}
