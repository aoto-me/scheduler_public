import { ICONS } from '@/configs';
import { useDeleteFile, useSaveFile } from '@/hooks';
import { fontSerif } from '@/styles';
import { validateFolderName } from '@/utils';
import { Box, IconButton, Stack, TextField, Typography } from '@mui/material';
import { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui';

interface FolderNameProps {
  decodedPath: string;
  pageTitle: string;
  postId: string | undefined;
}

const notEditable = new Set(['diary', 'gallery', 'memo', 'project']);

export const FolderName = memo(({ decodedPath, pageTitle, postId }: FolderNameProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const [isError, setIsError] = useState(false);
  const [folderName, setFolderName] = useState(pageTitle);
  const [folderNameClone, setFolderNameClone] = useState(pageTitle);
  const { renameFolder } = useSaveFile();
  const { deleteFolder } = useDeleteFile();
  const navigate = useNavigate();

  // 'gallery', 'diary', 'project', 'memo' のフォルダに該当する場合、編集不可
  const isEditable = useMemo(() => !notEditable.has(postId ?? ''), [postId]);

  // 編集モードを開始
  const onEdit = useCallback(() => {
    setFolderNameClone(folderName);
    setIsEdit(true);
  }, [folderName]);

  // 編集モードを終了
  const finishEdit = useCallback(() => {
    setIsEdit(false);

    if (isError) {
      setFolderName(folderNameClone);
      setIsError(false);
      return;
    }

    if (folderName === folderNameClone) return;

    // 更新処理とページ遷移
    renameFolder(folderName, decodedPath)
      .then(response => {
        if (!response) return;
        void navigate(`/file/${response}`, {
          replace: true,
        });
      })
      .catch(() => {
        console.error('フォルダ名の変更に失敗');
      });
  }, [isError, folderName, folderNameClone, decodedPath, renameFolder, navigate]);

  // Enterキーで編集完了
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        finishEdit();
      }
    },
    [finishEdit]
  );

  // フォルダの削除
  const handleDelete = useCallback(() => {
    const result = confirm(`フォルダとフォルダ内の全てのファイルとフォルダが削除されます。削除しますか？`);
    if (!result) return;
    deleteFolder(decodedPath)
      .then(response => {
        if (response === 'ok') {
          void navigate(`/file`, {
            replace: true,
          });
        }
      })
      .catch(() => {
        console.error('フォルダの削除に失敗');
      });
  }, [deleteFolder, decodedPath, navigate]);

  // フォルダ名の表示と入力フォーム
  const title = isEdit ? (
    <TextField
      autoComplete="off"
      autoFocus
      defaultValue={folderName}
      error={isError}
      fullWidth
      helperText={isError ? (folderName.trim() === '' ? '未入力です' : '使用できない文字が含まれています') : ''}
      hiddenLabel
      onChange={e => {
        setFolderName(e.target.value);
        setIsError(!validateFolderName(e.target.value));
      }}
      onKeyDown={handleKeyDown}
      sx={{
        '& .MuiInputBase-input': {
          fontSize: '1.15rem',
          lineHeight: 1.35,
          padding: '0.25rem',
        },
        '& .MuiInputBase-root': {
          backgroundColor: '#fff',
        },
        '.MuiFormHelperText-root.Mui-error': {
          marginLeft: 0,
          marginRight: 0,
        },
      }}
    />
  ) : (
    <Typography
      component="h1"
      sx={{
        ...fontSerif,
        flexGrow: 1,
        flexShrink: 1,
        fontWeight: 700,
      }}
      variant="h5"
    >
      {pageTitle}
    </Typography>
  );

  // 編集・削除・保存ボタン
  const actionButtons = (
    <Box sx={{ flexGrow: 0, flexShrink: 0 }}>
      {!isEdit && (
        <IconButton aria-label="フォルダ名を変更" onClick={onEdit} sx={{ marginLeft: '0.25rem' }}>
          <Icon icon={ICONS.editFill} size="1.15rem" />
        </IconButton>
      )}

      {isEdit ? (
        <IconButton aria-label="フォルダ名を保存" onClick={finishEdit} sx={{ marginLeft: '0.25rem' }}>
          <Icon icon={ICONS.saveFill} size="1.15rem" />
        </IconButton>
      ) : (
        <IconButton aria-label="フォルダを削除" onClick={handleDelete} sx={{ marginLeft: '0.25rem' }}>
          <Icon icon={ICONS.deleteFill} size="1.15rem" />
        </IconButton>
      )}
    </Box>
  );

  return (
    <Stack
      direction={'row'}
      sx={{
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        marginTop: '0.5rem',
      }}
    >
      {title}
      {isEditable && actionButtons}
    </Stack>
  );
});
