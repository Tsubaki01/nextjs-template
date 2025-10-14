'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/client';
import { hasAuthEnv } from '@/lib/auth/env';

function HeaderAuthed() {
  const auth = useAuth();
  const user = auth.user;
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      localStorage.setItem('signing_out', '1');
    } catch {}
    // Navigate away first to avoid any page-level flashes
    router.replace('/');
    setIsDropdownOpen(false);
    try {
      await auth.signOut();
    } catch {
    } finally {
      try {
        localStorage.removeItem('signing_out');
      } catch {}
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <>
        <Link href="/auth/signin">
          <Button variant="ghost" className="rounded-lg hover:bg-blue-50 hover:text-blue-700">
            ログイン
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
            新規登録
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/dashboard">
        <Button variant="ghost" className="text-gray-700">
          ダッシュボード
        </Button>
      </Link>
      <Link href="/billing">
        <Button variant="ghost" className="text-gray-700">
          プラン
        </Button>
      </Link>
      <div className="relative ml-4" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-soft">
            {user?.displayName?.charAt(0)?.toUpperCase() ||
              user?.email?.charAt(0)?.toUpperCase() ||
              'U'}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-900">
              {user?.displayName || user?.email?.split('@')[0] || 'ユーザー'}
            </div>
          </div>
          <Icons.chevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isDropdownOpen && (
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-strong">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Icons.logout className="mr-3 h-4 w-4" />
              ログアウト
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function Header() {
  const stackReady = hasAuthEnv();
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200/50 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-soft transition-all duration-200 group-hover:scale-105 group-hover:shadow-medium">
              <Icons.zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 transition-colors duration-200 group-hover:text-blue-600">
              Sample
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            {stackReady ? (
              <HeaderAuthed />
            ) : (
              <>
                <Link href="/contact">
                  <Button variant="ghost" className="text-gray-700">
                    お問い合わせ
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
