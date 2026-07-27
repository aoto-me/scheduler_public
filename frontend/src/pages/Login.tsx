import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import axios, { AxiosError, isAxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Icon, PrimaryButton } from '../components/ui';
import { API_ENDPOINTS, ICONS } from '../configs';
import { useAuthContext } from '../contexts';
import { bgBlack, center } from '../styles';
import { theme } from '../theme';
import type { ErrorResponse, LoginResponse } from '../types';
import { loginSchema, type LoginSchema } from '../validations/schema';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [responseErrorMessage, setResponseErrorMessage] = useState('');
  const { entryURL, isAuthenticated, setCsrfToken, setIsAuthenticated, setIsPrivate, setUserId, setUserName } =
    useAuthContext();
  const isDev = import.meta.env.DEV;

  // reactHookForm
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginSchema>({
    defaultValues: {
      password: '',
      userName: '',
    },
    resolver: zodResolver(loginSchema),
  });

  // ページ遷移の処理
  const handleNavigation = useCallback(
    (url: string) => {
      void navigate(url === '/login' ? '/' : url);
    },
    [navigate]
  );

  // 既に認証済みなら、最初にアクセスしたページへ移動
  useEffect(() => {
    if (isAuthenticated) handleNavigation(entryURL);
  }, [isAuthenticated, entryURL, handleNavigation]);

  // ログイン処理
  const onSubmit = async (data: LoginSchema) => {
    setIsLoading(true);
    setResponseErrorMessage('');
    try {
      const response = await axios.post<LoginResponse>(API_ENDPOINTS.user, data, {
        ...(isDev && { withCredentials: true }),
      });
      if (response.status === 200) {
        setIsLoading(false);
        setIsPrivate(response.data.private === 1);
        setUserId(response.data.userId);
        setUserName(response.data.userName);
        setCsrfToken(response.data.csrfToken);
        setIsAuthenticated(true);
        handleNavigation(entryURL);
      } else {
        throw new Error(`Unexpected response: ${String(response.status)}`);
      }
    } catch (error) {
      let errorMessage = 'ネットワークエラーが発生しました';

      if (isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>;
        if (axiosError.response) {
          const { data, status } = axiosError.response;
          switch (status) {
            case 400: {
              errorMessage = data.error || 'ユーザー名またはパスワードが未入力です';
              break;
            }
            case 401: {
              errorMessage = data.error || 'ユーザー名またはパスワードが不正です';
              break;
            }
            case 403: {
              errorMessage = data.error || '利用が制限されています';
              break;
            }
            case 500: {
              errorMessage = data.error || 'サーバーエラーが発生しました';
              break;
            }
            default: {
              errorMessage = 'ログインに失敗しました';
              break;
            }
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
      }

      setResponseErrorMessage(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <Container
      component="main"
      inert={isLoading}
      sx={{
        ...center,
        minHeight: '100svh',
        p: 3,
      }}
    >
      <Paper
        sx={{
          borderColor: theme.palette.primary.main,
          maxWidth: '400px',
          overflow: 'hidden',
          width: '100%',
        }}
        variant="outlined"
      >
        <Box
          sx={{
            ...bgBlack,
            lineHeight: 1,
            padding: 1.5,
            textAlign: 'center',
          }}
        >
          <Icon color="#fff" icon={ICONS.lockFill} />
        </Box>
        <Stack
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          spacing={3}
          sx={{
            padding: 4,
          }}
        >
          <TextField
            {...register('userName')}
            autoComplete="off"
            error={!!errors.userName}
            fullWidth
            helperText={errors.userName?.message}
            id="userName"
            label="UserName"
            required
            type="text"
            variant="outlined"
          />
          <TextField
            {...register('password')}
            autoComplete="off"
            error={!!errors.password}
            fullWidth
            helperText={errors.password?.message}
            id="password"
            label="Password"
            name="password"
            required
            type="password"
            variant="outlined"
          />
          {responseErrorMessage !== '' && (
            <Typography color="error" variant="caption">
              {responseErrorMessage}
            </Typography>
          )}
          <PrimaryButton loading={isLoading} type="submit">
            ログイン
          </PrimaryButton>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Login;
