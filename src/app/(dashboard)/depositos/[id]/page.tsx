import { getDepositoById } from "@/actions/depositos";
import { notFound } from "next/navigation";
import { DepositoDetail } from "./deposito-detail";

export default async function DepositoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deposito = await getDepositoById(id);
  if (!deposito) notFound();
  return <DepositoDetail deposito={deposito} />;
}
