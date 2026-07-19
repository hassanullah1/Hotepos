import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UserForm from "../UserForm";

export default async function EditUserPage({ params }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user) notFound();
  return <UserForm user={user} />;
}
