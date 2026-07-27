import { API_ENDPOINTS, ICONS } from '@/configs';
import { useHttpRequest, usePath } from '@/hooks';
import { selectProjectTitleMap, selectTaskTimes, updateCompleted, useAppDispatch, useAppSelector } from '@/redux';
import { theme } from '@/theme';
import type { Todo } from '@/types';
import { convertSecondsToHourMinuteLabel, todoDarkColor, todoMainColor } from '@/utils';
import { Box, Card, CardActionArea, CardContent, Checkbox, Stack, Typography, useMediaQuery } from '@mui/material';
import { differenceInSeconds, format, isSameDay, parseISO } from 'date-fns';
import { Fragment, memo, useCallback, useMemo } from 'react';
import { Icon } from '../ui';

interface TodoCardProps {
  changeColor?: boolean; // Homeで使用（レスポンシブに応じて、カードの色を変える必要がある）
  setButtonElement: (target: HTMLButtonElement | null) => void;
  setCurrentTodoId: React.Dispatch<React.SetStateAction<number>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  todo: Todo | undefined;
}

export const TodoCard = memo(
  ({ changeColor = false, setButtonElement, setCurrentTodoId, setIsModalOpen, todo }: TodoCardProps) => {
    const { firstPath } = usePath();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const projectTitleMap = useAppSelector(selectProjectTitleMap);
    const allTaskTimes = useAppSelector(selectTaskTimes);
    const taskTime = allTaskTimes[todo?.id ?? 0] ?? [];
    const { patchRequest } = useHttpRequest();
    const dispatch = useAppDispatch();

    const startTime = useMemo(() => {
      if (!todo) return '';
      return format(todo.start, 'HH:mm');
    }, [todo]);

    const endTime = useMemo(() => {
      if (!todo?.end) return null;
      if (!(todo.start.slice(0, 7) === todo.end.slice(0, 7))) return null;
      return format(todo.end, 'HH:mm');
    }, [todo]);

    const projectName = useMemo(
      () => projectTitleMap?.get(todo?.projectId ?? 0) ?? '',
      [todo?.projectId, projectTitleMap]
    );

    const totalTaskTime = useMemo(() => {
      let cumulativeTime = 0;
      for (const item of taskTime) {
        if (!item.start || !item.end) continue;
        const startTime = parseISO(item.start);
        const endTime = parseISO(item.end);
        // 差分が負なら無視
        const durationInSeconds = differenceInSeconds(endTime, startTime);
        if (durationInSeconds > 0) cumulativeTime += durationInSeconds;
      }
      return cumulativeTime;
    }, [taskTime]);

    const toggleCompleted = useCallback(
      (checked: number, id: number) => {
        const newCompleted = checked === 0 ? 1 : 0;
        patchRequest({
          apiUrl: `${API_ENDPOINTS.todo}completed/${String(id)}/`,
          data: {
            completed: newCompleted,
          },
        })
          .then(response => {
            if (response === 'ok') dispatch(updateCompleted({ completed: newCompleted, id }));
          })
          .catch(() => {
            console.error('完了の更新に失敗しました');
          });
      },
      [patchRequest, dispatch]
    );

    if (!todo) return null;

    return (
      <Card
        data-testid="todo-card"
        onClick={e => {
          if ((e.target as Element).tagName === 'INPUT') return;
          const buttonElement = (e.currentTarget as HTMLElement).querySelector('button');
          setButtonElement(buttonElement);
          setCurrentTodoId(todo.id);
          setIsModalOpen(true);
        }}
        sx={{
          backgroundColor: changeColor
            ? isMobile
              ? todo.completed === 1
                ? theme.palette.grey[300] // 完了後に色を変えたければ変更
                : theme.palette.grey[100]
              : todo.completed === 1
                ? theme.palette.grey[300] // 完了後に色を変えたければ変更
                : '#fff'
            : todo.completed === 1
              ? theme.palette.grey[300] // 完了後に色を変えたければ変更
              : '#fff',
          borderLeft: `solid 3px ${todoDarkColor(todo.type)}`,
          position: 'relative',
          width: '100%',
        }}
      >
        <Checkbox
          checked={todo.completed === 1}
          onClick={() => {
            toggleCompleted(todo.completed, todo.id);
          }}
          sx={{
            '.Mui-checked': {
              color: todoDarkColor(todo.type),
            },
            '.MuiSvgIcon-root': {
              color: todoDarkColor(todo.type),
            },
            color: todoDarkColor(todo.type),
            left: '10px',
            padding: 0,
            position: 'absolute',
            top: '9px',
          }}
        />
        <CardActionArea>
          <CardContent sx={{ padding: '12px' }}>
            <Stack
              direction={'row'}
              sx={{
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                component={'h3'}
                sx={{
                  flexGrow: 1,
                  fontWeight: 700,
                  lineHeight: 1.35,
                  paddingLeft: 3.5,
                }}
                variant="body2"
              >
                {todo.content}
              </Typography>
              {firstPath !== 'project' && (
                <Typography
                  sx={{
                    flexGrow: 0,
                    flexShrink: 0,
                    fontWeight: 700,
                    ml: 1,
                    textAlign: 'right',
                  }}
                  variant="caption"
                >
                  {startTime === '00:00' ? endTime ? endTime !== '00:00' && <>{startTime}</> : null : <>{startTime}</>}
                  {endTime ? (endTime !== '00:00' || startTime !== '00:00') && <> - {endTime}</> : null}
                </Typography>
              )}
            </Stack>
            {firstPath === 'project' && (
              <Stack
                direction="row"
                sx={{
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: '0.5rem',
                }}
              >
                <Icon
                  color={todoMainColor(todo.type)}
                  icon={ICONS.calendarTodoFill}
                  size="1rem"
                  style={{
                    flexGrow: 0,
                    flexShrink: 0,
                    marginRight: '0.5rem',
                  }}
                />
                <Typography sx={{ flexGrow: 1, flexShrink: 1, letterSpacing: 0.5, lineHeight: 1.35 }} variant="caption">
                  {todo.start && todo.end && isSameDay(todo.start, todo.end) ? (
                    <>
                      {/* 日付が同じ場合 */}
                      {format(todo.start, 'yyyy年MM月dd日 ')}
                      {startTime === '00:00' || startTime === '00:00:00' ? (
                        endTime ? (
                          endTime !== '00:00' && endTime !== '00:00:00' && <>{startTime}</>
                        ) : null
                      ) : (
                        <>{startTime}</>
                      )}
                      {endTime ? (endTime !== '00:00' || startTime !== '00:00') && <> - {endTime}</> : null}
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          display: 'block',
                        }}
                      >
                        {todo.start && format(todo.start, 'yyyy年MM月dd日 ')}
                        {startTime && startTime !== '00:00' && startTime !== '00:00:00' && <>{startTime}</>}
                        {todo.end && ' - '}
                      </span>
                      <span
                        style={{
                          display: 'block',
                        }}
                      >
                        {todo.end && format(todo.end, 'yyyy年MM月dd日 ')}
                        {endTime && endTime !== '00:00' && endTime !== '00:00:00' && <>{endTime}</>}
                      </span>
                    </>
                  )}
                </Typography>
              </Stack>
            )}

            {(totalTaskTime !== 0 || (todo.estimated !== null && todo.estimated !== '00:00:00')) && (
              <Stack
                direction="row"
                sx={{
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  marginTop: 0.75,
                }}
              >
                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    flexGrow: 0,
                    flexShrink: 0,
                    flexWrap: 'nowrap',
                    mr: '1rem',
                  }}
                >
                  <Icon
                    color={todoMainColor(todo.type)}
                    icon={ICONS.timerFill}
                    size="1rem"
                    style={{ marginRight: '0.5rem' }}
                  />
                  {totalTaskTime !== 0 && (
                    <Typography
                      sx={{
                        letterSpacing: 0.5,
                        lineHeight: 1.35,
                      }}
                      variant="caption"
                    >
                      {convertSecondsToHourMinuteLabel(totalTaskTime)}
                    </Typography>
                  )}
                </Box>
                {todo.estimated !== null && todo.estimated !== '00:00:00' && (
                  <Box
                    sx={{
                      flexGrow: 0,
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      color="secondary"
                      sx={{
                        border: '1px solid',
                        borderColor: 'secondary',
                        borderRadius: '999px',
                        fontSize: '0.6rem',
                        mr: 0.75,
                        padding: '1px 6px',
                        verticalAlign: 'middle',
                      }}
                      variant="caption"
                    >
                      見積
                    </Typography>
                    <Typography
                      sx={{
                        lineHeight: 1.35,
                      }}
                      variant="caption"
                    >
                      {(() => {
                        const estimated = todo.estimated || '';
                        const [hoursStr, minutesStr] = estimated.split(':');
                        const hours = Number(hoursStr || 0);
                        const minutes = Number(minutesStr || 0);
                        return `${String(hours)}時間${String(minutes)}分`;
                      })()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}

            {projectName !== '' && firstPath !== 'project' && (
              <Stack
                direction={'row'}
                sx={{
                  alignItems: 'flex-start',
                  marginTop: 0.75,
                }}
              >
                <Icon
                  color={todoMainColor(todo.type)}
                  icon={ICONS.folderFill}
                  size="1rem"
                  style={{
                    flexGrow: 0,
                    flexShrink: 0,
                    marginRight: '0.5rem',
                  }}
                />
                <Typography sx={{ flexGrow: 1, letterSpacing: 0.5, lineHeight: 1.35 }} variant="caption">
                  {projectName}
                </Typography>
              </Stack>
            )}

            {todo.memo !== '' && (
              <Stack
                direction={'row'}
                sx={{
                  alignItems: 'flex-start',
                  marginTop: 0.75,
                }}
              >
                <Icon
                  color={todoMainColor(todo.type)}
                  icon={ICONS.memoFill}
                  size="1rem"
                  style={{
                    flexGrow: 0,
                    flexShrink: 0,
                    marginRight: '0.5rem',
                  }}
                />
                <Box>
                  <Typography
                    sx={{
                      display: 'block',
                      flexGrow: 1,
                      lineHeight: 1.35,
                    }}
                    variant="caption"
                  >
                    {todo.memo.split('\n').map((line, memoIndex) => (
                      <Fragment key={memoIndex}>
                        {line}
                        <br />
                      </Fragment>
                    ))}
                  </Typography>
                </Box>
              </Stack>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }
);
