export const generateVideoThumbnail = (
  fileUrl: string
): {
  cancel: () => void;
  promise: Promise<string>;
} => {
  const video = document.createElement('video');

  let isCancelled = false;
  let handleLoaded: (() => void) | null = null;
  let handleError: (() => void) | null = null;
  let handleSeeked: (() => void) | null = null;

  // エラー時と終了時のクリーンアップ処理
  const cleanup = () => {
    if (handleLoaded) video.removeEventListener('loadedmetadata', handleLoaded);
    if (handleError) video.removeEventListener('error', handleError);
    if (handleSeeked) video.removeEventListener('seeked', handleSeeked);
    video.pause();
    video.removeAttribute('src');
    video.load();
  };

  const promise = new Promise<string>((resolve, reject) => {
    video.src = fileUrl;
    video.crossOrigin = 'anonymous'; // 別ドメインでもサーバー側でクロスオリジンが許可されていれば描画・取得可能
    video.muted = true; // 音声は不要なのでミュート
    video.autoplay = false; // 自動再生はしない
    video.playsInline = true; // モバイルブラウザでのインライン再生対応
    video.preload = 'metadata'; // モバイルでもメタデータを読み込む

    const drawFrame = () => {
      if (isCancelled) return;

      // canvas 要素を作成
      const canvas = document.createElement('canvas');
      // 描画用の 2D コンテキストを取得
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        cleanup();
        reject(new Error('Canvas のコンテキストを取得できませんでした'));
        return;
      }

      const maxSize = 300;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      const scale = Math.min(maxSize / videoWidth, maxSize / videoHeight, 1); // 拡大はしない

      const targetWidth = Math.round(videoWidth * scale);
      const targetHeight = Math.round(videoHeight * scale);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // 動画の現在のフレームをcanvasに描画
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      // canvasの内容をjpeg形式のData URL（Base64形式）で取得してPromiseで返す
      const result = canvas.toDataURL('image/jpeg', 0.7);

      cleanup();
      resolve(result);
    };

    handleLoaded = () => {
      if (isCancelled) return;

      // メタデータ読み込み完了後にシーク（モバイルでの loadeddata 未発火対策）
      const seekTarget = Math.min(1, video.duration > 0 ? video.duration * 0.1 : 1);

      if (handleSeeked) video.removeEventListener('seeked', handleSeeked);

      handleSeeked = () => {
        if (isCancelled) return;
        video.removeEventListener('seeked', handleSeeked!);
        handleSeeked = null;
        drawFrame();
      };

      video.addEventListener('seeked', handleSeeked);
      video.currentTime = seekTarget; // シーク完了は seeked イベントで検知する
    };

    handleError = () => {
      if (isCancelled) return;
      cleanup();
      reject(new Error('動画の読み込みに失敗しました'));
    };

    // メタデータ（動画サイズ・長さ）が読み込まれたら seeked フローを開始する
    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('error', handleError);
  });

  const cancel = () => {
    isCancelled = true;
    cleanup();
  };

  return { cancel, promise };
};
