## Next.js SaaS テンプレート

Next.js 15 (App Router) + TypeScript をベースにした、日本語向けの SaaS スターターテンプレートです。認証・課金・連絡フォーム・ダッシュボードなど、SaaS の初期実装に必要な要素をひと通り含みます。

### 主な機能
- 認証: Stack Auth（メール検証/サインイン/サインアップ、認証必須ページ保護）
- 課金: Stripe（Checkout/Customer Portal/Webhook、購読状態の同期）
- データ: PostgreSQL(Neon) + Prisma（`Subscription` モデル）
- 連絡: Resend を使った問い合わせ API（簡易レート制限付き）
- セキュリティ: `/api` への CSRF 対策、保護ルートのミドルウェア
- 開発体験: Vitest/Playwright/Storybook、ESLint/Prettier、Tailwind/Shadcn UI

### 技術スタック
- 言語: TypeScript
- フレームワーク: Next.js 15（App Router, Server/Client Components）
- UI: Tailwind CSS, shadcn/ui, Radix Icons/Lucide
- 認証: Stack Auth（`@stackframe/stack`）
- DB/ORM: Neon (PostgreSQL) + Prisma
- 決済: Stripe
- メール: Resend

## ディレクトリ概要
- `app/`: App Router 配下のページ/レイアウト/ルート
  - `app/dashboard`, `app/billing`: 認証必須ページ
  - `app/auth/*`: サインアップ/サインイン/メール検証/パスワードリセット
  - `app/api/*`: Stripe/Contact/Account などの API ルート
  - `app/handler/[...stack]`: Stack Auth のハンドラ UI
- `lib/`: Stripe/Prisma/Auth などのサーバー/クライアントユーティリティ
- `prisma/`: Prisma スキーマとマイグレーション
- `components/`: UI コンポーネント
- `__tests__/`, `e2e/`: 単体/E2E テスト

## 必須/推奨環境変数

最低限、以下は本番・開発ともに設定してください。

- アプリ基礎
  - `NEXT_PUBLIC_APP_ORIGIN`（必須）: 例 `http://localhost:3002` / `https://example.com`
  - `NEXT_PUBLIC_APP_URL`（推奨）: 絶対 URL のベース（Stripe リダイレクトで使用）
- 認証（Stack Auth）
  - `NEXT_PUBLIC_STACK_PROJECT_ID`
  - `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
  - `STACK_SECRET_SERVER_KEY`
- データベース
  - `DATABASE_URL`（PostgreSQL/Neon の接続 URL）
- Stripe
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_ID`
  - `STRIPE_WEBHOOK_SECRET`（Webhook 利用時）
- 連絡/メール（Resend）
  - `RESEND_API_KEY`
  - `CONTACT_EMAIL`（任意、未設定時は `support@example.com`）
  - `SKIP_EMAIL_SEND`（任意、`true` で送信をスキップ）
  - `CONTACT_RATE_LIMIT_WINDOW_MS` / `CONTACT_RATE_LIMIT_MAX`（任意）
- アカウント削除（Neon User API を叩く場合のみ）
  - `NEON_PROJECT_ID`, `NEON_API_TOKEN`

`.env` の例:

```bash
# App
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3002
NEXT_PUBLIC_APP_URL=http://localhost:3002

# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=proj_XXXXXXXX
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=stk_pub_XXXXXXXX
STACK_SECRET_SERVER_KEY=stk_sec_XXXXXXXX

# Database (Neon)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require

# Stripe
STRIPE_SECRET_KEY=sk_live_or_test_XXXXXXXX
STRIPE_PRICE_ID=price_XXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXX

# Resend / Contact
RESEND_API_KEY=re_XXXXXXXX
CONTACT_EMAIL=support@example.com
SKIP_EMAIL_SEND=false
CONTACT_RATE_LIMIT_WINDOW_MS=60000
CONTACT_RATE_LIMIT_MAX=5

# Neon (account delete 用; 使わないなら未設定で可)
NEON_PROJECT_ID=your_neon_project_id
NEON_API_TOKEN=neon_api_token
```

> 注意: `NEXT_PUBLIC_APP_ORIGIN` はミドルウェアの CSRF チェックで厳密比較されます。`http://localhost:3002` など実行時のオリジンと一致させてください。

## セットアップ

### 前提
- Node.js >= 20
- パッケージマネージャ: pnpm 推奨（`pnpm-lock.yaml` 同梱）

### 初期化
```bash
pnpm install

# Prisma クライアント生成
pnpm dlx prisma generate

# 既存マイグレーションの適用（開発/本番）
pnpm dlx prisma migrate deploy
```

### 開発起動
```bash
pnpm dev
# => http://localhost:3002 で起動
```

## Stripe 開発メモ

Webhook をローカルで受けるには Stripe CLI を利用します。

```bash
stripe listen \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed \
  --forward-to localhost:3002/api/stripe/webhook

# 出力された Signing secret を STRIPE_WEBHOOK_SECRET に設定
```

主なエンドポイント:
- `POST /api/stripe/checkout` — Checkout セッション作成
- `POST /api/stripe/portal` — Customer Portal セッション作成（購読管理）
- `POST /api/stripe/refresh` — サブスクリプション状態の再取得
- `POST /api/stripe/sync` — Checkout 復帰時のフォールバック同期
- `POST /api/stripe/webhook` — Webhook 受信（DB 同期）
- `GET /api/stripe/subscription` — 現在の購読状態取得

DB モデルは `prisma/schema.prisma` の `Subscription` を参照してください。

## 認証（Stack Auth）

- ハンドラ/UI: `app/handler/[...stack]/page.tsx`
- クライアント/サーバー初期化: `lib/stack.ts`
- プロバイダ: `lib/auth/Provider.tsx`（Stack が未設定の場合は素通し）
- 保護ルート: `middleware.ts` で `/dashboard`, `/billing` をガード

> 非本番環境で Stack の必須変数が未設定の場合、ミドルウェアは利便性のため認証チェックをスキップします（ログに警告）。

## 連絡/メール（Resend）

- エンドポイント: `POST /api/contact`
- レート制限: `CONTACT_RATE_LIMIT_*` で調整可能
- ドメイン未検証の Resend は登録メールアドレス宛のみ送信可能です

## ミドルウェアとセキュリティ

- `/api/*` への **CSRF 対策**（`Origin`/`Referer`/`Sec-Fetch-Site` 見て same-origin のみ許可）
- `/handler/password-reset` を独自ページへ誘導
- `/dashboard`, `/billing` は認証必須

## スクリプト

`package.json` より主要なもの:

```bash
pnpm dev                 # 開発サーバー（:3002）
pnpm build && pnpm start # 本番ビルド/起動

pnpm test                # 単体テスト（Vitest）
pnpm test:e2e            # E2E テスト（Playwright）
pnpm storybook           # Storybook（:6006）

pnpm lint                # ESLint チェック
pnpm lint:fix            # 自動修正
pnpm format              # Prettier フォーマット
pnpm typecheck           # 型チェック（tsc --noEmit）
```

## ページとルーティング

- 一般ページ: `/`, `/contact`, `/legal/*`
- 認証周り: `/auth/signup`, `/auth/signin`, `/auth/email-verified`, `/auth/forgot-password`, `/auth/neon-password-reset`
- アプリ: `/dashboard`, `/billing`

## デプロイの注意

- 必須: `NEXT_PUBLIC_APP_ORIGIN` を実際のオリジン（例: `https://example.com`）に設定
- DB: `DATABASE_URL` はプラットフォームのシークレットに設定
- Stripe/Webhook: 公開 URL を用いたエンドポイントを設定し、`STRIPE_WEBHOOK_SECRET` を更新
- Stack Auth: 3 つの環境変数（Project ID/Publishable/Secret）を忘れずに

---

セットアップガイド:
https://startpack.shingoirie.com/setup-guide