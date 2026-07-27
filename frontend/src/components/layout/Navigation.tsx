import { API_ENDPOINTS } from '@/configs';
import { useAuthContext, useErrorContext } from '@/contexts';
import { bgBlack, fontSerif, navHeight, navWidth, scrollbarBlack, zIndexes } from '@/styles';
import { theme } from '@/theme';
import AccessibilityNewSharpIcon from '@mui/icons-material/AccessibilityNewSharp';
import AutoAwesomeSharpIcon from '@mui/icons-material/AutoAwesomeSharp';
import CollectionsSharpIcon from '@mui/icons-material/CollectionsSharp';
import EventNoteSharpIcon from '@mui/icons-material/EventNoteSharp';
import FeedSharpIcon from '@mui/icons-material/FeedSharp';
import FolderSharpIcon from '@mui/icons-material/FolderSharp';
import LogoutSharpIcon from '@mui/icons-material/LogoutSharp';
import PaymentsSharpIcon from '@mui/icons-material/PaymentsSharp';
import SettingsSharpIcon from '@mui/icons-material/SettingsSharp';
import WebSharpIcon from '@mui/icons-material/WebSharp';
import WorkSharpIcon from '@mui/icons-material/WorkSharp';
import { BottomNavigation, BottomNavigationAction, Box, Container, useMediaQuery } from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationItemType {
  icon: React.ReactNode;
  path: string;
  text: string;
}

const iconStyle = {
  color: 'inherit',
  filter: 'drop-shadow(-1px -1px 0px #000)',
  fontSize: { md: '1.5rem', xs: '1.25rem' },
};

const navigationItems: NavigationItemType[] = [
  {
    icon: <EventNoteSharpIcon sx={{ ...iconStyle }} />,
    path: '/',
    text: 'calendar',
  },
  {
    icon: <WorkSharpIcon sx={{ ...iconStyle }} />,
    path: '/project',
    text: 'project',
  },
  {
    icon: <FeedSharpIcon sx={{ ...iconStyle }} />,
    path: '/memo',
    text: 'memo',
  },
  {
    icon: <CollectionsSharpIcon sx={{ ...iconStyle }} />,
    path: '/gallery',
    text: 'gallery',
  },
  {
    icon: <PaymentsSharpIcon sx={{ ...iconStyle }} />,
    path: '/money',
    text: 'money',
  },
  {
    icon: <AccessibilityNewSharpIcon sx={{ ...iconStyle }} />,
    path: '/health',
    text: 'health',
  },
  {
    icon: <FolderSharpIcon sx={{ ...iconStyle }} />,
    path: '/file',
    text: 'file',
  },
  {
    icon: <WebSharpIcon sx={{ ...iconStyle }} />,
    path: '/web',
    text: 'web',
  },
  {
    icon: <AutoAwesomeSharpIcon sx={{ ...iconStyle }} />,
    path: '/ai',
    text: 'ai chat',
  },
  {
    icon: <SettingsSharpIcon sx={{ ...iconStyle }} />,
    path: '/setting',
    text: 'setting',
  },
  {
    icon: <LogoutSharpIcon sx={{ ...iconStyle }} />,
    path: '/logout',
    text: 'logout',
  },
];

export const Navigation = () => {
  const navigate = useNavigate();
  const pathname = useLocation().pathname.split('/')[1];
  const { csrfToken, resetAuth, setEntryURL } = useAuthContext();
  const { resetError, setErrors } = useErrorContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [path, setPath] = useState('/');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPath(`/${pathname}`);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.key !== 'n') return;

      const nav = document.querySelector<HTMLElement>('#main-navigation');
      const firstButton = nav?.querySelector<HTMLElement>('button');
      if (firstButton) {
        e.preventDefault();
        firstButton.focus();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    const isDev = import.meta.env.DEV;
    axios
      .delete(API_ENDPOINTS.user, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        ...(isDev && { withCredentials: true }),
      })
      .then(response => {
        if (response.status === 204) {
          // ログアウト成功
          resetError();
          resetAuth();
          setEntryURL('/');
          void navigate('/login', { replace: true });
        } else {
          throw new Error(`Unexpected response: ${String(response.status)}`);
        }
      })
      .catch((error: unknown) => {
        setErrors(prev => (prev.includes('ログアウトに失敗しました') ? prev : [...prev, 'ログアウトに失敗しました']));
        if (import.meta.env.DEV) console.error(error);
      });
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === '/logout') {
      handleLogout();
    } else {
      void navigate(newValue);
    }
  };

  return (
    <Container
      component="header"
      disableGutters
      sx={{
        backgroundColor: '#fff',
        bottom: { md: 'auto', xs: 0 },
        height: { md: '100vh', xs: navHeight },
        left: 0,
        position: 'fixed',
        top: { md: 0, xs: 'auto' },
        width: { md: navWidth, xs: '100%' },
        zIndex: zIndexes.navigation,
      }}
    >
      <Box
        sx={{
          // スクロールバーを含むため、ここにpaddingを含めない
          ...bgBlack,
          height: '100%',
          overflowX: { md: 'hidden', xs: 'auto' },
          overflowY: { md: 'auto', xs: 'hidden' },
          width: '100%',
          ...scrollbarBlack,
        }}
      >
        <BottomNavigation
          aria-label="メイン"
          id="main-navigation"
          onChange={handleChange}
          role="navigation"
          showLabels={!isMobile}
          sx={{
            '& button + button': {
              margin: { md: '6px 0 0 0', xs: '0 0 0 6px' },
            },
            backgroundColor: 'transparent',
            display: 'flex',
            flexDirection: { md: 'column', xs: 'row' },
            height: 'fit-content',
            justifyContent: { md: 'flex-start', xs: 'space-between' },
            minHeight: '100%',
            padding: { md: 1.5, xs: 1 },
          }}
          value={path}
        >
          {navigationItems.map((item, index) => (
            <BottomNavigationAction
              icon={item.icon}
              key={`navigation-${String(index)}`}
              label={item.text}
              sx={{
                '&.Mui-selected': {
                  color: '#fff',
                },
                '& .MuiBottomNavigationAction-label': {
                  ...fontSerif,
                  color: 'inherit',
                  display: { md: 'block', xs: 'none' },
                  filter: 'drop-shadow(-1px -1px 0px #000)',
                  fontSize: '0.7rem !important',
                  fontWeight: '500',
                  letterSpacing: '0.075em',
                  textTransform: 'capitalize',
                },
                aspectRatio: '1/1',
                backgroundColor: 'transparent',
                borderRadius: '3px',
                color: '#ffffff73',
                flexGrow: 0,
                minWidth: {
                  md: `calc(${navWidth} - 1.5rem)`,
                  xs: `calc(${navHeight} - 1rem)`,
                },
                padding: { md: '0.5rem 0', xs: '0' },
                width: { md: '100%', xs: 'auto' },
                ...(index === navigationItems.length - 2 ? { marginBottom: { md: '6px !important' } } : {}),
                ...(index === navigationItems.length - 1
                  ? {
                      margin: {
                        md: 'auto 0 0 0 !important',
                      },
                    }
                  : {}),
                '@media (hover: hover)': {
                  '&:hover': {
                    backgroundColor: '#76767657',
                  },
                },
                transition: 'background 0.3s ease-out',
              }}
              value={item.path}
            />
          ))}
        </BottomNavigation>
      </Box>
    </Container>
  );
};
