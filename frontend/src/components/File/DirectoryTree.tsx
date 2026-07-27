import {
  selectDirectories,
  selectSelectedDirectory,
  setSelectedDirectory,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import type { DirectoryStructure } from '@/types';
import { getPathHierarchy } from '@/utils';
import { SvgIcon, type SvgIconProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const CustomTreeItem = styled(TreeItem)(({ theme }) => ({
  [`& .${treeItemClasses.content}[data-selected] .MuiTreeItem-label`]: {
    fontWeight: 700,
  },
  [`& .${treeItemClasses.content}`]: {
    margin: theme.spacing(0.3, 0),
    padding: theme.spacing(0.5, 1),
  },
  [`& .${treeItemClasses.groupTransition}`]: {
    marginLeft: 16,
    paddingLeft: 8,
  },
  [`& .${treeItemClasses.iconContainer}`]: {
    '& .close': {
      opacity: 0.3,
    },
  },
  [`& .${treeItemClasses.label}`]: {
    fontSize: '0.875rem',
    lineHeight: '1.35',
  },
}));

const EndIcon = (props: SvgIconProps) => (
  <SvgIcon className="end" style={{ height: 15, width: 15 }} {...props} color="secondary">
    <path d="M4 5V19H20V7H11.5858L9.58579 5H4ZM12.4142 5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5Z"></path>
  </SvgIcon>
);

const FolderIcon = (props: SvgIconProps) => (
  <SvgIcon style={{ height: 15, width: 15 }} {...props} color="secondary">
    <path d="M12.4142 5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5Z"></path>
  </SvgIcon>
);

const OpenIcon = (props: SvgIconProps) => (
  <SvgIcon style={{ height: 15, width: 15 }} {...props} color="secondary">
    <path d="M3 21C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5H20C20.5523 5 21 5.44772 21 6V9H4V18.996L6 11H22.5L20.1894 20.2425C20.0781 20.6877 19.6781 21 19.2192 21H3Z"></path>
  </SvgIcon>
);

export const DirectoryTree = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const selectedDirectory = useAppSelector(selectSelectedDirectory);
  const directories = useAppSelector(selectDirectories);

  useEffect(() => {
    dispatch(setSelectedDirectory(decodeURIComponent(location.pathname)));
  }, [location.pathname]);

  const handleSelectedItemsChange = (_event: null | React.SyntheticEvent, itemIds: null | string) => {
    if (itemIds) dispatch(setSelectedDirectory(itemIds));
  };

  const handleItemClick = useCallback(
    (path: string) => {
      const currentPath = decodeURIComponent(location.pathname);
      if (currentPath === path) return; // 同じURLなら遷移しない
      void navigate(path);
    },
    [location.pathname, navigate]
  );

  const handleItemKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const target = event.target as HTMLElement;
        const { id } = target;
        const index = id.indexOf('/file');
        if (index === -1) return;
        const path = id.slice(index);
        handleItemClick(path);
      }
    },
    [handleItemClick]
  );

  // フォルダツリーを再帰的に生成
  const renderTree = (data: DirectoryStructure, parentPath = '/file') => {
    return Object.entries(data).map(([key, value]) => {
      const currentPath = `${parentPath}/${key}`;

      return (
        <CustomTreeItem itemId={currentPath} key={currentPath} label={key}>
          {Object.keys(value).length > 0 && renderTree(value, currentPath)}
        </CustomTreeItem>
      );
    });
  };

  // 初回レンダリング時の開閉状況
  const [expanded, setExpanded] = useState(getPathHierarchy(decodeURIComponent(location.pathname)));

  return (
    <>
      {directories && (
        <SimpleTreeView
          aria-label="フォルダ階層"
          expandedItems={expanded}
          onExpandedItemsChange={(_event, itemIds) => {
            setExpanded(itemIds);
          }}
          onItemClick={(_, itemId) => {
            handleItemClick(itemId);
          }}
          onSelectedItemsChange={handleSelectedItemsChange}
          selectedItems={selectedDirectory}
          slots={{
            collapseIcon: OpenIcon,
            endIcon: EndIcon,
            expandIcon: FolderIcon,
          }}
          sx={{
            flexGrow: 1,
            maxWidth: 300,
            minHeight: 270,
            overflowX: 'hidden',
          }}
        >
          <CustomTreeItem
            itemId="/file"
            label="file"
            onKeyDown={event => {
              handleItemKeyDown(event);
            }}
          >
            {renderTree(directories)}
          </CustomTreeItem>
        </SimpleTreeView>
      )}
    </>
  );
};
