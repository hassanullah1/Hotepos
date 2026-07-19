import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProvinceForm from "../ProvinceForm";

export default async function EditProvincePage({ params }) {
  const { id } = await params;
  const province = await prisma.province.findUnique({ where: { id } });
  if (!province) notFound();
  return <ProvinceForm province={province} />;
}
