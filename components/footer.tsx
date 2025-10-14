import Link from 'next/link';
import { Icons } from '@/components/ui/icons';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between space-y-6 md:flex-row md:space-y-0">
          {/* ブランド */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Icons.zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Sample</span>
          </div>

          {/* リンク */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/legal/terms" className="text-gray-400 transition-colors hover:text-white">
              利用規約
            </Link>
            <Link
              href="/legal/privacy"
              className="text-gray-400 transition-colors hover:text-white"
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/legal/tokushoho"
              className="text-gray-400 transition-colors hover:text-white"
            >
              特定商取引法
            </Link>
            <Link href="/contact" className="text-gray-400 transition-colors hover:text-white">
              お問い合わせ
            </Link>
          </div>

          {/* コピーライト */}
          <div className="text-sm text-gray-400">© {currentYear} 株式会社サンプル</div>
        </div>
      </div>
    </footer>
  );
}
