import { ICONS, isViewable } from '@/configs';
import { useErrorContext } from '@/contexts';
import { IOS_PWA_MAX_SIZE, isIOSPWA, useDeleteFile, useDownloadZip, useSaveFile, useShareOrDownload } from '@/hooks';
import { theme } from '@/theme';
import type { FileItem } from '@/types';
import { copyToClipboard, createFileUrl, formatFileSize, normalizeExtension, validateFileName } from '@/utils';
import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material';
import { memo, useCallback, useMemo, useState } from 'react';
import { Backdrop } from '../Backdrop';
import { FileThumbnail } from '../FileThumbnail';
import { Icon } from '../Icon';
import { FileMenu } from './FileMenu';

interface FileItemProps {
  actionsEnabled: boolean;
  file: FileItem;
  selectFiles: FileItem[];
  setSelectFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
}

const FileItem = memo(({ actionsEnabled, file, selectFiles, setSelectFiles }: FileItemProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const [isError, setIsError] = useState(false);
  const [fileName, setFileName] = useState(file.name);
  const [fileNameClone, setFileNameClone] = useState(file.name);
  const { renameFile } = useSaveFile();
  const { deleteFile } = useDeleteFile();

  const isSelected = useMemo(() => selectFiles.some(selected => selected.url === file.url), [selectFiles, file.url]);

  const isOpen = useMemo(() => isViewable(file.extension), [file.extension]);

  const dotExtension = useMemo(() => normalizeExtension(file.extension, { withDot: true }), [file.extension]);

  // 選択と解除の切り替え
  const handleSelectToggle = useCallback(() => {
    if (!actionsEnabled) return;
    setSelectFiles(prev => {
      const exists = prev.some(select => select.url === file.url);

      return exists ? prev.filter(select => select.url !== file.url) : [...prev, file];
    });
  }, [setSelectFiles, file, actionsEnabled]);

  // 編集モードを終了
  const finishEdit = useCallback(() => {
    setIsEdit(false);

    if (isError) {
      setFileName(fileNameClone);
      setIsError(false);
      return;
    }

    if (fileName === fileNameClone) return;

    void renameFile({
      extension: file.extension,
      newName: fileName,
      oldName: file.name,
      path: file.path,
    });
  }, [isError, fileName, fileNameClone, file.name, file.extension, file.path, renameFile]);

  // Enterキーで編集完了
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        finishEdit();
      }
    },
    [finishEdit]
  );

  // 編集モードを開始
  const onEdit = useCallback(() => {
    setTimeout(() => {
      setFileNameClone(fileName);
      setIsEdit(true);
    }, 100);
  }, [fileName]);

  const handleDelete = useCallback(() => {
    const result = confirm(`ファイルを削除しますか？`);
    if (!result) return;
    void deleteFile({
      extension: file.extension,
      name: file.name,
      path: file.path,
    });
  }, [file.extension, file.name, file.path, deleteFile]);

  const handleCopy = useCallback(() => {
    void copyToClipboard(file.url);
  }, [file.url]);

  const handleOpen = useCallback(() => {
    const href = createFileUrl(`${file.name}${dotExtension}`, file.path);
    window.open(href, '_blank', 'noopener,noreferrer');
  }, [dotExtension, file.name, file.path]);

  const shareOrDownload = useShareOrDownload();
  const handleDownload = useCallback(async () => {
    const fileUrl = createFileUrl(`${file.name}${dotExtension}`, file.path);
    await shareOrDownload({
      filename: `${file.name}${dotExtension}`,
      fileSize: file.size ?? undefined,
      url: fileUrl,
    });
  }, [dotExtension, file.name, file.path, file.size, shareOrDownload]);

  return (
    <Grid data-testid={`file-item-${file.name}`} size={{ md: 2, sm: 3, xl: 1.5, xs: 4 }}>
      <button
        aria-label={`${file.name}${dotExtension}を選択`}
        onClick={handleSelectToggle}
        style={{
          alignItems: 'center',
          aspectRatio: '1 / 1',
          backgroundColor: '#fff',
          border: isSelected ? `solid 2px ${theme.palette.primary.main}` : `solid 1px ${theme.palette.divider}`,
          borderRadius: '3px',
          cursor: actionsEnabled ? 'pointer' : 'inherit',
          display: 'flex',
          justifyContent: 'center',
          padding: 0,
          position: 'relative',
          width: '100%',
        }}
      >
        <FileThumbnail
          extension={file.extension}
          fileName={file.name}
          iconSize="1.5rem"
          path={file.path}
          style={{
            height: '100%',
          }}
        />
      </button>
      <Stack
        direction={'row'}
        sx={{
          alignItems: 'flex-start',
          marginTop: '0.25rem',
          spacing: 0.5,
        }}
      >
        {isEdit ? (
          <TextField
            autoComplete="off"
            autoFocus
            defaultValue={fileName}
            error={isError}
            fullWidth
            helperText={isError ? (fileName.trim() === '' ? '未入力です' : '使用できない文字が含まれています') : ''}
            hiddenLabel
            multiline
            onBlur={finishEdit}
            onChange={e => {
              setFileName(e.target.value);
              setIsError(!validateFileName(e.target.value));
            }}
            onKeyDown={handleKeyDown}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '0.8125rem',
                lineHeight: 1.35,
                padding: '2px 4px',
              },
              '& .MuiInputBase-root': {
                backgroundColor: '#fff',
                padding: '0.25rem',
              },
              '.MuiFormHelperText-root.Mui-error': {
                fontSize: '0.75rem',
                lineHeight: 1.35,
                marginLeft: 0,
                marginRight: 0,
              },
            }}
          />
        ) : (
          <Typography
            sx={{
              flexGrow: 1,
              flexShrink: 1,
              fontSize: '0.8125rem',
              marginTop: '3px !important',
              width: '100%',
            }}
          >
            {file.name}
            {dotExtension}
          </Typography>
        )}
        <FileMenu
          isOpen={isOpen}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onEdit={onEdit}
          onOpen={handleOpen}
        />
      </Stack>
    </Grid>
  );
});

interface FileGridProps {
  actionsEnabled?: boolean;
  decodedPath: string;
  files: FileItem[];
}

export const FileGrid = memo(({ actionsEnabled = true, decodedPath, files }: FileGridProps) => {
  const [selectFiles, setSelectFiles] = useState<FileItem[]>([]);
  const [loadingType, setLoadingType] = useState<'' | 'delete' | 'download'>('');
  const { deleteFiles } = useDeleteFile();
  const { setErrors } = useErrorContext();
  const downloadZip = useDownloadZip();

  const totalSize = useMemo(
    () =>
      selectFiles.reduce((total, file) => {
        return total + (file.size ?? 0);
      }, 0),
    [selectFiles]
  );

  // 全選択
  const handleSelectAllFiles = () => {
    setSelectFiles(files);
  };

  // 選択解除
  const handleClearSelectedFiles = () => {
    setSelectFiles([]);
  };

  // 選択ファイルのダウンロード
  const handleDownloadFiles = useCallback(() => {
    // iOS PWA は Blob をメモリに展開するため 100MB に制限、それ以外は 300MB
    const MAX_SIZE = isIOSPWA() ? IOS_PWA_MAX_SIZE : 300 * 1024 * 1024;
    const errorMessage = isIOSPWA()
      ? '一度に共有できるのは最大100MBです。PCのブラウザから実行してください。'
      : '一度にダウンロードできるのは最大300MBです';

    if (totalSize >= MAX_SIZE) {
      setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
      return;
    }

    const downloadFiles = selectFiles.map(file => {
      return {
        extension: file.extension,
        name: file.name,
      };
    });

    setLoadingType('download');
    downloadZip({
      files: downloadFiles,
      path: decodedPath,
    })
      .catch(() => {
        console.error('ダウンロードに失敗しました');
      })
      .finally(() => {
        setSelectFiles([]);
        setLoadingType('');
      });
  }, [selectFiles, decodedPath, downloadZip, totalSize, setErrors]);

  // 選択ファイルの削除
  const handleDeleteFiles = useCallback(() => {
    const result = confirm('選択中のファイルを削除しますか？');
    if (!result) return;

    const deleteFileList = selectFiles.map(file => {
      return {
        extension: file.extension,
        name: file.name,
      };
    });

    setLoadingType('delete');
    deleteFiles({
      files: deleteFileList,
      path: decodedPath,
    })
      .catch(() => {
        console.error('ファイルの削除に失敗しました');
      })
      .finally(() => {
        setSelectFiles([]);
        setLoadingType('');
      });
  }, [selectFiles, decodedPath, deleteFiles]);

  const disabledButtonStyle = {
    border: selectFiles.length === 0 ? `solid 1px ${theme.palette.secondary.light}` : 'solid 1px transparent',
    lineHeight: 1.35,
  };

  const disabledButtonIconStyle = {
    filter: selectFiles.length === 0 ? 'brightness(0.65)' : 'brightness(1)',
  };

  return (
    <>
      {actionsEnabled && (
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '2rem',
          }}
        >
          <Button
            onClick={handleSelectAllFiles}
            startIcon={<Icon color="#fff" icon={ICONS.select} size="1rem" />}
            sx={{
              lineHeight: 1.35,
            }}
            variant="contained"
          >
            すべて選択
          </Button>
          <Button
            disabled={selectFiles.length === 0}
            onClick={handleClearSelectedFiles}
            startIcon={<Icon color="#fff" icon={ICONS.unselect} size="1rem" style={disabledButtonIconStyle} />}
            sx={disabledButtonStyle}
            variant="contained"
          >
            すべての選択を解除
          </Button>
          <Button
            disabled={selectFiles.length === 0}
            onClick={handleDownloadFiles}
            startIcon={<Icon color="#fff" icon={ICONS.download} size="1rem" style={disabledButtonIconStyle} />}
            sx={disabledButtonStyle}
            variant="contained"
          >
            選択中のファイルをダウンロード
          </Button>
          <Button
            disabled={selectFiles.length === 0}
            onClick={handleDeleteFiles}
            startIcon={<Icon color="#fff" icon={ICONS.delete} size="1rem" style={disabledButtonIconStyle} />}
            sx={disabledButtonStyle}
            variant="contained"
          >
            選択中のファイルを削除
          </Button>
          {selectFiles.length > 0 && (
            <Typography>
              {selectFiles.length}件選択中（合計 {formatFileSize(totalSize)}）
            </Typography>
          )}
        </Box>
      )}

      <Grid
        container
        spacing={1.5}
        sx={{
          marginTop: '2rem',
        }}
      >
        {files.map(file => (
          <FileItem
            actionsEnabled={actionsEnabled}
            file={file}
            key={file.url}
            selectFiles={selectFiles}
            setSelectFiles={setSelectFiles}
          />
        ))}
      </Grid>

      {actionsEnabled && (
        <Backdrop
          isLoading={Boolean(loadingType)}
          text={loadingType ? (loadingType === 'download' ? 'ダウンロード' : '削除') : ''}
        />
      )}
    </>
  );
});
