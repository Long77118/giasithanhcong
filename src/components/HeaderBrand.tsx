import Link from 'next/link';
import { splitHeaderBrand } from '@/lib/header';

export function HeaderBrand({ name, className = '' }: { name: string; className?: string }) {
  const brand = splitHeaderBrand(name);
  return (
    <Link href="/" className={`site-wordmark ${className}`} aria-label={name}>
      {brand.prefix && <span className="site-wordmark-prefix">{brand.prefix}</span>}
      <strong>{brand.name}</strong>
    </Link>
  );
}
