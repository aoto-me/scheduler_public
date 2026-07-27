import { bgWhite, drawerHeader, drawerWidth, navHeight, navWidth, scrollbarWhite, zIndexes } from '@/styles';
import { theme } from '@/theme';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileDrawerContent, FileDrawerHeader } from '../File';
import { NotFound } from '../ui';
import { DrawerMenuContent } from './MenuDrawerContent';
import { DrawerMenuHeader } from './MenuDrawerHeader';

const Main = styled('main', { shouldForwardProp: prop => prop !== 'open' })<{
  open?: boolean;
}>(({ theme }) => ({
  // 基本のスタイル
  flexGrow: 1,
  marginLeft: `calc(-1 * ${drawerWidth})`,
  minHeight: '100svh',
  padding: `4.75rem min(5vw, 1.5rem) calc(${navHeight} + 2rem) min(5vw, 1.5rem)`,
  [theme.breakpoints.up('md')]: {
    padding: '4.75rem min(5vw, 1.5rem) 2rem min(5vw, 1.5rem)',
    width: `calc(100% - ${navWidth})`,
  },
  transition: theme.transitions.create(['margin', 'padding'], {
    duration: theme.transitions.duration.leavingScreen,
    easing: theme.transitions.easing.sharp,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: 0,
        padding: `2rem min(5vw, 1.5rem) calc(${navHeight} + 2rem)`,
        // メディアクエリ
        [theme.breakpoints.down('sm')]: {
          marginLeft: `calc(-1 * ${drawerWidth})`,
          padding: `4.75rem min(5vw, 1.5rem) calc(${navHeight} + 2rem) min(5vw, 1.5rem)`,
          width: '100%',
        },
        [theme.breakpoints.up('md')]: {
          padding: '2rem min(5vw, 1.5rem)',
          width: `calc(100% - ${navWidth} - ${drawerWidth})`,
        },
        // トランジション(共通)
        transition: theme.transitions.create(['margin', 'padding'], {
          duration: theme.transitions.duration.enteringScreen,
          easing: theme.transitions.easing.easeOut,
        }),
        width: `calc(100% - ${drawerWidth})`,
      },
    },
  ],
  width: '100%',
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  alignItems: 'center',
  backgroundColor: '#fff',
  borderBottom: `solid 1px ${theme.palette.divider}`,
  borderRight: `solid 1px ${theme.palette.divider}`,
  display: 'flex',
  gap: '0.5rem',
  justifyContent: 'flex-end',
  left: 'auto',
  length: 0,
  padding: '0.5rem',
  position: 'fixed',
  top: 0,
  width: drawerWidth,
  zIndex: 1,
}));

interface DrawerLeftProps {
  children: React.ReactNode;
}

export const DrawerLeft = ({ children }: DrawerLeftProps) => {
  const pathname = useLocation().pathname.split('/')[1];
  const isMenuPage = ['gallery', 'memo', 'project'].includes(pathname);
  const isFilePage = ['file'].includes(pathname);
  const [open, setOpen] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);

  const debouncedSetFilterText = useMemo(
    () =>
      debounce((value: string) => {
        setFilterText(value);
      }, 350),
    []
  );

  const handleSetFilterText = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetFilterText(event.target.value);
  };

  const renderDrawerContent = () => {
    switch (true) {
      case isFilePage: {
        return <FileDrawerContent />;
      }
      case isMenuPage: {
        return <DrawerMenuContent filterText={filterText} isUpdate={isUpdate} setIsUpdate={setIsUpdate} />;
      }
      default: {
        return <NotFound />;
      }
    }
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.key !== 'b') return;
      e.preventDefault();
      setOpen(prev => !prev);
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      <IconButton
        aria-controls="drawer"
        aria-expanded={open ? 'true' : 'false'}
        aria-label="ドロワーを開く"
        inert={open}
        onClick={handleDrawerOpen}
        sx={[
          {
            ...bgWhite,
            '@media (hover: hover)': {
              '&:hover': {
                filter: 'brightness(0.85)',
              },
            },
            border: '1px solid',
            borderColor: 'primary.main',
            left: { md: `calc(${navWidth} + 20px)`, xs: 'min(5vw, 24px)' },
            position: 'fixed',
            top: 15,
            zIndex: zIndexes.drawerLeft - 1,
          },
        ]}
      >
        <MenuIcon color={'primary'} />
      </IconButton>

      <Drawer
        anchor="left"
        id="drawer"
        inert={!open}
        open={open}
        sx={{
          '& .MuiDrawer-paper': {
            borderRadius: 0,
            boxSizing: 'border-box',
            paddingLeft: { md: navWidth, xs: 0 },
            width: {
              md: `calc(${drawerWidth} + ${navWidth})`,
              xs: drawerWidth,
            },
          },
          flexShrink: 0,
          width: {
            md: `calc(${drawerWidth} + ${navWidth})`,
            xs: drawerWidth,
          },
        }}
        variant="persistent"
      >
        <DrawerHeader>
          {isFilePage && <FileDrawerHeader />}
          {isMenuPage && <DrawerMenuHeader onChange={handleSetFilterText} setIsUpdate={setIsUpdate} />}
          <IconButton aria-label="ドロワーを閉じる" onClick={handleDrawerClose} size="small">
            {theme.direction === 'ltr' ? (
              <ChevronLeftIcon color={'secondary'} sx={{ fontSize: '1.25rem' }} />
            ) : (
              <ChevronRightIcon color={'secondary'} sx={{ fontSize: '1.25rem' }} />
            )}
          </IconButton>
        </DrawerHeader>

        <Box
          sx={{
            padding: {
              md: `calc(${drawerHeader} + 0.5rem) 0.5rem 0.5rem 0.5rem`,
              xs: `calc(${drawerHeader} + 0.5rem) 0.5rem calc(${navHeight} + 0.5rem) 0.5rem`,
            },
            ...scrollbarWhite,
            overflowY: 'auto',
          }}
        >
          {renderDrawerContent()}
        </Box>
      </Drawer>

      <Main open={open}>{children}</Main>
    </Box>
  );
};
