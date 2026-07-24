'use client';

import { useState } from 'react';
import { Flower2 } from 'lucide-react';

export function ProductImage({
  src,
  alt,
  className,
}: Readonly<{
  src: string;
  alt: string;
  className?: string;
}>) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <Flower2 aria-hidden="true" />;
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
