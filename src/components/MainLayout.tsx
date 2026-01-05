'use client';

import { usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Jika di halaman login, jangan kasih padding kiri (biar full screen center)
  const isLoginPage = pathname === '/login';

  return (
    <main className={`${isLoginPage ? '' : 'lg:pl-64'} min-h-screen transition-all duration-300`}>
      {children}
    </main>
  );
}