import 'pdfjs-dist/build/pdf.worker.min.mjs';
import * as pdfjsLib from 'pdfjs-dist';

export const generatePdfThumbnail = (fileUrl: string) => {
  // PDFの読み込み処理を開始（非同期）
  const loadingTask = pdfjsLib.getDocument({ url: fileUrl });

  const promise = (async () => {
    const pdf = await loadingTask.promise; // PDFの読み込み完了を待つ
    const page = await pdf.getPage(1);

    // スケール1（原寸）のサイズ情報を取得
    const unscaledViewport = page.getViewport({ scale: 1 });
    const maxSize = 300;
    const scale = Math.min(maxSize / unscaledViewport.width, maxSize / unscaledViewport.height, 1); // 拡大はしない
    // 計算したスケールで最終的な描画サイズを取得
    const viewport = page.getViewport({ scale });

    // 描画用のcanvasを作成
    const canvas = document.createElement('canvas');
    // 2D描画コンテキストを取得
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas のコンテキストを取得できませんでした');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // PDFページをcanvasに描画
    await page.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;

    // canvasをJPEG形式のbase64画像として返す
    return canvas.toDataURL('image/jpeg', 0.7);
  })();

  return {
    // 外からキャンセルできるようにする（PDFの読み込み処理を中断）
    cancel: () => {
      void loadingTask.destroy();
    },
    promise,
  };
};
