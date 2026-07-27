import { imageExtensions, NO_IMG_URL, thumbExtensions } from '@/configs';
import { useVideoThumbnail } from '@/hooks';
import { createFileUrl, normalizeExtension } from '@/utils';
import { CardMedia } from '@mui/material';
import { memo, useMemo } from 'react';

interface CardThumbnailProps {
  extension: string;
  fileName: string;
  path: string;
  title: string;
}

export const CardThumbnail = memo(({ extension, fileName, path, title }: CardThumbnailProps) => {
  // 拡張子の.なし、小文字に統一
  const normalizedExtension = useMemo(() => normalizeExtension(extension, { lowerCase: true }), [extension]);

  const dotExtension = useMemo(() => normalizeExtension(extension, { withDot: true }), [extension]);

  // 動画のサムネイル生成
  const videoThumbnail = useVideoThumbnail({
    extension,
    fileName,
    path,
  });

  if (imageExtensions.includes(normalizedExtension)) {
    if (thumbExtensions.includes(normalizedExtension)) {
      // _thumb付きのURLを作る
      const fileNameThumb = `${fileName}_thumb`;
      return (
        <CardMedia
          alt={`${title}のサムネイル`}
          component="img"
          height="180"
          image={createFileUrl(`${fileNameThumb}${dotExtension}`, path)}
          onError={e => {
            e.currentTarget.src = NO_IMG_URL;
          }}
        />
      );
    }
    return (
      <CardMedia
        alt={`${title}のサムネイル`}
        component="img"
        height="180"
        image={createFileUrl(`${fileName}${dotExtension}`, path)}
        onError={e => {
          e.currentTarget.src = NO_IMG_URL;
        }}
      />
    );
  }

  if (videoThumbnail) {
    return (
      <CardMedia
        alt={`${title}のサムネイル`}
        component="img"
        height="180"
        image={videoThumbnail}
        onError={e => {
          e.currentTarget.src = NO_IMG_URL;
        }}
      />
    );
  }

  return <CardMedia alt={`${title}のサムネイル`} component="img" height="180" image={NO_IMG_URL} />;
});
