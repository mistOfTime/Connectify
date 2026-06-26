"use client";

import { usePathname } from 'next/navigation';
import { AppNav } from '@/components/layout/AppNav';

export function ConditionalSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return <AppNav>{children}</AppNav>;
}
