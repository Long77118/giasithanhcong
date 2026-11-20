'use client';

import { LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function OverviewLink({ href }: { href: string }) {
  return (
    <Link className="workspace-overview-link" href={href} aria-current={usePathname() === href ? 'page' : undefined}>
      <LayoutDashboard size={17} aria-hidden />
      Tổng quan
    </Link>
  );
}
