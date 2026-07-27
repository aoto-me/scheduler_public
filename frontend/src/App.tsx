import axios from 'axios';
import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { ErrorAlert, FullscreenLoader, SessionAlert } from './components/ui';
import { API_ENDPOINTS } from './configs';
import { useAuthContext } from './contexts';
import { usePullToRefreshInPWA } from './hooks';
import Home from './pages/Home';
import type { LoginResponse } from './types';

const AiChat = lazy(() => import('./pages/AiChat'));
const Gallery = lazy(() => import('./pages/Gallery'));
const GalleryIndex = lazy(() => import('./pages/GalleryIndex'));
const GalleryPost = lazy(() => import('./pages/GalleryPost'));
const GalleryPostSubPage = lazy(() => import('./pages/GalleryPostSubPage'));
const File = lazy(() => import('./pages/File'));
const FileIndex = lazy(() => import('./pages/FileIndex'));
const FilePost = lazy(() => import('./pages/FilePost'));
const Health = lazy(() => import('./pages/Health'));
const Login = lazy(() => import('./pages/Login'));
const Memo = lazy(() => import('./pages/Memo'));
const MemoIndex = lazy(() => import('./pages/MemoIndex'));
const MemoPost = lazy(() => import('./pages/MemoPost'));
const Money = lazy(() => import('./pages/Money'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Project = lazy(() => import('./pages/Project'));
const ProjectIndex = lazy(() => import('./pages/ProjectIndex'));
const ProjectPost = lazy(() => import('./pages/ProjectPost'));
const Setting = lazy(() => import('./pages/Setting'));
const Web = lazy(() => import('./pages/Web'));

const Loading = ({ isLoading }: { isLoading: boolean }) => {
  if (!isLoading) return null;
  return <FullscreenLoader />;
};

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    csrfToken,
    isAuthenticated,
    isLoading,
    resetAuth,
    setCsrfToken,
    setEntryURL,
    setIsAuthenticated,
    setIsLoading,
    setIsPrivate,
    setUserId,
    setUserName,
    userId,
    userName,
  } = useAuthContext();

  // 認証処理
  useEffect(() => {
    // 認証が完了していれば処理をスキップ
    if (isAuthenticated && userId !== 0 && userName !== '' && csrfToken !== '') {
      setIsLoading(false);
      return;
    }
    // ログイン認証
    setEntryURL(location.pathname);
    const isDev = import.meta.env.DEV;
    axios
      .get<LoginResponse>(API_ENDPOINTS.user, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'X-CSRF-Token': csrfToken,
        },
        params: {
          ts: Date.now(),
        },
        ...(isDev && { withCredentials: true }),
      })
      .then(response => {
        if (response.status === 200 && response.data.userId) {
          setUserId(response.data.userId);
          setUserName(response.data.userName);
          setIsPrivate(response.data.private === 1);
          setCsrfToken(response.data.csrfToken);
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      })
      .catch(() => {
        resetAuth();
        setIsLoading(false);
        void navigate('/login');
      });
  }, []);

  // PWAでの利用の場合、Pull to Refresh で更新できるようにする
  usePullToRefreshInPWA();

  return (
    <div className="App">
      <Loading isLoading={isLoading} />
      <Suspense fallback={<FullscreenLoader />}>
        <Routes>
          <Route element={<Login />} path="/login" />
          {isAuthenticated && userId && (
            <Route element={<Layout />} path="/">
              <Route element={<Home />} index />
              <Route element={<File />} path="/file">
                <Route element={<FileIndex />} index />
                <Route element={<FilePost />} path=":postId/*" />
              </Route>
              <Route element={<Gallery />} path="/gallery">
                <Route element={<GalleryIndex />} index />
                <Route element={<GalleryPost />} path=":postId">
                  <Route element={<GalleryPostSubPage />} path=":subPage" />
                </Route>
              </Route>
              <Route element={<AiChat />} path="/ai" />
              <Route element={<Health />} path="/health" />
              <Route element={<Memo />} path="/memo">
                <Route element={<MemoIndex />} index />
                <Route element={<MemoPost />} path=":postId" />
              </Route>
              <Route element={<Money />} path="/money" />
              <Route element={<Project />} path="/project">
                <Route element={<ProjectIndex />} index />
                <Route element={<ProjectPost />} path=":postId" />
              </Route>
              <Route element={<Web />} path="/web" />
              <Route element={<Setting />} path="/setting" />
              <Route element={<NotFound />} path="*" />
            </Route>
          )}
        </Routes>
      </Suspense>
      <ErrorAlert />
      <SessionAlert />
    </div>
  );
};

export default App;
