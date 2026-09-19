import { usersRepository } from "@/lib/repositories/usersRepository";
import { createAoe2RecsService } from "@/lib/storage";
import {
  buildObjectKey,
  sanitizeFileName,
  sanitizePathPrefix,
} from "@/lib/storage/paths";
import { auth } from "@/server/auth";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Generic file upload endpoint.
 *
 * Accepts `multipart/form-data` with:
 *   - file      (required) the file to upload
 *   - path      (optional) destination folder prefix, e.g.
 *               "tournaments/my-tournament/images". Defaults to "uploads".
 *   - fileName  (optional) explicit object name. When omitted a timestamped
 *               name is generated from the original file name to avoid
 *               overwriting existing objects.
 *
 * Returns: { success, key, fileName, fileSize }
 *
 * Auth: any authenticated user. Admins may upload to any prefix; other
 * logged-in users are restricted to the "tournaments/" subtree.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const path = (formData.get("path") as string | null) ?? "uploads";
    const fileName = formData.get("fileName") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const prefix = sanitizePathPrefix(path);

    const isAdmin = await usersRepository.isUserAdmin(session.user.id);

    const isTournamentPath =
      prefix === "tournaments" || prefix.startsWith("tournaments/");

    if (!isAdmin && !isTournamentPath) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const originalName = sanitizeFileName(file.name || "file");

    // Default to a timestamped name so uploads never silently overwrite.
    const objectName = fileName
      ? sanitizeFileName(fileName)
      : `${new Date().toISOString().replace(/[:.]/g, "-")}-${originalName}`;

    const key = buildObjectKey(path, objectName);

    const buffer = Buffer.from(await file.arrayBuffer());

    const s3Service = createAoe2RecsService();

    await s3Service.upload(key, buffer, {
      contentType: file.type || "application/octet-stream",
      metadata: {
        originalFileName: file.name,
        fileSize: file.size.toString(),
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      key,
      fileName: objectName,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
