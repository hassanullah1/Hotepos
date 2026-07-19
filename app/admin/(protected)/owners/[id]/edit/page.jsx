import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import OwnerForm from "../../OwnerForm";

export default async function EditOwnerPage({ params }) {
  const { id } = await params;
  const owner = await prisma.owner.findUnique({ where: { id } });

  if (!owner) notFound();

  const { password, ...safeOwner } = owner;
  return <OwnerForm owner={safeOwner} />;
}
