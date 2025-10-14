import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sample - サブスクリプション型SaaS',
  description: 'チームでの効率的なプロジェクト管理を実現するサブスクリプション型SaaSサービス',
};

export default function Page() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Geometric background patterns */}
        <div className="absolute inset-0">
          <svg
            className="absolute h-full w-full"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="grad1" cx="50%" cy="50%" r="50%">
                <stop
                  offset="0%"
                  style={{ stopColor: 'rgba(59, 130, 246, 0.3)', stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: 'rgba(59, 130, 246, 0)', stopOpacity: 0 }}
                />
              </radialGradient>
              <radialGradient id="grad2" cx="50%" cy="50%" r="40%">
                <stop
                  offset="0%"
                  style={{ stopColor: 'rgba(147, 51, 234, 0.2)', stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: 'rgba(147, 51, 234, 0)', stopOpacity: 0 }}
                />
              </radialGradient>
            </defs>
            <circle cx="200" cy="300" r="300" fill="url(#grad1)" className="animate-pulse" />
            <circle
              cx="800"
              cy="200"
              r="250"
              fill="url(#grad2)"
              className="animate-bounce-subtle"
            />
            <circle
              cx="600"
              cy="700"
              r="200"
              fill="url(#grad1)"
              className="animate-pulse"
              style={{ animationDelay: '1s' }}
            />
          </svg>
        </div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          ></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-2 w-2 animate-ping rounded-full bg-blue-400"></div>
          <div className="absolute right-1/3 top-1/3 h-1 w-1 animate-pulse rounded-full bg-purple-400"></div>
          <div className="absolute bottom-1/3 left-1/3 h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"></div>
          <div
            className="absolute right-1/4 top-2/3 h-1 w-1 animate-ping rounded-full bg-blue-300"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="animate-fade-in space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Sample
                </span>
              </h1>
              <p className="mx-auto max-w-4xl text-xl leading-relaxed text-blue-100 md:text-2xl">
                サブキャッチコピーで製品の価値を説明します
                <br />
                <strong className="text-white">今すぐ始めましょう</strong>
              </p>
            </div>

            <div className="pt-8">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="border-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-12 py-4 text-lg text-white shadow-2xl hover:from-blue-700 hover:to-indigo-700"
                >
                  <Icons.rocket className="mr-2 h-5 w-5" />
                  無料で始める
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">主な機能</h2>
            <p className="mx-auto max-w-3xl text-xl text-blue-100">
              サービスの主要機能をご紹介します
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            <Feature
              icon={<Icons.chart className="h-8 w-8" />}
              title="データ分析"
              desc="詳細なデータ分析機能で、ビジネスの成長をサポートします"
            />
            <Feature
              icon={<Icons.users className="h-8 w-8" />}
              title="チーム管理"
              desc="効率的なチーム管理機能で、プロジェクトを円滑に進められます"
            />
            <Feature
              icon={<Icons.refresh className="h-8 w-8" />}
              title="自動同期"
              desc="リアルタイム同期機能で、常に最新の情報を共有できます"
            />
            <Feature
              icon={<Icons.smartphone className="h-8 w-8" />}
              title="モバイル対応"
              desc="スマートフォンやタブレットからもアクセス可能です"
            />
            <Feature
              icon={<Icons.shield className="h-8 w-8" />}
              title="セキュリティ"
              desc="企業レベルのセキュリティで、大切なデータを保護します"
            />
            <Feature
              icon={<Icons.rocket className="h-8 w-8" />}
              title="高速処理"
              desc="高速な処理性能で、ストレスフリーな操作を実現します"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">料金プラン</h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              ニーズに合わせて選べる2つのプラン
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
            {/* Free Plan */}
            <div className="rounded-lg border-2 border-gray-200 bg-white p-8 transition-colors hover:border-gray-300">
              <div className="mb-8">
                <h3 className="mb-2 text-2xl font-bold text-gray-900">無料プラン</h3>
                <p className="mb-6 text-gray-600">個人での利用や試用に最適</p>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">¥0</span>
                  <span className="ml-2 text-gray-500">/月</span>
                </div>
              </div>

              <ul className="mb-8 space-y-4">
                <li className="text-gray-700">• プロジェクト3個まで</li>
                <li className="text-gray-700">• チームメンバー3名まで</li>
                <li className="text-gray-700">• 基本サポート</li>
                <li className="text-gray-700">• 基本分析機能</li>
                <li className="text-gray-400">• API連携は利用不可</li>
              </ul>

              <Link href="/auth/signup">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                >
                  無料で始める
                </Button>
              </Link>

              <p className="mt-4 text-center text-sm text-gray-500">クレジットカード不要</p>
            </div>

            {/* Premium Plan */}
            <div className="relative overflow-hidden rounded-lg bg-gray-900 p-8 text-white">
              <div className="absolute right-4 top-4">
                <span className="rounded-full bg-blue-500 px-3 py-1 text-sm font-medium text-white">
                  おすすめ
                </span>
              </div>

              <div className="mb-8">
                <h3 className="mb-2 text-2xl font-bold">プレミアム</h3>
                <p className="mb-6 text-gray-300">チームでの本格運用に</p>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold">¥980</span>
                  <span className="ml-2 text-gray-400">/月</span>
                </div>
              </div>

              <ul className="mb-8 space-y-4">
                <li className="text-gray-100">• 無制限のプロジェクト</li>
                <li className="text-gray-100">• チームメンバー20名まで</li>
                <li className="text-gray-100">• 24時間優先サポート</li>
                <li className="text-gray-100">• 高度な分析機能</li>
                <li className="text-gray-100">• API連携</li>
              </ul>

              <Link href="/billing">
                <Button
                  size="lg"
                  className="w-full bg-white font-semibold text-gray-900 hover:bg-gray-100"
                >
                  今すぐ始める
                </Button>
              </Link>

              <p className="mt-4 text-center text-sm text-gray-400">いつでもキャンセル可能</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-20">
        {/* Geometric background patterns */}
        <div className="absolute inset-0">
          <svg
            className="absolute h-full w-full"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="ctaGrad1" cx="50%" cy="50%" r="50%">
                <stop
                  offset="0%"
                  style={{ stopColor: 'rgba(59, 130, 246, 0.3)', stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: 'rgba(59, 130, 246, 0)', stopOpacity: 0 }}
                />
              </radialGradient>
              <radialGradient id="ctaGrad2" cx="50%" cy="50%" r="40%">
                <stop
                  offset="0%"
                  style={{ stopColor: 'rgba(147, 51, 234, 0.2)', stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: 'rgba(147, 51, 234, 0)', stopOpacity: 0 }}
                />
              </radialGradient>
            </defs>
            <circle cx="300" cy="400" r="250" fill="url(#ctaGrad1)" className="animate-pulse" />
            <circle
              cx="700"
              cy="300"
              r="200"
              fill="url(#ctaGrad2)"
              className="animate-bounce-subtle"
            />
            <circle
              cx="500"
              cy="600"
              r="180"
              fill="url(#ctaGrad1)"
              className="animate-pulse"
              style={{ animationDelay: '1.5s' }}
            />
          </svg>
        </div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          ></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          <div className="left-1/5 absolute top-1/3 h-2 w-2 animate-ping rounded-full bg-blue-400"></div>
          <div className="absolute right-1/3 top-1/4 h-1 w-1 animate-pulse rounded-full bg-purple-400"></div>
          <div className="absolute bottom-1/4 left-1/3 h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"></div>
          <div
            className="right-1/5 absolute top-3/4 h-1 w-1 animate-ping rounded-full bg-blue-300"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">今すぐ始めませんか</h2>

            <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-blue-100">
              アカウント作成は簡単で、すぐに全ての機能をお試しいただけます。
              <br />
              まずは無料プランから始めて、必要に応じてアップグレードしてください。
            </p>

            <div className="mb-8">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-white px-10 py-4 text-lg font-semibold text-gray-900 hover:bg-gray-100"
                >
                  無料で始める
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">よくある質問</h2>
            <p className="text-xl text-gray-600">お客様からよく寄せられる質問にお答えします</p>
          </div>
          <div className="space-y-4">
            <FAQ
              q="料金はいつ請求されますか？"
              a="月額プランの場合、毎月同じ日に自動的に請求されます。"
            />
            <FAQ q="サポートはどのように受けられますか？" a="メールサポートを提供しております。" />
            <FAQ
              q="プランの変更やキャンセルはできますか？"
              a="いつでもプランの変更やキャンセルが可能です。設定画面から簡単に操作していただけます。"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group rounded-xl border border-blue-800/30 bg-blue-900/30 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-700/50 hover:bg-blue-800/40">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg transition-colors group-hover:from-blue-400 group-hover:to-indigo-500">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
      <p className="leading-relaxed text-blue-100">{desc}</p>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-soft transition-all duration-200 hover:border-blue-200 hover:shadow-medium">
      <h3 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
        <Icons.chevronDown className="mr-2 h-5 w-5 text-blue-600" />
        {q}
      </h3>
      <p className="ml-7 leading-relaxed text-gray-700">{a}</p>
    </div>
  );
}
