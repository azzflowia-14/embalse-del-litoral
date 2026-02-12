import { getUsuarios } from "@/actions/usuarios";
import { getDepositos } from "@/actions/depositos";
import { UsuariosClient } from "./usuarios-client";

export default async function UsuariosPage() {
  const [usuarios, depositos] = await Promise.all([
    getUsuarios(),
    getDepositos(),
  ]);
  return <UsuariosClient usuarios={usuarios} depositos={depositos} />;
}
