'use client';

import dynamic from 'next/dynamic';

const Sidebar = dynamic(
  () => import('./Sidebar').then((m) => ({ default: m.Sidebar })),
  { ssr: false }
);

export function ClientSidebar() {
  return <Sidebar />;
}
