import { test, expect } from '@playwright/test';

/**
 * E2Eテストのサンプル
 * Playwrightを使用したエンドツーエンドテスト例
 */

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');

    // ページタイトルが存在することを確認
    await expect(page).toHaveTitle(/.*/);
  });

  test('should have visible content', async ({ page }) => {
    await page.goto('/');

    // ページが読み込まれていることを確認
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should navigate correctly', async ({ page }) => {
    await page.goto('/');

    // ページがロードされたことを確認
    await page.waitForLoadState('networkidle');

    // スクリーンショットを撮影（デバッグ用）
    await page.screenshot({ path: 'playwright-report/homepage.png', fullPage: true });
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // モバイルビューポートを設定
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // タブレットビューポートを設定
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
