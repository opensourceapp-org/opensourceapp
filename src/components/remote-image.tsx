import Image from "next/image";
import { shouldUseNativeImageTag } from "@/lib/media/remote-image-policy";
import { cn } from "@/lib/utils";

type RemoteImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

export function RemoteImage({
  src,
  alt,
  width,
  height,
  className,
  priority,
}: RemoteImageProps) {
  if (shouldUseNativeImageTag(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user-provided remote URLs
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
      priority={priority}
    />
  );
}
