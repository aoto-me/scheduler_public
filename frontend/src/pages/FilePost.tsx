import { FolderName } from '@/components/File';
import { Breadcrumbs, FileGrid, FileUploader, NotFound, PageLoader } from '@/components/ui';
import { useFetchFile, usePath } from '@/hooks';
import {
  removeFilesByDirectory,
  selectDirectoryFiles,
  selectInvalidDirectoryPath,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { normalizePath } from '@/utils';
import { memo, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

const FilePost = () => {
  const { pathname } = usePath();
  const { postId } = useParams();
  const [notFound, setNotFound] = useState(false);
  const { fetchFolderFiles } = useFetchFile();
  const dispatch = useAppDispatch();
  const invalidDirectoryPaths = useAppSelector(selectInvalidDirectoryPath);

  // '/file/'を除外 && 日本語をデコード && 末尾/なし
  const decodedPath = useMemo(() => normalizePath(pathname, { endSlash: 'remove' }), [pathname]);

  const { fetched, files } = useAppSelector(selectDirectoryFiles(decodedPath));

  useEffect(() => {
    // ファイル一覧の取得
    if (!fetched) {
      fetchFolderFiles(decodedPath)
        .then(response => {
          if (response) {
            setNotFound(false);
            return;
          }
          setNotFound(true);
        })
        .catch(() => {
          console.error('ファイル一覧の取得に失敗しました');
        });
    }
    // 削除予定のディレクトリがあれば削除を実行
    if (invalidDirectoryPaths.length > 0) {
      dispatch(removeFilesByDirectory(invalidDirectoryPaths));
    }
  }, [fetched, decodedPath, dispatch]);

  const pageTitle = useMemo(() => {
    const parts = decodedPath.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }, [decodedPath]);

  if (notFound) {
    return <NotFound />;
  }

  if (!fetched && files.length === 0) {
    return <PageLoader />;
  }

  return (
    <>
      <Breadcrumbs />
      <FolderName decodedPath={decodedPath} key={`folderName-${decodedPath}`} pageTitle={pageTitle} postId={postId} />
      <FileUploader decodedPath={decodedPath} key={`fileUploader-${decodedPath}`} />
      <FileGrid decodedPath={decodedPath} files={files} key={`fileGrid-${decodedPath}`} />
    </>
  );
};

export default memo(FilePost);
