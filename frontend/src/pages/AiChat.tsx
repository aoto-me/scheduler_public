import { Icon } from '@/components/ui';
import { API_ENDPOINTS } from '@/configs';
import { useAuthContext } from '@/contexts';
import {
  addAiMessage,
  addFood,
  addFoodDB,
  addTodo,
  selectAiMessages,
  updateFood,
  updateTodo,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { bgBlack, bgWhite, dotListStyle, navHeight, navWidth, zIndexes } from '@/styles';
import { theme } from '@/theme';
import type { Food, FoodDB, Todo } from '@/types';
import CloseIcon from '@mui/icons-material/Close';
import { Box, CircularProgress, IconButton, Paper, TextField, Typography } from '@mui/material';
import axios, { isAxiosError } from 'axios';
import { format } from 'date-fns';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface AiResponse {
  message: string;
  registered: Food[];
  registeredFoodDB: FoodDB[];
  registeredTodos: Todo[];
  updated: Food[];
  updatedTodos: Todo[];
}

const MAX_IMAGE_PX = 1200;

const resizeImageToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.addEventListener('load', () => {
      URL.revokeObjectURL(objectUrl);
      let { height, width } = img;
      if (width > MAX_IMAGE_PX || height > MAX_IMAGE_PX) {
        if (width >= height) {
          height = Math.round((height * MAX_IMAGE_PX) / width);
          width = MAX_IMAGE_PX;
        } else {
          width = Math.round((width * MAX_IMAGE_PX) / height);
          height = MAX_IMAGE_PX;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    });
    img.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('画像の読み込みに失敗しました'));
    });
    img.src = objectUrl;
  });

const iconButtonStyle = {
  alignSelf: 'flex-end',
  flexShrink: 0,
  height: 40,
  marginBottom: '2px',
  width: 40,
};

const messageStyle = {
  maxWidth: { md: '75%', xs: '80%' },
  padding: '0.75rem 1rem',
};

const assistantMessageStyle = {
  backgroundColor: '#fff',
  border: `solid 1px ${theme.palette.divider}`,
  borderRadius: '0 14px 14px 14px',
  ...messageStyle,
};

const basePadding = 'min(5vw, 1.5rem)';

const AiChat = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<null | string>(null);
  const { csrfToken } = useAuthContext();
  const dispatch = useAppDispatch();
  const messages = useAppSelector(selectAiMessages);
  const todoTaskTimes = useAppSelector(state => state.todo.taskTimes);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const [inputAreaHeight, setInputAreaHeight] = useState(76);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const element = inputAreaRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setInputAreaHeight(element.getBoundingClientRect().height);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const dataUrl = await resizeImageToBase64(file);
      setImagePreviewUrl(dataUrl);
      setError(null);
    } catch {
      setError('画像の読み込みに失敗しました');
    }
  }, []);

  const handleImageClear = useCallback(() => {
    setImagePreviewUrl(null);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if ((!text && !imagePreviewUrl) || isLoading) return;

    setInput('');
    setError(null);
    setIsLoading(true);

    const capturedPreviewUrl = imagePreviewUrl;
    setImagePreviewUrl(null);

    dispatch(addAiMessage({ content: text, imageUrl: capturedPreviewUrl ?? undefined, role: 'user' }));

    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'yyyy-MM-dd HH:mm:00');

    const buildContent = (content: string, dataUrl?: null | string) => {
      if (!dataUrl) return content;
      return [
        {
          source: {
            data: dataUrl.slice(dataUrl.indexOf(',') + 1),
            media_type: 'image/jpeg' as const,
            type: 'base64' as const,
          },
          type: 'image' as const,
        },
        { text: content, type: 'text' as const },
      ];
    };

    const messagesForApi = messages.map(({ content, imageUrl, role }) => ({
      content: buildContent(content, imageUrl),
      role,
    }));
    const messagesWithNew = [
      ...messagesForApi,
      { content: buildContent(text, capturedPreviewUrl), role: 'user' as const },
    ];

    try {
      const data = await axios
        .post<AiResponse>(
          API_ENDPOINTS.ai,
          { messages: messagesWithNew, now, today },
          {
            headers: { 'X-CSRF-Token': csrfToken },
            withCredentials: import.meta.env.DEV,
          }
        )
        .then(r => r.data);

      const { message, registered, registeredFoodDB, registeredTodos, updated, updatedTodos } = data;

      dispatch(addAiMessage({ content: message, role: 'assistant' }));

      for (const food of registered) {
        dispatch(addFood(food));
      }
      for (const food of updated) {
        dispatch(updateFood(food));
      }
      for (const foodDb of registeredFoodDB) {
        dispatch(addFoodDB(foodDb));
      }
      for (const todo of registeredTodos) {
        dispatch(addTodo({ data: todo, taskTime: [] }));
      }
      for (const todo of updatedTodos) {
        dispatch(updateTodo({ data: todo, taskTime: todoTaskTimes[todo.id] ?? [] }));
      }
    } catch (error_) {
      let errorMessage = 'エラーが発生しました。もう一度お試しください。';
      if (isAxiosError(error_)) {
        const status = error_.response?.status;
        const errorData = error_.response?.data as undefined | { error?: string };
        if (status === 429) {
          errorMessage = 'リクエストが速すぎます。10秒後に再試行してください。';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [csrfToken, dispatch, imagePreviewUrl, input, isLoading, messages]);

  return (
    <Box
      sx={{
        minHeight: {
          md: '100dvh',
          xs: `calc(100dvh - ${navHeight})`,
        },
        paddingBottom: {
          md: '0',
          xs: navHeight,
        },
        paddingLeft: {
          md: `calc(${navWidth} + ${basePadding})`,
          xs: basePadding,
        },
        paddingRight: basePadding,
        paddingTop: basePadding,
      }}
    >
      {messages.length === 0 ? (
        <Box
          sx={{
            alignItems: 'center',
            color: theme.palette.text.secondary,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            justifyContent: 'center',
            minHeight: {
              md: 'calc(100dvh - min(15vw, 6rem))',
              xs: `calc(100dvh - ${navHeight} - min(15vw, 6rem))`,
            },
          }}
        >
          <Typography variant="body2">AI機能は開発中です</Typography>
          <Paper
            sx={{
              backgroundColor: '#ffffff8a',
              marginTop: '0.5rem',
              padding: '1rem',
            }}
            variant="outlined"
          >
            <Typography
              sx={{
                fontWeight: 700,
                textAlign: 'center',
              }}
              variant={'body2'}
            >
              現在できること
            </Typography>
            <ul
              style={{
                paddingLeft: '1.25rem',
              }}
            >
              <li style={dotListStyle}>テキストでのToDoの登録</li>
              <li style={dotListStyle}>テキストでの食事記録の登録</li>
              <li style={dotListStyle}>栄養成分表の画像からの食事記録の登録</li>
            </ul>
          </Paper>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              margin: '0 auto',
              maxWidth: '900px',
              pb: `${String(inputAreaHeight)}px`,
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={`messages-${String(index)}`}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: { md: 2.5, xs: 2 },
                }}
              >
                {msg.role === 'user' ? (
                  <Box
                    sx={{
                      ...bgBlack,
                      borderRadius: '14px 14px 0 14px',
                      ...messageStyle,
                    }}
                  >
                    {msg.imageUrl && (
                      <Box sx={{ mb: msg.content ? 0.75 : 0 }}>
                        <img
                          alt="添付画像"
                          src={msg.imageUrl}
                          style={{
                            borderRadius: '8px',
                            display: 'block',
                            maxHeight: '200px',
                            maxWidth: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </Box>
                    )}
                    {msg.content && (
                      <Typography
                        sx={{
                          '&::selection': {
                            backgroundColor: '#818181',
                          },
                          color: 'inherit',
                          fontSize: '0.9rem',
                          lineHeight: 1.65,
                        }}
                      >
                        {msg.content}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      '& hr': {
                        backgroundColor: theme.palette.divider,
                        border: 'none',
                        color: theme.palette.divider,
                        height: '1px',
                        margin: '1rem 0',
                      },
                      '& li': { lineHeight: 1.65 },
                      '& ol': { fontSize: '0.9rem', listStyleType: 'decimal', pl: '20px' },
                      '& ol > li': { listStyle: 'decimal' },
                      '& p': { fontSize: '0.9rem', lineHeight: 1.65, my: 0.5 },
                      '& strong': { fontWeight: 700 },
                      '& ul': { fontSize: '0.9rem', listStyleType: 'disc', pl: '20px' },
                      '& ul > li': { listStyle: 'disc' },
                      ...assistantMessageStyle,
                    }}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </Box>
                )}
              </Box>
            ))}

            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: 0.75,
                    ...assistantMessageStyle,
                  }}
                >
                  <CircularProgress color="secondary" size={14} />
                  <Typography
                    color="text.secondary"
                    sx={{
                      margin: '0.25rem 0 0 0.25rem',
                    }}
                    variant="caption"
                  >
                    考え中...
                  </Typography>
                </Box>
              </Box>
            )}

            {error && (
              <Box
                sx={{
                  backgroundColor: '#fff',
                  border: `1px solid ${theme.palette.error.main}`,
                  borderRadius: '6px',
                  mb: { md: 2.5, xs: 2 },
                  padding: '0.75rem 1rem',
                }}
              >
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>
        </>
      )}

      {/* 入力エリア */}
      <Box
        ref={inputAreaRef}
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          bottom: {
            md: 0,
            xs: navHeight,
          },
          pb: { md: 2, xs: 1.5 },
          position: 'fixed',
          pt: { md: 2, xs: 1.5 },
          right: basePadding,
          width: {
            md: `calc(100% - ${navWidth} - min(10vw, 3rem))`,
            xs: 'calc(100% - min(10vw, 3rem))',
          },
          zIndex: zIndexes.navigation - 1,
          ...bgWhite,
        }}
      >
        {imagePreviewUrl && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'inline-block', position: 'relative' }}>
              <img
                alt="プレビュー"
                src={imagePreviewUrl}
                style={{
                  borderRadius: '3px',
                  display: 'block',
                  maxHeight: '80px',
                  maxWidth: '120px',
                  objectFit: 'cover',
                }}
              />
              <IconButton
                aria-label="画像を削除"
                onClick={handleImageClear}
                size="small"
                sx={{
                  '@media (hover: hover)': {
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' },
                  },
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  height: 18,
                  padding: 0,
                  position: 'absolute',
                  right: -6,
                  top: -6,
                  width: 18,
                }}
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <input
            accept="image/*"
            onChange={e => void handleFileSelect(e)}
            ref={fileInputRef}
            style={{ display: 'none' }}
            type="file"
          />
          <IconButton
            aria-label="画像を添付"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              color: imagePreviewUrl ? theme.palette.primary.main : theme.palette.text.secondary,
              ...iconButtonStyle,
            }}
          >
            <Icon icon="RiAttachment2" />
          </IconButton>

          <TextField
            disabled={isLoading}
            fullWidth
            helperText={input.length > 450 ? `${String(input.length)} / 500` : undefined}
            inputRef={inputRef}
            maxRows={4}
            multiline
            onChange={e => {
              setInput(e.target.value);
            }}
            placeholder="メッセージを入力"
            slotProps={{ htmlInput: { maxLength: 500 } }}
            sx={{
              '.MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                padding: 0,
              },
              textarea: {
                lineHeight: 1.5,
                padding: 1.25,
              },
            }}
            value={input}
          />

          <IconButton
            aria-label="送信"
            disabled={(!input.trim() && !imagePreviewUrl) || isLoading}
            onClick={() => void handleSend()}
            sx={{
              '&:not(:disabled)': { ...bgBlack },
              '@media (hover: hover)': {
                '&:hover': {
                  backgroundImage:
                    'linear-gradient(180deg, rgba(70, 70, 70, 0.93), rgba(70, 70, 70, 0.93)), url(/img/noise.webp)',
                },
              },
              ...iconButtonStyle,
            }}
          >
            <Icon
              color={(!input.trim() && !imagePreviewUrl) || isLoading ? undefined : '#fff'}
              icon="RiSendPlaneFill"
            />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default AiChat;
