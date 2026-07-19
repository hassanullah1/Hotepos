import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "vehicles");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB per file
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req) {
  const formData = await req.formData().catch(() => null);
  const files = formData?.getAll("files") || [];

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const urls = [];
  for (const file of files) {
    if (!(file instanceof File)) continue;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `${file.name} exceeds the 5MB limit` }, { status: 400 });
    }

    const ext = path.extname(file.name) || "";
    const safeName = `${Date.now()}-${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, safeName), buffer);
    urls.push(`/uploads/vehicles/${safeName}`);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
