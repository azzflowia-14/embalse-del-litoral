import { getDepositos } from "@/actions/depositos";
import { DepositosClient } from "./depositos-client";

export default async function DepositosPage() {
  const depositos = await getDepositos();
  return <DepositosClient depositos={depositos} />;
}
