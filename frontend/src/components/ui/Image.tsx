import { NO_IMG_URL } from '@/configs';
import { memo } from 'react';

interface ImageProps {
  alt: string;
  height?: string;
  lazy?: boolean;
  onError?: () => void;
  onLoad?: () => void;
  square?: boolean;
  src: string;
  style?: React.CSSProperties;
}

/**
 * 親コンポーネントでの利用例
 *
 * @example
 * <Image
 * url="https://example.com/image.jpg"
 * alt="サンプル画像"
 * onError={() => setImageError(true)} // ここでエラーを検知
 * />;
 */
export const Image = memo(({ alt, height, lazy = true, onError, onLoad, square = false, src, style }: ImageProps) => {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = NO_IMG_URL;
    // エラーを親コンポーネントに通知
    if (onError) onError();
  };

  return (
    <img
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      onError={handleError}
      onLoad={onLoad}
      src={src}
      style={{
        height: height ?? (square ? '100%' : 'auto'),
        margin: '0 auto',
        objectFit: square ? 'cover' : 'contain',
        width: '100%',
        ...style,
      }}
    />
  );
});
