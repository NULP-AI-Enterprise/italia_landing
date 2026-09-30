import { getMediaFile } from "@/server/content";

/** Images uploaded in the admin panel. The id never changes, so the file is cached for a year. */
export async function GET(_request: Request, context: RouteContext<"/media/uploads/[file]">) {
  const { file } = await context.params;
  const match = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.webp$/.exec(file);
  const media = match ? await getMediaFile(match[1]) : null;
  if (!media) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
