import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getAuthUser } from "@/lib/auth";
import { getOwnerHotelId } from "@/lib/owner-scope";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Allow hotel_owners, branch_managers, and super_admins
  const roleName = user.roles?.name;
  if (
    !roleName ||
    !["hotel_owner", "branch_manager", "super_admin"].includes(roleName)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Optionally, you could verify that branch_manager has a branch_id,
  // but since we don't need a branch for the upload, we skip that.

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WEBP or GIF images are allowed" },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image must be smaller than 5MB" },
      { status: 400 },
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extFromName = path.extname(file.name || "");
    const ext = extFromName || `.${file.type.split("/")[1]}`;
    const filename = `${crypto.randomUUID()}${ext}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "menu-items",
    );
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json(
      { url: `/uploads/menu-items/${filename}` },
      { status: 201 },
    );
  } catch (err) {
    console.error("Menu image upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
