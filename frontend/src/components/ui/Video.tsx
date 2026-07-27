import { NO_IMG_URL } from '@/configs';
import { memo } from 'react';

interface VideoProps {
  onError?: () => void;
  onLoad?: () => void;
  url: string;
}

/**
 * 親コンポーネントでの利用例
 *
 * @example
 * <Video
 * url="https://example.com/image.mp4"
 * onError={() => setVideoError(true)} // ここでエラーを検知
 * />;
 */
export const Video = memo(({ onError, onLoad, url }: VideoProps) => {
  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    e.currentTarget.outerHTML = `<img src=${NO_IMG_URL} alt="動画が見つかりませんでした" style="width: 100%; height: auto; object-fit: contain;" />`;
    // 親コンポーネントへエラーを通知
    if (onError) onError();
  };

  return (
    <video
      controls
      onError={handleError}
      onLoadedMetadata={onLoad}
      preload="metadata"
      style={{
        display: 'block',
        height: 'auto',
        margin: '0 auto',
        maxWidth: '800px',
        width: '100%',
      }}
    >
      <source src={`${url}#t=0.001`} />
      <p>お使いのブラウザでは動画を再生できません。</p>
    </video>
  );
});
