import { useAuthContext, useErrorContext } from '@/contexts';
import { Alert, Snackbar, type SnackbarCloseReason, Typography } from '@mui/material';
import { memo, type SyntheticEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const ErrorAlert = memo(() => {
  const { errors, setErrors } = useErrorContext();

  const handleClose = useCallback(
    (_event?: Event | SyntheticEvent, reason?: SnackbarCloseReason) => {
      if (reason === 'clickaway') return;
      setErrors([]);
    },
    [setErrors]
  );

  return (
    <Snackbar
      anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
      autoHideDuration={6000}
      onClose={handleClose}
      open={errors.length > 0}
      slotProps={{
        transition: {
          onExited: () => {
            setErrors([]);
          },
        },
      }}
    >
      <Alert
        onClose={handleClose}
        severity="error"
        sx={{
          backgroundColor: '#fff',
        }}
        variant={'outlined'}
      >
        {errors.map((error, index) => {
          return (
            <Typography
              color={'primary'}
              key={`error-${String(index)}`}
              sx={{
                display: 'block',
              }}
              variant={'body2'}
            >
              {error}
            </Typography>
          );
        })}
      </Alert>
    </Snackbar>
  );
});

export const SessionAlert = memo(() => {
  const { isSessionExpired, resetError } = useErrorContext();
  const { resetAuth, setEntryURL } = useAuthContext();
  const navigate = useNavigate();

  const logout = (_event?: Event | React.SyntheticEvent, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') return;
    resetError();
    resetAuth();
    setEntryURL(location.pathname);
    void navigate('/login');
  };

  return (
    <Snackbar anchorOrigin={{ horizontal: 'center', vertical: 'top' }} onClose={logout} open={isSessionExpired}>
      <Alert
        onClose={logout}
        severity="error"
        sx={{
          width: '100%',
        }}
        variant={'filled'}
      >
        セッションが切れました。再ログインが必要です。
        <br />
        このアラートを閉じるとログアウトを実行します。
      </Alert>
    </Snackbar>
  );
});
