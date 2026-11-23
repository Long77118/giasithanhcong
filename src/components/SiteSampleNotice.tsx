'use client';

import { usePathname } from 'next/navigation';

export function SiteSampleNotice({ notice }: { notice: string }) {
  const pathname = usePathname();
  if (pathname === '/lien-he' || pathname === '/lien-he/') return null;
  return <p className="mt-4 max-w-lg rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs leading-relaxed text-slate-300">{notice}</p>;
}
