import { useEffect } from 'react';

// Navigatorの型を拡張する
interface ExtendedNavigator extends Navigator {
  standalone?: boolean;
}

// PWAかの判定
const isPWA = () => {
  // iOS の場合：Safari がスタンドアロン（PWA）モードかどうかをチェック
  const isIOSStandalone = (globalThis.navigator as ExtendedNavigator).standalone === true;
  // Android の場合：Mediaクエリで display-mode が standalone かを判定
  const isDisplayModeStandalone = globalThis.matchMedia('(display-mode: standalone)').matches;
  return isIOSStandalone || isDisplayModeStandalone;
};

export const usePullToRefreshInPWA = () => {
  useEffect(() => {
    if (!isPWA()) return;

    let startY = 0; // タッチ開始時の Y 座標
    let pullDistance = 0; // 引っ張った距離
    let isPulling = false; // 現在 Pull to Refresh をしようとしているかどうか

    // タッチ開始時の処理
    const touchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY; // 指の Y 座標を記録
        pullDistance = 0; // 引っ張った距離をリセット
        isPulling = true;
      }
    };

    // タッチ中の処理
    const touchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      const currentY = e.touches[0].clientY; // 現在の Y 座標
      pullDistance = currentY - startY; // どれくらい引っ張ったか計算
    };

    // 実際に画面が戻ってきたかどうかを監視し、戻ったらリロードする処理
    const watchScrollBack = () => {
      let count = 0;
      const maxChecks = 60; // 約1000ms（60fps前提）

      // アニメーションフレームごとに scrollY をチェック
      const check = () => {
        if (window.scrollY === 0) {
          globalThis.location.reload(); // ページが先頭に戻っていたらリロード
        } else if (count < maxChecks) {
          count += 1;
          requestAnimationFrame(check); // 無限ループさせるため（再帰的に継続してチェック）
        }
      };

      requestAnimationFrame(check);
    };

    // タッチ終了時の処理
    const touchEnd = () => {
      // 引っ張った距離が十分なら、リロードを実行
      if (isPulling && pullDistance > 250) {
        watchScrollBack(); // 指を離したあと、戻る動きが完了するのを待ってから発火
      }
      // 状態をリセット
      isPulling = false;
      pullDistance = 0;
    };

    globalThis.addEventListener('touchstart', touchStart);
    globalThis.addEventListener('touchmove', touchMove);
    globalThis.addEventListener('touchend', touchEnd);

    return () => {
      globalThis.removeEventListener('touchstart', touchStart);
      globalThis.removeEventListener('touchmove', touchMove);
      globalThis.removeEventListener('touchend', touchEnd);
    };
  }, []);
};
