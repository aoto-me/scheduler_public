import { convertToRemixIcon, FileGrid, Icon } from '@/components/ui';
import { ICONS } from '@/configs';
import { useFetchFile, useHandleValidate } from '@/hooks';
import { center } from '@/styles';
import type { FileItem } from '@/types';
import { Box, Button, CircularProgress, InputAdornment, TextField, Typography } from '@mui/material';
import { useCallback, useRef, useState } from 'react';

const FileIndex = () => {
  const searchWordRef = useRef('');
  const [result, setResult] = useState<FileItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchWord, setSearchWord] = useState('');
  const { searchFiles } = useFetchFile();
  const { handleValidateText } = useHandleValidate();

  const handleSearch = useCallback(
    (word: string) => {
      if (word.trim().length === 0) {
        setResult(null);
        setSearchWord('');
        return;
      }

      if (!handleValidateText(word, '検索ワード', 100)) return;

      setIsLoading(true);
      setSearchWord(word);
      searchFiles(word)
        .then(response => {
          if (!response) {
            setResult(null);
          }
          setResult(response);
        })
        .catch(() => {
          console.error('検索に失敗しました');
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [searchFiles, handleValidateText]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box
        sx={{
          alignItems: 'stretch',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem',
        }}
      >
        <TextField
          autoComplete="off"
          onChange={e => (searchWordRef.current = e.target.value)}
          placeholder="ファイル検索"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon={ICONS.search} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: '4px 0 0 4px',
            },
            backgroundColor: '#fff',
            borderRadius: '4px 0 0 4px',
          }}
          type="search"
        />
        <Button
          onClick={() => {
            handleSearch(searchWordRef.current);
          }}
          sx={{
            borderRadius: '0 4px 4px 0',
          }}
          variant="contained"
        >
          検索
        </Button>
      </Box>

      {isLoading ? (
        <Box
          sx={{
            flexDirection: 'column',
            flexGrow: 1,
            paddingBottom: '4rem',
            paddingTop: '1rem',
            ...center,
          }}
        >
          <Typography
            color="secondary"
            sx={{
              marginBottom: '0.5rem',
            }}
            variant="caption"
          >
            検索中...
          </Typography>
          <CircularProgress color="secondary" size={20} />
        </Box>
      ) : (
        <Typography
          sx={{
            textAlign: 'center',
          }}
        >
          {searchWord.length > 0 ? `検索ワード：${searchWord}` : '検索ワードを入力してください'}
        </Typography>
      )}

      {!isLoading && result && (
        <>
          {result.length === 0 ? (
            <Box
              sx={{
                flexDirection: 'column',
                flexGrow: 1,
                padding: '4rem',
                ...center,
              }}
            >
              <Icon icon={convertToRemixIcon('file-close-line')} />
              <Typography
                color="textDisabled"
                sx={{
                  marginTop: '0.5rem',
                  textAlign: 'center',
                }}
              >
                該当するファイルは見つかりませんでした
              </Typography>
            </Box>
          ) : (
            <FileGrid actionsEnabled={false} decodedPath="" files={result} />
          )}
        </>
      )}
    </Box>
  );
};

export default FileIndex;
