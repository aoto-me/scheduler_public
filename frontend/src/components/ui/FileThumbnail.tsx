import { getExtensionIcon, ICONS, imageExtensions, thumbExtensions } from '@/configs';
import { usePdfThumbnail, useVideoThumbnail } from '@/hooks';
import 'pdfjs-dist/build/pdf.worker.min.mjs';
import { createFileUrl, normalizeExtension } from '@/utils';
import { type CSSProperties, memo, useMemo } from 'react';
import { Icon } from './Icon';
import { Image } from './Image';

interface FileThumbnailProps {
  extension: string;
  fileName: string;
  iconSize?: string;
  path: string;
  style?: CSSProperties;
}

/**
 * MEMO:
 * サーバー上で動画・PDFのサムネイルを生成したいが、
 * 現在のプランでは FFmpeg を使用できないため、
 * 代替としてフロント側でサムネイルを生成している。
 */
export const FileThumbnail = memo(({ extension, fileName, iconSize = '1.25rem', path, style }: FileThumbnailProps) => {
  // 拡張子の.なし、小文字に統一
  const normalizedExtension = useMemo(() => normalizeExtension(extension, { lowerCase: true }), [extension]);

  const dotExtension = useMemo(() => normalizeExtension(extension, { withDot: true }), [extension]);

  const fileIcon = useMemo(() => getExtensionIcon(normalizedExtension), [normalizedExtension]);

  // 動画のサムネイル生成
  const videoThumbnail = useVideoThumbnail({
    extension,
    fileName,
    path,
  });

  // PDFのサムネイル生成
  const pdfThumbnail = usePdfThumbnail({
    extension,
    fileName,
    path,
  });

  if (imageExtensions.includes(normalizedExtension)) {
    if (thumbExtensions.includes(normalizedExtension)) {
      // _thumb付きのURLを作る
      const fileNameThumb = `${fileName}_thumb`;
      return <Image alt={fileName} height="100%" src={createFileUrl(`${fileNameThumb}${dotExtension}`, path)} />;
    }
    return <Image alt={fileName} height="100%" src={createFileUrl(`${fileName}${dotExtension}`, path)} />;
  }

  if (videoThumbnail) {
    return (
      <>
        <img
          alt={fileName}
          src={videoThumbnail}
          style={{
            height: '100%',
            objectFit: 'contain',
            width: '100%',
            ...style,
          }}
        />
        <Icon
          color="#ffffff80"
          icon={ICONS.playCircleFill}
          size="1.5rem"
          style={{
            left: '50%',
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        />
      </>
    );
  }

  if (pdfThumbnail) {
    return (
      <img
        alt={fileName}
        src={pdfThumbnail}
        style={{
          height: '100%',
          objectFit: 'contain',
          width: '100%',
          ...style,
        }}
      />
    );
  }

  if (fileIcon) {
    return <Icon icon={fileIcon} size={iconSize} />;
  }

  return (
    <span
      style={{
        fontSize: '1rem',
      }}
    >
      {normalizedExtension}
    </span>
  );
});
