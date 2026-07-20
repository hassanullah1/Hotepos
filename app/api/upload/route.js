// app/api/upload/route.js
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        const blob = await put(`vehicles/${Date.now()}-${file.name}`, file, {
          access: "public",
        });
        return blob.url;
      }),
    );

    return NextResponse.json({ urls: uploads });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
