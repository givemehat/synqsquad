"use client";

import React, { useState } from "react";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 32, className = "" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initial = name.trim().charAt(0).toUpperCase() || "U";

  if (!src || imgError) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center font-medium text-xs text-[var(--text-secondary)] select-none shrink-0 ${className}`}
        aria-label={name}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full overflow-hidden border border-[var(--border-default)] bg-[var(--bg-elevated)] shrink-0 ${className}`}
    >
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
        unoptimized={!src.includes("images.unsplash.com")}
      />
    </div>
  );
}
