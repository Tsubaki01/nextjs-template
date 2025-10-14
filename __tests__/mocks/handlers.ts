import { http, HttpResponse } from 'msw';

/**
 * APIモックハンドラー
 * テストで使用するAPIエンドポイントのモックレスポンスを定義
 */
export const handlers = [
  // 例: GETリクエストのモック
  http.get('/api/example', () => {
    return HttpResponse.json({
      message: 'This is a mocked response',
    });
  }),

  // 例: POSTリクエストのモック
  http.post('/api/example', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: body,
    });
  }),
];
