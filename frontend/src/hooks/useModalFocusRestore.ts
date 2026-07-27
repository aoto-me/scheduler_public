import { useCallback, useEffect, useRef } from 'react';

/**
 * モーダルを閉じたときに、開く前にフォーカスしていたボタンへフォーカスを戻す
 */
export const useModalFocusRestore = (isModalOpen: boolean) => {
  const lastFocusedButtonRef = useRef<HTMLButtonElement | null>(null);

  const setButtonElement = useCallback((target: HTMLButtonElement | null) => {
    lastFocusedButtonRef.current = target;
  }, []);

  useEffect(() => {
    if (!isModalOpen && lastFocusedButtonRef.current) {
      const timeout = setTimeout(() => {
        lastFocusedButtonRef.current?.focus();
      }, 500);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isModalOpen]);

  return { setButtonElement };
};
