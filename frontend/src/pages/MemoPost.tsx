import {
  BlockEditor,
  Breadcrumbs,
  EditableTable,
  FileGrid,
  FileUploader,
  Icon,
  Loader,
  NotFound,
  PageLoader,
  PageTitle,
} from '@/components/ui';
import { CreateTableButton, valueFormatters } from '@/components/ui/EditableTable/components';
import { ICONS } from '@/configs';
import { useFetchFile, useFetchMemo, useFetchTable, usePath } from '@/hooks';
import {
  removeMemoInvalidId,
  selectDirectoryFiles,
  selectMemoByPostId,
  selectMemoInvalidId,
  selectMemoTableByPostId,
  selectMemoTitleByPostId,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { bgWhite, center, fontSerif } from '@/styles';
import { theme } from '@/theme';
import type { AgGridTable, Tab } from '@/types';
import { normalizePath } from '@/utils';
import styled from '@emotion/styled';
import { alpha, Box, useMediaQuery } from '@mui/material';
import type { JSONContent } from '@tiptap/core';
import type { ColDef } from 'ag-grid-community';
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

const TabButton = styled.button<{ isActive: boolean }>`
  border-top: ${({ isActive }) => (isActive ? `1px solid ${theme.palette.primary.dark}` : 'none')};
  border-left: ${({ isActive }) => (isActive ? `1px solid ${theme.palette.primary.dark}` : 'none')};
  border-right: ${({ isActive }) => (isActive ? `1px solid ${theme.palette.primary.dark}` : 'none')};
  border-bottom: none;
  border-radius: 3px 3px 0 0;
  cursor: pointer;
  margin-right: 0.5rem;
  padding: 0.4rem 0.85rem;
  font-weight: 700;
  line-height: 1.35;
  font-size: 0.825rem;
  ${fontSerif}
  color: ${({ isActive }) => (isActive ? '#333' : theme.palette.secondary.main)};
  background-color: ${({ isActive }) => (isActive ? 'transparent' : alpha(theme.palette.secondary.main, 0.25))};
  position: relative;

  &:hover {
    background-color: ${({ isActive }) => (isActive ? 'transparent' : alpha(theme.palette.secondary.dark, 0.25))};
  }

  &::before {
    ${({ isActive }) =>
      isActive
        ? {
            bottom: -9,
            content: '""',
            height: '10px',
            left: 0,
            position: 'absolute',
            width: '100%',
            ...bgWhite,
            backgroundImage:
              'linear-gradient(180deg,rgba(247, 244, 240, 0.96),rgba(247, 244, 240, 0.93)),url(/img/noise.webp)',
          }
        : {}};
  }
`;

const MemoPost = () => {
  const { firstPath, pathname } = usePath();
  // '/file/'を除外 && 日本語をデコード && 末尾/なし
  const decodedPath = useMemo(() => normalizePath(pathname, { endSlash: 'remove' }), [pathname]);
  const { postId } = useParams();
  const [notFound, setNotFound] = useState(false);
  const title = useAppSelector(state => selectMemoTitleByPostId(state, Number(postId)));
  const { fetched, memo } = useAppSelector(state => selectMemoByPostId(state, Number(postId)));
  const { fetched: tableFetched, table } = useAppSelector(state => selectMemoTableByPostId(state, Number(postId)));
  const { fetched: fileFetched, files } = useAppSelector(selectDirectoryFiles(decodedPath));
  const invalidId = useAppSelector(selectMemoInvalidId);
  const dispatch = useAppDispatch();
  const { fetchFolderFiles } = useFetchFile();
  const { fetchMemo } = useFetchMemo();
  const { fetchTable } = useFetchTable();

  // データの取得 - Memo, Table
  useEffect(() => {
    // 削除処理
    if (invalidId.length > 0) {
      dispatch(removeMemoInvalidId(invalidId));
    }

    if (fetched || !postId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotFound(false);

    fetchMemo(postId)
      .then(response => {
        if (!response) {
          setNotFound(true);
          return;
        }
        // memoデータの取得後にtableデータを取得
        void fetchTable({ pathname: firstPath, postId });
      })
      .catch(() => {
        console.error('メモの取得に失敗しました');
      });
  }, [postId, dispatch, fetchMemo, fetchTable, firstPath]);

  // データの取得 - file一覧
  useEffect(() => {
    if (!fileFetched) {
      void fetchFolderFiles(decodedPath);
    }
  }, [decodedPath, fetchFolderFiles, fileFetched]);

  // EditableTableに渡すデータ
  const agGridData: AgGridTable | null = useMemo(() => {
    if (!tableFetched || !table) return null;

    const columnDefs = JSON.parse(table.columnData) as ColDef[];
    const columnData = columnDefs.map((col: ColDef) => ({
      ...col,
      ...(col.cellDataType === 'number' && {
        valueFormatter: valueFormatters.numberFormatter,
      }),
    }));

    return {
      ...table,
      columnData,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      rowData: JSON.parse(table.rowData),
    };
  }, [tableFetched, table]);

  // タブ
  const tabs: Tab[] = [
    {
      content: () => {
        if (!postId || !memo) return;
        return (
          <Box>
            <BlockEditor content={memo.content as JSONContent} key={`memo-${postId}`} outer tableOfContents />
          </Box>
        );
      },
      icon: ICONS.memo,
      id: 'memoMemo',
      label: 'メモ',
    },
    {
      content: () => {
        if (!postId) return;
        return (
          <>
            {tableFetched ? (
              <>
                {agGridData ? (
                  <Box>
                    <EditableTable
                      key={`memoTable-${postId}`}
                      pathname={firstPath}
                      postId={postId}
                      tableData={agGridData}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: '100%',
                      padding: '2rem 0',
                      ...center,
                    }}
                  >
                    <CreateTableButton pathname={firstPath} postId={postId} />
                  </Box>
                )}
              </>
            ) : (
              <Loader />
            )}
          </>
        );
      },
      icon: ICONS.table,
      id: 'memoTable',
      label: 'テーブル',
    },
    {
      content: () => {
        if (!postId) return;
        return (
          <Box>
            <FileUploader decodedPath={decodedPath} key={`memoUploader-${postId}`} />
            <FileGrid decodedPath={decodedPath} files={files} key={`memoGrid-${postId}`} />
          </Box>
        );
      },
      icon: ICONS.folder,
      id: 'memoFile',
      label: 'ファイル',
    },
  ];

  /**
   * タブ切り替え
   */
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
  const [focusIndex, setFocusIndex] = useState<null | number>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentIndex = tabs.findIndex(tab => tab.id === activeTab);

  useEffect(() => {
    // ページ遷移で初期化
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(tabs[0].id);
    setFocusIndex(null);
    tabRefs.current = [];
  }, [postId]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft': {
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      }
      case 'ArrowRight': {
        newIndex = (currentIndex + 1) % tabs.length;
        break;
      }
      case 'End': {
        newIndex = tabs.length - 1;
        break;
      }
      case 'Home': {
        newIndex = 0;
        break;
      }
      default: {
        return;
      }
    }

    e.preventDefault();
    setActiveTab(tabs[newIndex].id);
    setFocusIndex(newIndex);
  };

  // DOM更新後にフォーカスを当てる
  useEffect(() => {
    if (focusIndex !== null) {
      tabRefs.current[focusIndex]?.focus();
    }
  }, [focusIndex]);

  if (notFound) {
    return <NotFound />;
  }

  if (!fetched || !postId || !memo) {
    return <PageLoader />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
      }}
    >
      <Breadcrumbs
        breadcrumbs={[
          {
            path: '/memo',
            title: 'memo',
          },
          {
            path: `/memo/${postId}`,
            title: title ?? '',
          },
        ]}
      />
      <PageTitle key={`memoTitle-${postId}`} title={title ?? ''} />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          minHeight: '100%',
        }}
      >
        <Box
          aria-label="メモのタブメニュー"
          role="tablist"
          sx={{
            '&::before': {
              backgroundColor: theme.palette.primary.dark,
              bottom: 0,
              content: '""',
              height: '1px',
              left: '50%',
              position: 'absolute',
              transform: 'translateX(-50%)',
              width: 'calc(100% + min(10vw, 3rem))',
            },
            display: 'flex',
            flexGrow: 0,
            flexShrink: 0,
            flexWrap: 'nowrap',
            position: 'relative',
          }}
        >
          {tabs.map((tab, index) => (
            <TabButton
              aria-controls={`panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              id={`tab-${tab.id}`}
              isActive={activeTab === tab.id}
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
              }}
              onKeyDown={handleKeyDown}
              ref={el => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              <Icon
                color={activeTab === tab.id ? 'primary' : 'secondary'}
                icon={tab.icon}
                size={isMobile ? '1.4rem' : '1rem'}
                style={{
                  padding: isMobile ? '0 0.2rem' : '0',
                }}
              />
              <span
                style={{
                  display: isMobile ? 'none' : 'inline',
                  marginLeft: '0.35rem',
                }}
              >
                {tab.label}
              </span>
            </TabButton>
          ))}
        </Box>

        {tabs.map(tab => (
          <div
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            id={`panel-${tab.id}`}
            key={tab.id}
            role="tabpanel"
            style={{
              alignItems: 'stretch',
              display: activeTab === tab.id ? 'flex' : 'none',
              flexDirection: 'column',
              flexGrow: 1,
              minHeight: '100%',
              paddingTop: 'min(5vw, 1.5rem)',
            }}
          >
            {tab.content()}
          </div>
        ))}
      </Box>
    </Box>
  );
};

export default MemoPost;
