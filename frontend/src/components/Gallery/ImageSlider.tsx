import { ICONS, thumbExtensions, videoExtensions } from '@/configs';
import { theme } from '@/theme';
import type { ImageItem } from '@/types';
import { createFileUrl, normalizeExtension } from '@/utils';
import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import { type CSSProperties, type JSX, memo, useCallback, useMemo, useRef } from 'react';
import SliderModule from 'react-slick';
// Vite 8 (Rolldown) は CJS パッケージの __esModule: true を自動でアンラップしないため、.default を明示的に参照する
const Slider = (SliderModule as unknown as { default?: typeof SliderModule }).default ?? SliderModule;
import { Icon, Image, Video } from '../ui';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface SlideItemProps {
  index: number;
  item: ImageItem | undefined;
  onLoad: () => void;
  path: string;
}

const SlideItem = memo(({ item, onLoad, path }: SlideItemProps) => {
  // 拡張子の.なし、小文字に統一
  const normalizedExtension = useMemo(() => normalizeExtension(item?.extension, { lowerCase: true }), [item]);

  const dotExtension = useMemo(() => normalizeExtension(item?.extension, { withDot: true }), [item]);

  if (!item) return null;

  return (
    <div>
      {videoExtensions.includes(normalizedExtension) ? (
        <Video onLoad={onLoad} url={createFileUrl(`${item.name}${dotExtension}`, path)} />
      ) : (
        <>
          {thumbExtensions.includes(normalizedExtension) ? (
            <Image
              alt={item.name}
              height="100%"
              onLoad={onLoad}
              src={createFileUrl(`${item.name}_thumb${dotExtension}`, path)}
              style={{ maxHeight: '500px' }}
            />
          ) : (
            <Image
              alt={item.name}
              height="100%"
              onLoad={onLoad}
              src={createFileUrl(`${item.name}${dotExtension}`, path)}
              style={{ maxHeight: '500px' }}
            />
          )}
        </>
      )}
      <Box
        sx={{
          width: 'calc(100% - 2px)',
        }}
      >
        <Typography
          align={'center'}
          sx={{
            lineHeight: 1.5,
            padding: '0.5rem 0',
            width: '100%',
          }}
          variant="subtitle2"
        >
          {item.name}
          {dotExtension}
        </Typography>
      </Box>
    </div>
  );
});

interface ImageSliderProps {
  currentIndex: number;
  itemMap: Map<number, ImageItem> | null;
  items: number[];
  path: string;
  style?: CSSProperties;
}

const SlickDotsWrapper = styled.div`
  position: static;
  & li {
    margin: 0 !important;
  }
`;

export const ImageSlider = memo(({ currentIndex, itemMap, items, path, style }: ImageSliderProps) => {
  const sliderRef = useRef<InstanceType<typeof SliderModule> | null>(null);

  const settings = useMemo(
    () => ({
      adaptiveHeight: true,
      appendDots: (dots: JSX.Element) => (
        <SlickDotsWrapper>
          <ul style={{ margin: '0px' }}>{dots}</ul>
        </SlickDotsWrapper>
      ),
      arrows: false,
      dots: true,
      initialSlide: currentIndex,
      slidesToScroll: 1,
      slidesToShow: 1,
      speed: 500,
    }),
    [currentIndex]
  );

  const handleLoad = useCallback(
    (index: number) => {
      if (index === currentIndex) {
        sliderRef.current?.slickGoTo(currentIndex);
      }
    },
    [currentIndex]
  );

  return (
    <div className="slider-container" data-testid="image-slider" style={style}>
      <Slider {...settings} ref={sliderRef}>
        {items.length === 0 && (
          <>
            <Box
              sx={{
                alignItems: 'center',
                aspectRatio: '16/9',
                backgroundColor: theme.palette.grey[200],
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '150px',
                width: '100%',
              }}
            >
              <Icon
                icon={ICONS.emptyImage}
                size="2rem"
                style={{
                  marginBottom: '1rem',
                }}
              />
              <Typography
                sx={{
                  color: theme.palette.secondary.main,
                }}
                variant="body2"
              >
                画像/動画の登録がありません
              </Typography>
            </Box>
          </>
        )}
        {items.map((item, index) => (
          <SlideItem
            index={index}
            item={itemMap?.get(item)}
            key={itemMap?.get(item)?.id}
            onLoad={() => {
              handleLoad(index);
            }}
            path={path}
          />
        ))}
      </Slider>
    </div>
  );
});
