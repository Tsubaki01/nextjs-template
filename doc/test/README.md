# テスト環境ガイド

このプロジェクトでは包括的な自動テスト環境を構築しています。

## テストツール構成

- **Vitest 3.2.4** - ユニットテスト・統合テストフレームワーク
- **@testing-library/react 16.3.0** - Reactコンポーネントテスト
- **@testing-library/user-event 14.6.1** - ユーザーインタラクションのシミュレーション
- **Storybook 9.1.10** - コンポーネントカタログとビジュアルテスト
- **Playwright 1.56.0** - E2Eテスト
- **MSW 2.11.5** - APIモック

## テストコマンド

### コードフォーマット

```bash
# すべてのファイルをフォーマット
pnpm format

# フォーマットが必要なファイルをチェックのみ（CI/CD用）
pnpm format:check
```

### Lint

```bash
# Lintチェック
pnpm lint

# Lintエラーを自動修正
pnpm lint:fix
```

### ユニットテスト・コンポーネントテスト

```bash
# テストをwatchモードで実行
pnpm test

# UIモードでテストを実行
pnpm test:ui

# 1回だけテストを実行
pnpm test:run

# カバレッジレポート付きでテストを実行
pnpm test:coverage
```

### E2Eテスト

```bash
# E2Eテストを実行
pnpm test:e2e

# UIモードでE2Eテストを実行
pnpm test:e2e:ui

# ヘッドレスモードをオフにして実行（ブラウザが表示される）
pnpm test:e2e:headed
```

### Storybook

```bash
# Storybookを起動
pnpm storybook

# Storybookをビルド
pnpm build-storybook
```

## テストファイルの配置

### ユニットテスト・コンポーネントテスト

- テストファイルは対象ファイルと同じディレクトリに配置
- ファイル名: `*.test.ts` または `*.test.tsx`
- 例: `components/Button.tsx` → `components/Button.test.tsx`

### Storybookストーリー

- ストーリーファイルは対象コンポーネントと同じディレクトリに配置
- ファイル名: `*.stories.tsx`
- 例: `components/Button.tsx` → `components/Button.stories.tsx`

### E2Eテスト

- `e2e/` ディレクトリ内に配置
- ファイル名: `*.spec.ts`
- 例: `e2e/homepage.spec.ts`

### APIモック

- `__tests__/mocks/` ディレクトリ内に配置
- `handlers.ts` - APIハンドラー定義
- `server.ts` - MSWサーバー設定

## サンプルテスト

プロジェクトには以下のサンプルテストが含まれています：

1. **ユニットテスト**: `lib/utils.test.ts`
2. **コンポーネントテスト**: `components/Button.test.tsx`
3. **Storybookストーリー**: `components/Button.stories.tsx`
4. **E2Eテスト**: `e2e/example.spec.ts`

## CI/CD統合

GitHub Actionsワークフローが `.github/workflows/ci.yml` に設定されています。

### 実行されるテスト

- ユニットテスト・コンポーネントテスト
- E2Eテスト（Chromiumのみ）
- Lintチェック
- カバレッジレポート（Codecovへアップロード）

### トリガー

- `main`、`develop` ブランチへのpush
- `main`、`develop` ブランチへのPull Request

## テスト設定ファイル

- `vitest.config.ts` - Vitestの設定
- `vitest.setup.ts` - テストセットアップ（MSW起動含む）
- `playwright.config.ts` - Playwrightの設定
- `.storybook/main.ts` - Storybookの設定
- `.storybook/preview.ts` - Storybookプレビュー設定

## コード品質ツール設定ファイル

- `eslint.config.mjs` - ESLintの設定（flat config形式）
- `prettier.config.js` - Prettierの設定
- `.prettierignore` - Prettierフォーマット対象外ファイル

## ベストプラクティス

### コード品質の維持

**推奨ワークフロー:**

1. コード作成・編集
2. `pnpm format` でフォーマット
3. `pnpm lint:fix` でLint自動修正
4. `pnpm test` でテスト実行
5. コミット前に `pnpm format:check` と `pnpm lint` を実行

**VSCode統合（推奨）:**

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

推奨拡張機能:

- `esbenp.prettier-vscode`
- `dbaeumer.vscode-eslint`

### テスト駆動開発（TDD）

1. 失敗するテストを作成（Red）
2. テストをパスする最小限の実装（Green）
3. リファクタリング（Refactor）

### テストの網羅性

- 正常系だけでなく異常系もテスト
- 境界値のテスト
- エッジケースのテスト
- エラーハンドリングのテスト

### APIモックの活用

- 外部APIへの依存を排除
- テストの安定性と速度を向上
- MSWを使用して実際のHTTPリクエストをインターセプト

## トラブルシューティング

### テストが失敗する場合

1. `pnpm install` で依存関係を再インストール
2. `pnpm test:coverage` でカバレッジレポートを確認
3. `pnpm test:ui` でUIモードで詳細を確認

### E2Eテストが失敗する場合

1. Playwrightブラウザをインストール: `pnpm exec playwright install`
2. 開発サーバーが起動していることを確認
3. `pnpm test:e2e:headed` でブラウザを表示して確認

### Storybookが起動しない場合

1. `.next` ディレクトリを削除
2. `pnpm install` を再実行
3. `pnpm storybook` を再度実行
