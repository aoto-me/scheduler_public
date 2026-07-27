import { CardDate, CardDeleteButton, ImageSliderWithThumb } from '@/components/Gallery';
import { BlockEditor, NotFound, PageLoader } from '@/components/ui';
import { useFetchGallery } from '@/hooks';
import { editorOuter } from '@/styles';
import type { DiaryCard, GalleryCard, ImageItem } from '@/types';
import { splitFileName } from '@/utils';
import { Box, Stack } from '@mui/material';
import type { JSONContent } from '@tiptap/core';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';

const GalleryPostSubPage = () => {
  // CardList と DiaryList から context を取得
  const { card, path, postId, setIsUploading, uploadUrl } = useOutletContext<{
    card: DiaryCard | GalleryCard | null;
    path: string;
    postId: string;
    setIsUploading: Dispatch<SetStateAction<boolean>>;
    uploadUrl: string;
  }>();

  const { subPage } = useParams();
  const [content, setContent] = useState<JSONContent | null>(null);
  const [items, setItems] = useState<number[]>([]);
  const [itemMap, setItemMap] = useState<Map<number, ImageItem> | null>(null);
  const { fetchCardItem } = useFetchGallery();

  useEffect(() => {
    if (!card || content || itemMap) return;

    fetchCardItem(card.id, postId === 'diary')
      .then(response => {
        if (!response) return;
        setContent(JSON.parse(response.content) as JSONContent);

        // sortの順番に並べ替え
        const sortedItems = response.item.sort((a, b) => a.sort - b.sort);
        setItems(sortedItems.map(item => item.id));

        // 取得したデータを整形
        const itemData = sortedItems.map(item => {
          const { extension, name } = splitFileName(item.file);
          return {
            cardId: item.cardId,
            extension,
            id: item.id,
            name,
            sort: item.sort,
            url: postId === 'diary' ? `${uploadUrl}${String(card.id)}/${item.file}` : `${uploadUrl}${item.file}`,
          };
        });
        setItemMap(new Map(itemData.map(i => [i.id, i])));
      })
      .catch(() => {
        console.error('カードの取得に失敗しました');
      });
  }, [postId, subPage, uploadUrl, fetchCardItem]);

  if (!card) {
    return (
      <NotFound
        style={{
          flexGrow: 1,
        }}
      />
    );
  }

  if (!content || !itemMap) {
    return (
      <PageLoader
        style={{
          flexGrow: 1,
        }}
      />
    );
  }

  return (
    <>
      <Stack
        direction={'row'}
        spacing={2}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <CardDate cardId={card.id} date={card.date} postId={postId} />
        <CardDeleteButton cardId={card.id} date={card.date ?? ''} postId={postId} />
      </Stack>
      <Box
        sx={{
          ...editorOuter,
          marginTop: '2rem',
        }}
      >
        <ImageSliderWithThumb
          date={card.date ?? undefined}
          itemMap={itemMap}
          items={items}
          path={path}
          setIsUploading={setIsUploading}
          setItemMap={setItemMap}
          setItems={setItems}
          uploadUrl={uploadUrl}
        />
        <BlockEditor
          content={content}
          date={card.date ?? undefined}
          outer={false}
          style={{
            marginTop: '2rem',
          }}
        />
      </Box>
    </>
  );
};

export default GalleryPostSubPage;
