import { ICONS } from '@/configs';
import { useErrorContext } from '@/contexts';
import { useSaveFile } from '@/hooks';
import { theme } from '@/theme';
import { formatFileSize, uploadFileValidator } from '@/utils';
import { Box, IconButton, Paper, Stack } from '@mui/material';
import { memo, useCallback, useMemo, useState } from 'react';
import { type FileRejection, type FileWithPath, useDropzone } from 'react-dropzone';
import { Backdrop } from './Backdrop';
import { PrimaryButton } from './Button';
import { Icon } from './Icon';

const baseStyle = {
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  border: '2px dashed',
  borderColor: theme.palette.divider,
  borderRadius: '6px',
  color: theme.palette.secondary.main,
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  height: '100%',
  justifyContent: 'center',
  minHeight: '130px',
  outline: 'none',
  padding: '1rem',
  transition: 'border .2s ease-out, background-color .2s ease-out',
  width: '100%',
};

const focusedStyle = {
  borderColor: theme.palette.secondary.dark,
};

const dragStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.15)',
  borderColor: theme.palette.secondary.dark,
  color: theme.palette.text.primary,
};

interface FileUploaderProps {
  decodedPath: string;
}

export const FileUploader = memo(({ decodedPath }: FileUploaderProps) => {
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { setErrors } = useErrorContext();
  const { uploadFile } = useSaveFile();

  const onDropAccepted = useCallback(
    (files: File[]) => {
      if (currentFiles.length <= 10) {
        const mixFiles = [...files, ...currentFiles];
        const uniqueFiles = [...new Map(mixFiles.map(file => [file.name, file])).values()];
        setCurrentFiles(uniqueFiles);
      } else {
        const errorMessage = '10ファイルを超えているため、こcれ以上はアップロードできません';
        setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
      }
    },
    [currentFiles, setErrors]
  );

  const onDropRejected = useCallback(
    (fileRejections: FileRejection[]) => {
      const errorMessage = new Set<string>();

      for (const rej of fileRejections) {
        for (const error of rej.errors) {
          if (error.code === 'too-many-files') {
            errorMessage.add('1度にアップロードできるのは10ファイルまでです');
          } else {
            errorMessage.add(`【${rej.file.name}】${error.message}`);
          }
        }
      }

      setErrors(prev => [...prev, ...[...errorMessage].filter(message => !prev.includes(message))]);
    },
    [setErrors]
  );

  const { acceptedFiles, getInputProps, getRootProps, isDragActive, isFocused } = useDropzone({
    maxFiles: 10,
    onDropAccepted,
    onDropRejected,
    validator: uploadFileValidator,
  });

  const handleRemoveFile = useCallback(
    (file: File) => {
      const newFiles = [...currentFiles];
      newFiles.splice(newFiles.indexOf(file), 1);
      setCurrentFiles(newFiles);
      (acceptedFiles as FileWithPath[]).splice(acceptedFiles.indexOf(file as FileWithPath), 1);
    },
    [currentFiles, acceptedFiles]
  );

  const handleSubmit = useCallback(() => {
    if (currentFiles.length === 0) return;

    // 合計サイズ（バイト単位）を計算
    const totalSize = currentFiles.reduce((acc, file) => acc + file.size, 0);
    const maxSize = 500 * 1024 * 1024; // 500MB
    // 上限超えなら中断
    if (totalSize > maxSize) {
      const errorMessage = 'ファイルの合計サイズが500MBを超えています';
      setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
      return;
    }

    setIsUploading(true);

    uploadFile({ files: currentFiles, path: decodedPath })
      .then(response => {
        if (!response) return;
        const { failedFiles } = response;
        const failedFileNames = new Set(failedFiles.map(file => file.name));
        setCurrentFiles(prev => prev.filter(file => failedFileNames.has(file.name)));
        for (const file of failedFiles) {
          const errorMessage = `【${file.name}】${file.error}`;
          setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
        }
      })
      .catch(() => {
        console.error('ファイルのアップロードに失敗しました');
      })
      .finally(() => {
        setIsUploading(false);
      });
  }, [currentFiles, decodedPath, setErrors, uploadFile]);

  const style = useMemo(
    () =>
      ({
        ...baseStyle,
        ...(isFocused ? focusedStyle : {}),
        ...(isDragActive ? dragStyle : {}),
      }) as React.CSSProperties,
    [isFocused, isDragActive]
  );

  return (
    <Box>
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p
            style={{
              fontSize: '0.9375rem',
            }}
          >
            ファイルをドロップ
          </p>
        ) : (
          <>
            <p
              style={{
                fontSize: '0.9375rem',
              }}
            >
              ファイルをドラッグ or クリックして選択
            </p>
            <p
              style={{
                fontSize: '0.825rem',
              }}
            >
              （1度のアップロードは10ファイル、合計500MBまで）
            </p>
          </>
        )}
      </div>
      {currentFiles.length > 0 && (
        <Stack component={'ul'} spacing={1} sx={{ marginTop: '20px' }}>
          {currentFiles.map((file, index) => (
            <Paper
              component="li"
              key={index}
              sx={{ marginBottom: '10px', padding: '8px 8px 8px 12px' }}
              variant="outlined"
            >
              <Stack
                direction={'row'}
                sx={{
                  alignItems: 'center',
                  flexWrap: 'nowrap',
                }}
              >
                <span
                  style={{
                    flexGrow: 0,
                    flexShrink: 0,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {index + 1}.
                </span>
                <p
                  style={{
                    fontSize: '0.875rem',
                    marginLeft: '0.25rem',
                    marginRight: '0.5rem',
                  }}
                >
                  {file.name} / {formatFileSize(file.size)}
                </p>
                <IconButton
                  aria-label="削除"
                  onClick={() => {
                    handleRemoveFile(file);
                  }}
                  size="small"
                  sx={{ flexGrow: 0, flexShrink: 0, marginLeft: 'auto' }}
                >
                  <Icon icon={ICONS.close} size="1rem" />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
      {currentFiles.length > 0 && (
        <PrimaryButton onClick={handleSubmit} sx={{ marginTop: '1.25rem' }}>
          ファイルをアップロード
        </PrimaryButton>
      )}
      <Backdrop isLoading={isUploading} />
    </Box>
  );
});
