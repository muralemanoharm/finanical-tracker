import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
