export const uniqueContent = (prefix: string) => {
  const now = new Date();
  const timestamp = now.toLocaleString('ja-JP').replace(' ', 'T');
  return `${prefix}-${timestamp}`;
};

// Alt+b キーボードショートカットでドロワーを開閉する
export const toggleDrawerByShortcut = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.evaluate(
    `globalThis.dispatchEvent(
      new KeyboardEvent('keydown', {
        altKey: true,
        bubbles: true,
        cancelable: true,
        key: 'b'
      })
    )`
  );
  await page.waitForTimeout(500);
};

// GET /backend/api/user/ からCSRFトークンを取得する（userエンドポイントはCSRF検証不要）
export const fetchCsrfToken = async (request: import('@playwright/test').APIRequestContext): Promise<string> => {
  const resp = await request.get('/backend/api/user/');
  const body = (await resp.json()) as { csrfToken: string };
  return body.csrfToken;
};
