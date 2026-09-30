import sharp from "sharp";
import { getCurrentAdmin } from "@/server/auth/session";
import { createMediaFile } from "@/server/content";

const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_SIDE = 2400;

/**
 * Image upload from the admin forms. The picture is re-encoded (never stored as
 * sent), turned upright, limited to 2400 px and saved as WebP in the database.
 */
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "Увійдіть знову." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Файл не отримано." }, { status: 400 });
  if (!ACCEPTED.has(file.type)) {
    return Response.json({ error: "Підходять JPG, PNG, WebP, AVIF або GIF." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) return Response.json({ error: "Файл більший за 15 МБ." }, { status: 413 });

  try {
    const { data, info } = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error" })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer({ resolveWithObject: true });

    const id = await createMediaFile({
      originalName: file.name.slice(0, 200),
      contentType: "image/webp",
      width: info.width,
      height: info.height,
      data,
      createdBy: admin.id,
    });
    return Response.json({ src: `/media/uploads/${id}.webp`, width: info.width, height: info.height });
  } catch (error) {
    console.error("Upload failed", error);
    return Response.json({ error: "Не вдалося прочитати зображення." }, { status: 422 });
  }
}
