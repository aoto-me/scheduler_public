import { API_ENDPOINTS, ICONS } from '@/configs';
import { useHandleValidate, useHttpRequest, usePath } from '@/hooks';
import { center } from '@/styles';
import { Box, Button, CircularProgress, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { convertToRemixIcon, Icon } from './Icon';

interface SearchResult {
  id: number; // postIdに対応
  snippet: null | string;
  table: null | TableRow; // 対応する dataTable の行
  title: null | string;
}

interface TableRow {
  id: number; // dataTable の id
  page: string;
  postId: number; // SearchResult.id に対応
  snippet: string;
}

const highlightText = (text: string, keyword: string) => {
  if (!keyword.trim()) return text;

  // スペース区切りで分割（全角スペースも対応）
  const keywords = keyword
    .trim()
    .split(/[\s\u3000]+/)
    .filter(Boolean);

  if (keywords.length === 0) return text;

  // 正規表現で意味を持つ文字(. * + ? ^ $ { } ( ) | [ ] \)を探して、それぞれの前に \ を追加する
  // ⇒ ただの文字として扱うため
  const escaped = keywords.map(k => k.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`));

  // (検索ワード|検索ワード) の形にする
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    keywords.some(k => k.toLowerCase() === part.toLowerCase()) ? (
      <mark key={`highlight-${String(i)}`} style={{ backgroundColor: '#ffc4c4' }}>
        {part}
      </mark>
    ) : (
      <span key={`text-${String(i)}`}>{part}</span>
    )
  );
};

export const TextSearch = () => {
  const navigate = useNavigate();
  const { firstPath } = usePath();
  const searchWordRef = useRef('');
  const emptyResult = { key: '', val: [] };
  const [result, setResult] = useState<{ key: string; val: SearchResult[] }>(emptyResult);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const wordFromUrl = searchParams.get('word') ?? '';
  const { handleValidateText } = useHandleValidate();
  const { getRequest } = useHttpRequest();

  const handleSearch = useCallback(
    (word: string) => {
      if (word.trim().length === 0) {
        setResult(emptyResult);
        return;
      }

      setIsLoading(true);

      void getRequest<SearchResult[]>({
        apiUrl: `${API_ENDPOINTS.search}${firstPath}/`,
        queryParams: { word },
      })
        .then(response => {
          if (!response) {
            setResult(emptyResult);
            return;
          }
          setResult({ key: word, val: response });
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [handleValidateText, getRequest, firstPath]
  );

  useEffect(() => {
    if (!wordFromUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(emptyResult);
      return;
    }

    handleSearch(wordFromUrl);
  }, [wordFromUrl, handleSearch]);

  return (
    <>
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
            placeholder="検索"
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
              const word = searchWordRef.current;
              if (!word.trim()) {
                void navigate(`/${firstPath}`);
                return;
              }
              if (!handleValidateText(word, '検索ワード', 100)) return;
              setSearchParams({ word });
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
            {wordFromUrl.length > 0 ? `検索ワード：${wordFromUrl}` : '検索ワードを入力してください'}
          </Typography>
        )}

        {!isLoading && wordFromUrl.length > 0 && (
          <>
            {result.val.length === 0 ? (
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
                  該当するデータは見つかりませんでした
                </Typography>
              </Box>
            ) : (
              <Stack
                spacing={2}
                sx={{
                  mt: '2rem',
                }}
              >
                {result.val.map(item => (
                  <Paper
                    key={`${firstPath}-${String(item.id)}`}
                    onClick={() => navigate(`/${firstPath}/${String(item.id)}`)}
                    sx={{
                      '&:focus-visible': {
                        filter: 'brightness(0.94)',
                      },
                      '@media (hover: hover)': {
                        '&:hover': {
                          filter: 'brightness(0.94)',
                        },
                      },
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      p: 2,
                      transition: 'filter 0.3s ease-out',
                    }}
                    tabIndex={0}
                    variant="outlined"
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                      }}
                      variant="h6"
                    >
                      {item.title ?? ''}
                    </Typography>
                    {item.snippet && item.snippet.length > 0 && (
                      <Typography component="p" variant="caption">
                        {highlightText(item.snippet, result.key)}
                      </Typography>
                    )}
                    {item.table && item.table.snippet.length > 0 && (
                      <Typography component="p" variant="caption">
                        {highlightText(item.table.snippet, result.key)}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>
    </>
  );
};
