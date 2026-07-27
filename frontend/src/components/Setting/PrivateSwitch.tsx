import { API_ENDPOINTS } from '@/configs';
import { useAuthContext } from '@/contexts';
import { useHttpRequest } from '@/hooks';
import { dotListStyle } from '@/styles';
import { Box, FormControlLabel, Paper, Switch, Typography } from '@mui/material';
import { memo, useCallback } from 'react';

export const PrivateSwitch = memo(() => {
  const { isPrivate, setIsPrivate } = useAuthContext();
  const { patchRequest } = useHttpRequest();

  // プライベートモードの切り替え
  const togglePrivate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsPrivate(event.target.checked);
      const mode = event.target.checked ? 1 : 0;
      void patchRequest({
        apiUrl: API_ENDPOINTS.user,
        data: { mode },
      });
    },
    [setIsPrivate, patchRequest]
  );

  return (
    <Box>
      {isPrivate !== null && (
        <>
          <FormControlLabel
            control={<Switch checked={isPrivate} name="privateMode" onChange={togglePrivate} />}
            label="プライベートモード"
            sx={{
              '& .MuiFormControlLabel-label': {
                fontWeight: 700,
              },
            }}
          />
          <Paper sx={{ marginTop: '0.5rem', padding: '1rem' }} variant="outlined">
            <Typography
              sx={{
                fontWeight: 700,
              }}
              variant={'body2'}
            >
              【プライベートモードを有効にすると、以下が非表示になります】
            </Typography>
            <ul
              style={{
                paddingLeft: '1.25rem',
              }}
            >
              <li style={dotListStyle}>
                カレンダー上での「プライベート」、「生活」、「趣味・勉強」、「休憩・睡眠」のToDoの表示
              </li>
              <li style={dotListStyle}>カレンダー上での年間イベントの表示</li>
              <li style={dotListStyle}>カレンダー上でのMoneyの表示</li>
              <li style={dotListStyle}>カレンダー上でのHealthの表示</li>
              <li style={dotListStyle}>カレンダー上でのDiaryの表示</li>
              <li style={dotListStyle}>Moneyページの表示</li>
              <li style={dotListStyle}>Healthページの表示</li>
            </ul>
          </Paper>
        </>
      )}
    </Box>
  );
});
