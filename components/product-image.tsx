"use client";

import { useState } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  fallbackIcon: string;
  gradientFrom: string;
  gradientTo: string;
}

export function ProductImage({
  src,
  alt,
  title,
  subtitle,
  fallbackIcon,
  gradientFrom,
  gradientTo,
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
      <div className={`aspect-[4/3] bg-gradient-to-br from-${gradientFrom} to-${gradientTo} relative overflow-hidden`}>
        {!imageError ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">{fallbackIcon}</div>
              <p className="text-sm text-gray-600">{title}</p>
            </div>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <h3 className="text-white font-bold text-xl mb-1">{title}</h3>
        <p className="text-white/90 text-sm">{subtitle}</p>
      </div>
    </div>
  );
}
