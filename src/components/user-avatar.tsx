import Image from "next/image";
import { cn } from "@/lib/utils";
import { userInitials } from "@/lib/user-display";

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  className?: string;
  size?: "sm" | "md";
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
};

export function UserAvatar({
  name,
  email,
  image,
  className,
  size = "sm",
}: UserAvatarProps) {
  const initials = userInitials({ name, email });

  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={36}
        height={36}
        className={cn(
          "rounded-full object-cover ring-1 ring-border",
          sizeClasses[size],
          className,
        )}
        unoptimized
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary ring-1 ring-border",
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
