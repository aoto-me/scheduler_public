import { TodoForm } from '@/components/Home';
import { EndDate, KanbanBoard, TaskTimeBar } from '@/components/Project';
import {
  BlockEditor,
  Breadcrumbs,
  EditableTable,
  FileGrid,
  FileUploader,
  Icon,
  Loader,
  Modal,
  NotFound,
  PageLoader,
  PageTitle,
  SectionTitle,
} from '@/components/ui';
import { CreateTableButton, valueFormatters } from '@/components/ui/EditableTable/components';
import { ICONS } from '@/configs';
import { useFetchFile, useFetchProject, useFetchTable, useModalFocusRestore, usePath } from '@/hooks';
import {
  removeProjectInvalidId,
  selectDirectoryFiles,
  selectProjectByPostId,
  selectProjectInvalidId,
  selectProjectTableByPostId,
  selectProjectTitleByPostId,
  selectSectionFetched,
  selectSectionIdsByPostId,
  selectSectionMap,
  selectTaskTimes,
  selectTodoById,
  selectTodoIdsByProject,
  selectTodoMapByProject,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { bgWhite, center, fontSerif } from '@/styles';
import { theme } from '@/theme';
import type { AgGridTable, Tab } from '@/types';
import { normalizePath } from '@/utils';
import { rectSortingStrategy } from '@dnd-kit/sortable';
import styled from '@emotion/styled';
import { alpha, Box, Stack, useMediaQuery } from '@mui/material';
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

const ProjectPost = () => {
  const { firstPath, pathname } = usePath();
  const { postId } = useParams();
  const [notFound, setNotFound] = useState(false);
  const invalidId = useAppSelector(selectProjectInvalidId);
  // project
  const { fetched, project } = useAppSelector(state => selectProjectByPostId(state, Number(postId)));
  const { fetched: tableFetched, table } = useAppSelector(state => selectProjectTableByPostId(state, Number(postId)));
  const title = useAppSelector(state => selectProjectTitleByPostId(state, Number(postId)));
  const sectionFetched = useAppSelector(selectSectionFetched);
  const sectionMap = useAppSelector(selectSectionMap);
  // file
  const decodedPath = useMemo(() => normalizePath(pathname, { endSlash: 'remove' }), [pathname]); // '/file/'を除外 && 日本語をデコード && 末尾/なし
  const { fetched: fileFetched, files } = useAppSelector(selectDirectoryFiles(decodedPath));
  // todo
  const todoMapByProject = useAppSelector(state => selectTodoMapByProject(state, Number(postId)));
  const taskTimes = useAppSelector(selectTaskTimes);
  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinish, setIsFinish] = useState(true);
  const [currentTodoId, setCurrentTodoId] = useState<number>(0);
  const currentTodo = useAppSelector(state => selectTodoById(state, currentTodoId));
  const [isSectionId, setIsSectionId] = useState<null | string>(null);
  // hooks
  const dispatch = useAppDispatch();
  const { fetchFolderFiles } = useFetchFile();
  const { fetchProjectData, fetchSection, fetchTodoByProject } = useFetchProject();
  const { fetchTable } = useFetchTable();

  /**
   * セクションごとにTodoのIDを分類・並び替えたオブジェクト
   * 'sec_0'は未分類
   *
   * {
   *   sec_1 : [1, 2, 3],
   *   sec_0 : [],
   * }
   */
  const todoIdsBySection = useAppSelector(state => selectTodoIdsByProject(state, Number(postId)));
  // projectに関連するsectionId（並び替え済み）
  const sectionIds = useAppSelector(state => selectSectionIdsByPostId(state, Number(postId)));

  // todoに利用していないsectionIdが抜け落ちるため、sectionIdsと揃える
  const normalizedTodoIdsBySection = useMemo(() => {
    const result: Record<string, number[]> = {};

    for (const secId of sectionIds) {
      result[secId] = todoIdsBySection[secId] ?? [];
    }

    return result;
  }, [sectionIds, todoIdsBySection]);

  // データの取得 - Project, Todo, Table
  useEffect(() => {
    const fetchData = async () => {
      // 削除処理
      if (invalidId.length > 0) {
        dispatch(removeProjectInvalidId(invalidId));
      }

      if (fetched || !postId) return;
      setIsFinish(false);
      setNotFound(false);

      try {
        const response = await fetchProjectData(postId);

        if (!response) {
          setNotFound(true);
          return;
        }

        await Promise.all([fetchTodoByProject(postId), fetchTable({ pathname: firstPath, postId })]);
      } catch {
        console.error('プロジェクトの取得に失敗しました');
      } finally {
        setTimeout(() => {
          setIsFinish(true);
        }, 1000);
      }
    };

    void fetchData();
  }, [postId, dispatch, fetchProjectData, fetchTable, firstPath, fetchTodoByProject]);

  // データの取得 - section一覧
  useEffect(() => {
    if (!sectionFetched) {
      void fetchSection();
    }
  }, [fetchSection]);

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

  const { setButtonElement } = useModalFocusRestore(isModalOpen);

  // タブ
  const tabs: Tab[] = [
    {
      content: () => {
        if (!postId) return;
        return (
          <Stack spacing={6}>
            {Object.keys(normalizedTodoIdsBySection).length > 0 && (
              <KanbanBoard
                isLoading={isLoading}
                items={normalizedTodoIdsBySection}
                key={`projectKanbanBoard-${postId}`}
                postId={postId}
                sectionIds={sectionIds}
                sectionMap={sectionMap}
                setButtonElement={setButtonElement}
                setCurrentTodoId={setCurrentTodoId}
                setIsModalOpen={setIsModalOpen}
                setIsSectionId={setIsSectionId}
                strategy={rectSortingStrategy}
                todoMap={todoMapByProject}
              />
            )}
            <Box>
              <SectionTitle title="作業累計" />
              <TaskTimeBar
                sectionMap={sectionMap}
                taskTimes={taskTimes}
                todoIdsBySection={normalizedTodoIdsBySection}
                todoMap={todoMapByProject}
              />
            </Box>
          </Stack>
        );
      },
      icon: ICONS.checkbox,
      id: 'projectTask',
      label: 'タスク',
    },
    {
      content: () => {
        if (!postId || !project) return;
        return (
          <Box>
            <BlockEditor content={project.content as JSONContent} key={`project-${postId}`} outer tableOfContents />
          </Box>
        );
      },
      icon: ICONS.memo,
      id: 'projectMemo',
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
                      key={`projectTable-${postId}`}
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
      id: 'projectTable',
      label: 'テーブル',
    },
    {
      content: () => {
        if (!postId) return;
        return (
          <Box>
            <FileUploader decodedPath={decodedPath} key={`projectUploader-${postId}`} />
            <FileGrid decodedPath={decodedPath} files={files} key={`projectGrid-${postId}`} />
          </Box>
        );
      },
      icon: ICONS.folder,
      id: 'projectFile',
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

  if (!fetched || !postId || !project || !isFinish) {
    return <PageLoader />;
  }

  return (
    <>
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
              path: '/project',
              title: 'project',
            },
            {
              path: `/project/${postId}`,
              title: title ?? '',
            },
          ]}
        />

        <PageTitle key={`projectTitle-${postId}`} marginBottom="1rem" title={title ?? ''} />

        <EndDate end={project.end} key={`projectEnd-${postId}`} postId={postId} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            minHeight: '100%',
            mt: '2rem',
          }}
        >
          <Box
            aria-label="プロジェクトのタブメニュー"
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
      <Modal isLoading={isLoading} isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
        <TodoForm
          currentTodoId={currentTodoId}
          isProjectId={Number(postId)}
          isSectionId={isSectionId ?? undefined}
          setCurrentTodoId={setCurrentTodoId}
          setIsLoading={setIsLoading}
          setIsModalOpen={setIsModalOpen}
          taskTime={taskTimes[currentTodoId] ?? []}
          todo={currentTodo}
        />
      </Modal>
    </>
  );
};

export default ProjectPost;
