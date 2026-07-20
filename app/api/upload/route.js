// app/api/upload/route.js
import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
export async function POST(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("blob upload completed", blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Blob token error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    await del(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blob delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
