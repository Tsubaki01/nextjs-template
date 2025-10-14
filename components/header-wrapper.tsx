import { Suspense } from 'react';
import { Header } from './header';

function HeaderFallback() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b bg-white">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="text-xl font-bold"></div>
          <nav className="flex items-center gap-4">
            <div className="h-9 w-20" />
            <div className="h-9 w-20" />
          </nav>
        </div>
      </div>
    </header>
  );
}

export function HeaderWrapper() {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <Header />
    </Suspense>
  );
}
