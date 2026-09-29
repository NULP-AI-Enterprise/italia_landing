import Image from "next/image";

export type MediaItem = { src: string; width: number; height: number; alt?: string };

type ContentImageProps = {
  media: MediaItem;
  sizes: string;
  className?: string;
  eager?: boolean;
};

/** next/image for editor-managed media from /public/media. Missing alt = decorative. */
export function ContentImage({ media, sizes, className, eager }: ContentImageProps) {
  return (
    <Image
      className={className}
      src={media.src}
      width={media.width}
      height={media.height}
      alt={media.alt ?? ""}
      sizes={sizes}
      loading={eager ? "eager" : undefined}
    />
  );
}
