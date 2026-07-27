import { useAuthContext } from '@/contexts';
import { Outlet, useLocation } from 'react-router-dom';
import { FullscreenLoader } from '../ui';
import { MainContainer } from './MainContainer';
import { Navigation } from './Navigation';

export const Layout = () => {
  const pathname = useLocation().pathname.split('/')[1];
  const isMenuPage = ['gallery', 'memo', 'project'].includes(pathname);
  const isFilePage = ['file'].includes(pathname);
  const isFullScreenPage = ['ai'].includes(pathname);
  const { isLoading } = useAuthContext();

  if (isLoading) {
    return <FullscreenLoader />;
  }

  const renderOutlet = () => {
    switch (true) {
      case isFilePage: {
        return <Outlet />;
      }
      case isMenuPage: {
        return <Outlet />;
      }
      case isFullScreenPage: {
        return <Outlet />;
      }
      case pathname === '': {
        return <Outlet />;
      }
      default: {
        return (
          <MainContainer>
            <Outlet />
          </MainContainer>
        );
      }
    }
  };

  return (
    <>
      <Navigation />
      {renderOutlet()}
    </>
  );
};
