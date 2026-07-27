import { API_ENDPOINTS, ICONS } from '@/configs';
import { useHttpRequest } from '@/hooks';
import { updateGalleryType, useAppDispatch } from '@/redux';
import { Box, Button } from '@mui/material';
import { memo, useCallback } from 'react';
import { Icon } from '../ui';

const buttonStyle = {
  alignItems: 'center',
  display: 'flex',
  height: 'fit-content',
  letterSpacing: 0.5,
  maxWidth: '20rem',
  textTransform: 'none',
};

interface SelectTypeProps {
  postId: string;
}

export const SelectType = memo(({ postId }: SelectTypeProps) => {
  const { patchRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  // データの保存 - 選択したtypeの保存
  const handleSaveType = useCallback(
    (type: 'card' | 'img') => {
      patchRequest({
        apiUrl: `${API_ENDPOINTS.gallery}type/${postId}/`,
        data: { type },
      })
        .then(() => {
          dispatch(updateGalleryType({ id: Number(postId), type }));
        })
        .catch(() => {
          console.error('タイプの設定に失敗しました');
        });
    },
    [postId, patchRequest, dispatch]
  );

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        flexShrink: 1,
        justifyContent: 'center',
      }}
    >
      <p>ページタイプを選択</p>
      <Button
        fullWidth
        onClick={() => {
          handleSaveType('img');
        }}
        startIcon={<Icon color="primary" icon={ICONS.images} />}
        sx={{
          margin: '1rem auto',
          ...buttonStyle,
        }}
        variant="outlined"
      >
        画像のみ
      </Button>
      <Button
        fullWidth
        onClick={() => {
          handleSaveType('card');
        }}
        startIcon={<Icon color="primary" icon={ICONS.article} />}
        sx={{
          margin: '0 auto',
          ...buttonStyle,
        }}
        variant="outlined"
      >
        画像とテキスト
      </Button>
    </Box>
  );
});
