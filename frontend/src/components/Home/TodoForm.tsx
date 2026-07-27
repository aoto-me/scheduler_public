import { API_ENDPOINTS, ICONS } from '@/configs';
import { useHttpRequest } from '@/hooks';
import {
  addTodo,
  removeTaskTime,
  removeTodo,
  selectProjectTitleMap,
  selectSectionMap,
  selectSectionsByProjectId,
  updateTodo,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import {
  autocompleteTextFieldStyle,
  datePickerWithGrayLabel,
  datePickerWithLabel,
  textFieldSelectStyle,
} from '@/styles';
import { theme } from '@/theme';
import type { TaskTime, Todo, TodoType } from '@/types';
import { base64Encode, convertSecondsToHourMinuteLabel, todoDarkColor, todoLightColor } from '@/utils';
import { todoSchema, type TodoSchema } from '@/validations/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import {
  Autocomplete,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  ListItemIcon,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMediaQuery } from '@mui/system';
import { DateTimePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { differenceInSeconds, format, parseISO, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { type JSX, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, type SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { DeleteButton, FormTitle, Icon, PrimaryButton } from '../ui';

interface IconsProps {
  color?: string;
  size?: string;
}

const TodoTypeIcons = ({ color = 'secondary', size = '1.2rem' }: IconsProps): Record<TodoType, JSX.Element> => ({
  プライベート: <Icon color={color} icon="RiUserLine" size={size} />,
  仕事: <Icon color={color} icon="RiSuitcaseLine" size={size} />,
  '休憩・睡眠': <Icon color={color} icon="RiHotelBedLine" size={size} />,
  生活: <Icon color={color} icon="RiCalendarScheduleLine" size={size} />,
  '趣味・勉強': <Icon color={color} icon="RiBookOpenLine" size={size} />,
});

// taskTimeの開始と終了時間の時間差
const diffTaskTime = (startValue: string, endValue: string) => {
  if (!startValue || !endValue) return '未設定';

  const start = parseISO(startValue);
  const end = parseISO(endValue);

  if (start >= end) return '無効な時間';

  const totalSeconds = differenceInSeconds(end, start);

  return convertSecondsToHourMinuteLabel(totalSeconds);
};

interface TodoFormProps {
  currentDay?: Date;
  currentTodoId: number;
  isProjectId?: number; // Projectページのみ
  isSectionId?: string; // Projectページのみ
  setCurrentTodoId: React.Dispatch<React.SetStateAction<number>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  taskTime: TaskTime[];
  todo: null | Todo;
}

interface TypeItem {
  icon: JSX.Element;
  label: string;
}

export const TodoForm = memo(
  ({
    currentDay,
    currentTodoId,
    isProjectId,
    isSectionId,
    setCurrentTodoId,
    setIsLoading,
    setIsModalOpen,
    taskTime,
    todo,
  }: TodoFormProps) => {
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [isSaveLoading, setIsSaveLoading] = useState(false);
    const [isDelLoading, setIsDelLoading] = useState(false);
    const projectTitleMap = useAppSelector(selectProjectTitleMap);
    const sectionMap = useAppSelector(selectSectionMap);
    const sectionsByProjectId = useAppSelector(selectSectionsByProjectId);
    const { deleteRequest, putRequest } = useHttpRequest();
    const dispatch = useAppDispatch();

    // TodoTypeIconsからタイプの選択肢を取得
    const todoTypes: TypeItem[] = useMemo(
      () =>
        Object.entries(TodoTypeIcons({})).map(([label, icon]) => ({
          icon,
          label,
        })),
      []
    );

    const defaultValues = {
      completed: false,
      content: '',
      end: '',
      estimated: '',
      memo: '',
      project: isProjectId ?? null,
      section: isSectionId ?? null,
      start: currentDay
        ? format(startOfDay(currentDay), 'yyyy-MM-dd HH:mm')
        : format(startOfDay(new Date()), 'yyyy-MM-dd HH:mm'),
      taskTime: [],
      type: '仕事' as TodoType,
      visible: true,
    };

    // ReactHookForm
    const {
      control,
      formState: { errors },
      getValues,
      handleSubmit,
      reset,
      setValue,
      watch,
    } = useForm<TodoSchema>({
      defaultValues,
      mode: 'onChange',
      resolver: zodResolver(todoSchema),
    });

    // 現在のprojectを監視して、sectionの選択肢を変更する
    const currentProject = watch('project');
    const sectionIds = useMemo(() => {
      if (!currentProject || currentProject === 0) return [];
      return sectionsByProjectId[currentProject] ?? [];
    }, [currentProject, sectionsByProjectId]);

    // inputを動的に増減させるための設定
    const { append, fields, remove, update } = useFieldArray({
      control,
      name: 'taskTime',
    });

    // 現在のtaskTimeを監視
    // watchだと浅いデータの変化しか取得できないため、useWatchを使う
    const taskTimeValues = useWatch({
      control,
      name: 'taskTime',
    });

    // newStart ⇒ 新しい作業開始をセット
    // setStart ⇒ 既存のデータに作業開始をセット
    // setEnd ⇒ 既存のデータに作業終了時間をセット
    const buttonState = useMemo(() => {
      if (taskTimeValues.length === 0) {
        return 'newStart';
      }

      const last = taskTimeValues[taskTimeValues.length - 1];

      if (!last || last.id === 0 || (last.start && last.end)) {
        return 'newStart';
      }

      if (!last.start) {
        return 'setStart';
      }

      if (!last.end) {
        return 'setEnd';
      }

      return 'newStart';
    }, [taskTimeValues]);

    const handleSetTaskTime = useCallback(
      (buttonState: 'newStart' | 'setEnd' | 'setStart') => {
        const length = taskTimeValues.length;
        const lastIndex = length - 1;
        const last = length > 0 ? taskTimeValues[lastIndex] : null;
        const now = format(new Date(), 'yyyy-MM-dd HH:mm');

        switch (buttonState) {
          case 'newStart': {
            append({ end: '', id: 0, start: now });
            break;
          }
          case 'setEnd': {
            if (last && lastIndex >= 0) {
              update(lastIndex, {
                ...last,
                end: now,
              });
            }
            break;
          }
          case 'setStart': {
            if (last && lastIndex >= 0) {
              update(lastIndex, {
                ...last,
                start: now,
              });
            }
            break;
          }
          default: {
            break;
          }
        }
      },
      [append, update, taskTimeValues]
    );

    // 現在のtaskTimeを監視して、taskTimeの合計時間を計算
    const totalTaskTime = useMemo(() => {
      const totalSeconds = taskTimeValues.reduce((total, item) => {
        if (!item) return total;

        const { end, start } = item;
        if (!start || !end) return total;

        const startDate = parseISO(start);
        const endDate = parseISO(end);

        if (startDate >= endDate) return total;

        return total + differenceInSeconds(endDate, startDate);
      }, 0);

      return convertSecondsToHourMinuteLabel(totalSeconds);
    }, [taskTimeValues]);

    // 既存データがあれば、フォームにデータをセット
    useEffect(() => {
      if (currentTodoId === 0 || !todo) {
        reset(defaultValues);
        return;
      }

      const { projectId, sectionId } = todo;
      setValue('content', todo.content || '');
      setValue('start', todo.start || '');
      setValue('end', todo.end ?? '');
      setValue('type', todo.type);
      setValue('project', projectId ?? null);
      setValue('section', sectionId ?? null);
      setValue('estimated', todo.estimated ?? '');
      setValue('completed', Boolean(todo.completed));
      setValue('visible', Boolean(todo.visible));
      setValue('memo', todo.memo || '');
      setValue(
        'taskTime',
        taskTime.map(t => ({
          end: t.end ?? '',
          id: t.id,
          start: t.start ?? '',
        }))
      );
    }, [currentTodoId]);

    /**
     * 新規・更新
     */
    const onSubmit: SubmitHandler<TodoSchema> = useCallback(() => {
      setIsSaveLoading(true);
      setIsLoading(true);

      const { memo, project, section, taskTime } = getValues();

      // taskTime[]
      const sendTaskTime = taskTime.map(data => ({
        end: data?.end === '' ? null : data?.end,
        id: data?.id ?? 0,
        start: data?.start === '' ? null : data?.start,
        todoId: currentTodoId,
      }));

      const sendData = {
        completed: getValues().completed ? 1 : 0,
        content: getValues().content,
        end: getValues().end === '' ? null : getValues().end.replace('T', ' '),
        estimated: getValues().estimated === '' ? null : getValues().estimated,
        memo: base64Encode(memo),
        projectId: project,
        sectionId: section,
        start: getValues().start.replace('T', ' '),
        taskTime: sendTaskTime,
        type: getValues().type,
        visible: getValues().visible ? 1 : 0,
      };

      const currentProjectId = todo?.projectId ?? null;
      const currentSectionId = todo?.sectionId ?? null;

      let sort = 'maintain'; // sortをどう扱うかのフラグ
      // 新規の場合
      if (currentTodoId === 0 && project) {
        sort = 'save'; // projectIdがあるため todoOrderに登録が必要
      }
      // 既存データの場合
      if (currentTodoId !== 0) {
        const isProjectChanged = currentProjectId !== project;
        const isSectionChanged = currentSectionId !== section;

        if (isProjectChanged && project === null) {
          // ProjectIdが変更 かつ 新しいProjectIdがnullの場合
          // Projectがnullになった ⇒ sortを削除
          sort = 'delete';
        } else if (isProjectChanged || isSectionChanged) {
          // Project または Sectionが変更された場合
          // Projectが変更されている ⇒ sectionも必ず変更されている
          // sectionのみ変更されている ⇒ 新しいsection内での順番が必要
          sort = 'save';
        }
      }

      putRequest<{ id: number; sort: null | number; taskTimeIds: number[] }>({
        apiUrl: `${API_ENDPOINTS.todo}${String(currentTodoId)}/`,
        data: {
          ...sendData,
          sort, // "maintain" | "save" | "delete"
        },
      })
        .then(response => {
          if (!response) {
            setIsLoading(false);
            setIsSaveLoading(false);
            return;
          }

          // taskTime
          const newTaskTime: TaskTime[] = sendTaskTime.map((item, index) => ({
            end: item.end ?? null,
            id: item.id === 0 ? response.taskTimeIds[index] : item.id,
            start: item.start ?? null,
            todoId: response.id,
          }));

          // todo
          let newTodo: Todo;
          switch (sort) {
            case 'delete': {
              // ProjectIdが変更 かつ 新しいProjectIdがnullの場合
              newTodo = {
                ...sendData,
                completed: sendData.completed ? 1 : 0,
                id: response.id,
                memo,
                sort: null,
                visible: sendData.visible ? 1 : 0,
              };
              break;
            }
            case 'save': {
              // 新規保存 かつ projectIdがあるため、sortの登録が必要
              // 更新 かつ ProjectまたはSectionが変更 → 順番リセット
              newTodo = {
                ...sendData,
                completed: sendData.completed ? 1 : 0,
                id: response.id,
                memo,
                sort: response.sort,
                visible: sendData.visible ? 1 : 0,
              };
              break;
            }
            default: {
              // projectとsectionに変更なし
              // 新規保存でprojectの登録なし
              newTodo = {
                ...sendData,
                completed: sendData.completed ? 1 : 0,
                id: response.id,
                memo,
                sort: todo?.sort ?? null, // 新規の場合はnull, 更新の場合は既存のsortのまま
                visible: sendData.visible ? 1 : 0,
              };
            }
          }

          if (currentTodoId === 0) {
            // 新規保存
            dispatch(addTodo({ data: newTodo, taskTime: newTaskTime }));
          } else {
            // 更新
            dispatch(updateTodo({ data: newTodo, taskTime: newTaskTime }));
          }

          setIsLoading(false);
          setIsSaveLoading(false);
          setIsModalOpen(false);
        })
        .catch(() => {
          console.error('Todoの更新に失敗しました');
          setIsLoading(false);
          setIsSaveLoading(false);
        });
    }, [
      currentTodoId,
      dispatch,
      getValues,
      putRequest,
      setIsLoading,
      setIsModalOpen,
      todo?.projectId,
      todo?.sectionId,
      todo?.sort,
    ]);

    /**
     * 削除
     */
    const handleDelete = useCallback(() => {
      setIsDelLoading(true);
      setIsLoading(true);

      // deletedTaskTimeIdsが返るが、利用してない
      deleteRequest<number[]>({
        apiUrl: `${API_ENDPOINTS.todo}${String(currentTodoId)}/`,
        data: {},
      })
        .then(response => {
          if (!response) {
            setIsLoading(false);
            setIsDelLoading(false);
            return;
          }
          dispatch(removeTodo(currentTodoId));
          setIsLoading(false);
          setIsDelLoading(false);
          setIsModalOpen(false);
          setCurrentTodoId(0);
        })
        .catch(() => {
          console.error('Todoの削除に失敗しました');
          setIsLoading(false);
          setIsDelLoading(false);
        });
    }, [deleteRequest, dispatch, currentTodoId, setCurrentTodoId, setIsLoading, setIsModalOpen, setIsDelLoading]);

    /**
     * TaskTimeの削除
     */
    const handleTaskTimeDelete = useCallback(
      (id: number, index: number) => {
        deleteRequest({
          apiUrl: `${API_ENDPOINTS.todo}taskTime/${String(id)}/`,
          data: {},
        })
          .then(response => {
            if (response === 'ok') {
              remove(index);
              dispatch(removeTaskTime({ taskTimeId: id, todoId: currentTodoId }));
            }
          })
          .catch(() => {
            console.error('TaskTimeの削除に失敗しました');
          });
      },
      [deleteRequest, remove, currentTodoId, dispatch]
    );

    return (
      <Stack component="form" noValidate onSubmit={handleSubmit(onSubmit)} spacing={3}>
        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete="off"
              error={!!errors.content}
              fullWidth
              helperText={errors.content?.message}
              hiddenLabel
              id="content"
              multiline
              placeholder="タスク名"
              required
              spellCheck="false"
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  lineHeight: 1.35,
                },
                '& .MuiInputBase-root': {
                  backgroundColor: '#fff',
                },
                '.MuiInputBase-root::after': {
                  borderWidth: '1px',
                },
                '.MuiInputBase-root:hover:not(.Mui-disabled, .Mui-error):before': {
                  borderColor: 'transparent',
                },
                '.MuiInputBase-root:not(.Mui-disabled, .Mui-error)::before': {
                  borderColor: 'transparent',
                },
              }}
              type="text"
              variant="standard"
            />
          )}
        />

        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={isMobile ? 1 : 2}
          sx={{
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Controller
            control={control}
            name="start"
            render={({ field }) => (
              <LocalizationProvider adapterLocale={ja} dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="開始"
                  minutesStep={1}
                  onChange={e => {
                    const date = e instanceof Date ? format(e, 'yyyy-MM-dd HH:mm') : '';
                    field.onChange(date);
                  }}
                  slotProps={{
                    textField: {
                      error: !!errors.start,
                      helperText: errors.start?.message,
                    },
                  }}
                  sx={{
                    ...datePickerWithLabel,
                    '& .MuiPickersInputBase-root': {
                      maxWidth: { sm: '12rem', xs: '100%' },
                    },
                  }}
                  value={field.value ? new Date(field.value) : null}
                />
              </LocalizationProvider>
            )}
          />

          <div
            style={{
              backgroundColor: theme.palette.secondary.dark,
              display: isMobile ? 'none' : 'block',
              height: '1px',
              marginTop: '1rem',
              width: '1rem',
            }}
          ></div>

          <Controller
            control={control}
            name="end"
            render={({ field }) => (
              <LocalizationProvider adapterLocale={ja} dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="終了"
                  minutesStep={1}
                  onChange={e => {
                    const date = e instanceof Date ? format(e, 'yyyy-MM-dd HH:mm') : '';
                    field.onChange(date);
                  }}
                  slotProps={{
                    textField: {
                      error: !!errors.end,
                      helperText: errors.end?.message,
                    },
                  }}
                  sx={{
                    ...datePickerWithLabel,
                    '& .MuiPickersInputBase-root': {
                      maxWidth: { sm: '12rem', xs: '100%' },
                    },
                  }}
                  value={field.value ? new Date(field.value) : null}
                />
              </LocalizationProvider>
            )}
          />
        </Stack>

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <TextField
              {...field}
              error={!!errors.type}
              helperText={errors.type?.message}
              hiddenLabel
              id="type"
              required
              select
              size="small"
              sx={{
                ...textFieldSelectStyle,
                '.MuiInputBase-root': {
                  backgroundColor: todoLightColor(field.value),
                },
                '.MuiListItemIcon-root>svg': {
                  fill: `${todoDarkColor(field.value)} !important`,
                  marginTop: '1px',
                },
              }}
              variant="filled"
            >
              {todoTypes.map(todoType => (
                <MenuItem
                  key={todoType.label}
                  sx={{
                    '& .MuiListItemIcon-root': {
                      minWidth: '1rem',
                    },
                  }}
                  value={todoType.label}
                >
                  <ListItemIcon sx={{ marginRight: '0.5rem', minWidth: '1rem', verticalAlign: 'text-bottom' }}>
                    {todoType.icon}
                  </ListItemIcon>
                  {todoType.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Stack spacing={1}>
          <Controller
            control={control}
            name="project"
            render={({ field }) => (
              <Autocomplete
                {...field}
                disablePortal
                getOptionLabel={option => projectTitleMap?.get(option) ?? ''}
                id="project"
                noOptionsText="プロジェクトが見つかりません"
                onChange={(_, newValue) => {
                  if (newValue === null) {
                    field.onChange(null);
                    setValue('section', null);
                  } else {
                    field.onChange(newValue);
                    setValue('section', null);
                  }
                }}
                options={[...projectTitleMap!.keys()]}
                renderInput={params => (
                  <>
                    <Icon
                      color={theme.palette.secondary.dark}
                      icon={ICONS.folderFill}
                      size="1.2rem"
                      style={{
                        marginRight: '0.5rem',
                      }}
                    />
                    <TextField
                      {...params}
                      error={!!errors.project}
                      helperText={errors.project?.message}
                      label="プロジェクトを選択"
                      placeholder="プロジェクトを選択"
                      size="small"
                      sx={autocompleteTextFieldStyle}
                      variant="filled"
                    />
                  </>
                )}
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                }}
              />
            )}
          />

          <Controller
            control={control}
            name="section"
            render={({ field }) => (
              <Autocomplete
                {...field}
                disablePortal
                getOptionLabel={option => sectionMap[option]?.name ?? ''}
                id="section"
                noOptionsText="セクションがありません"
                onChange={(_, newValue) => {
                  if (newValue === null) {
                    field.onChange(null);
                  } else {
                    field.onChange(newValue);
                  }
                }}
                options={sectionIds}
                renderInput={params => (
                  <>
                    <Icon
                      color={theme.palette.secondary.dark}
                      icon={ICONS.sectionFill}
                      size="1.2rem"
                      style={{
                        marginRight: '0.5rem',
                      }}
                    />
                    <TextField
                      {...params}
                      error={!!errors.section}
                      helperText={errors.section?.message}
                      id="section"
                      label="セクションを選択"
                      placeholder="セクションを選択"
                      size="small"
                      sx={autocompleteTextFieldStyle}
                      variant="filled"
                    />
                  </>
                )}
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                }}
              />
            )}
          />
        </Stack>

        <Stack spacing={1.5}>
          <FormTitle icon={ICONS.timerFill} title="作業時間" />
          <Stack
            direction="row"
            spacing={3}
            sx={{
              alignItems: 'center',
            }}
          >
            <Controller
              control={control}
              name="estimated"
              render={({ field }) => (
                <LocalizationProvider adapterLocale={ja} dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="見積"
                    minutesStep={1}
                    onChange={e => {
                      const date = e instanceof Date ? format(e, 'HH:mm') : '';
                      field.onChange(date);
                    }}
                    slotProps={{
                      textField: {
                        error: !!errors.estimated,
                        helperText: errors.estimated?.message,
                      },
                    }}
                    sx={{
                      ...datePickerWithGrayLabel,
                      width: 'fit-content',
                    }}
                    value={
                      field.value
                        ? (() => {
                            const [hours, minutes] = field.value.split(':').map(Number);
                            const date = new Date();
                            date.setHours(hours);
                            date.setMinutes(minutes);
                            date.setSeconds(0);
                            return date;
                          })()
                        : null
                    }
                  />
                </LocalizationProvider>
              )}
            />
            <Typography
              component="p"
              sx={{
                width: 'fit-content',
              }}
            >
              <span
                style={{
                  backgroundColor: theme.palette.grey[200],
                  borderRadius: '3px',
                  color: theme.palette.text.secondary,
                  fontSize: '0.825rem',
                  letterSpacing: '0.035em',
                  lineHeight: 1,
                  marginRight: '0.5rem',
                  padding: '0.75rem 0.5rem',
                }}
              >
                合計
              </span>
              {totalTaskTime}
            </Typography>
          </Stack>
          {fields.map((fieldItem, index) => {
            const startValue = taskTimeValues[index]?.start ?? '';
            const endValue = taskTimeValues[index]?.end ?? '';
            return (
              <Stack
                direction="row"
                key={fieldItem.id}
                spacing={1}
                sx={{
                  alignItems: 'center',
                  flexWrap: 'nowrap',
                }}
              >
                <Controller
                  control={control}
                  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                  name={`taskTime.${index}.start`}
                  render={({ field }) => (
                    <LocalizationProvider adapterLocale={ja} dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="開始時間"
                        minutesStep={1}
                        onChange={e => {
                          const date = e instanceof Date ? format(e, 'yyyy-MM-dd HH:mm') : '';
                          field.onChange(date);
                        }}
                        sx={{
                          '.MuiButtonBase-root.MuiIconButton-root': {
                            borderRadius: '999px',
                          },
                          '.MuiButtonBase-root.MuiIconButton-root .MuiSvgIcon-root': {
                            fontSize: '1rem',
                          },
                          '.MuiButtonBase-root.MuiIconButton-root .MuiTouchRipple-root': {
                            borderRadius: '999px !important',
                          },
                          '.MuiFormLabel-root': {
                            color: theme.palette.secondary.main,
                            transform: 'translate(11px, 9px) scale(1)',
                          },
                          ".MuiFormLabel-root[data-shrink='true']": {
                            transform: 'translate(15px, -8px) scale(0.7) !important',
                          },
                          '.MuiPickersSectionList-root': {
                            padding: '8px 0',
                          },
                        }}
                        value={field.value ? new Date(field.value) : null}
                      />
                    </LocalizationProvider>
                  )}
                />
                <Controller
                  control={control}
                  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                  name={`taskTime.${index}.end`}
                  render={({ field }) => (
                    <LocalizationProvider adapterLocale={ja} dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="終了時間"
                        minutesStep={1}
                        onChange={e => {
                          const date = e instanceof Date ? format(e, 'yyyy-MM-dd HH:mm') : '';
                          field.onChange(date);
                        }}
                        sx={{
                          '.MuiButtonBase-root.MuiIconButton-root': {
                            borderRadius: '999px',
                          },
                          '.MuiButtonBase-root.MuiIconButton-root .MuiSvgIcon-root': {
                            fontSize: '1rem',
                          },
                          '.MuiButtonBase-root.MuiIconButton-root .MuiTouchRipple-root': {
                            borderRadius: '999px !important',
                          },
                          '.MuiFormLabel-root': {
                            color: theme.palette.secondary.main,
                            transform: 'translate(11px, 9px) scale(1)',
                          },
                          ".MuiFormLabel-root[data-shrink='true']": {
                            transform: 'translate(15px, -8px) scale(0.7) !important',
                          },
                          '.MuiPickersSectionList-root': {
                            padding: '8px 0',
                          },
                        }}
                        value={field.value ? new Date(field.value) : null}
                      />
                    </LocalizationProvider>
                  )}
                />
                <Typography
                  sx={{
                    flexShrink: 0,
                  }}
                  variant="caption"
                >
                  {diffTaskTime(startValue, endValue)}
                </Typography>
                <IconButton
                  aria-label="delete"
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    const id = getValues(`taskTime.${index}.id`);
                    if (id === 0) {
                      remove(index);
                    } else {
                      const response = globalThis.confirm('作業時間を削除しますか？');
                      if (response) {
                        handleTaskTimeDelete(id, index);
                      }
                    }
                  }}
                  size="small"
                  sx={{
                    flexShrink: 0,
                  }}
                >
                  <Icon icon={ICONS.delete} size="1rem" />
                </IconButton>
              </Stack>
            );
          })}

          <Stack direction={'row'} spacing={1}>
            <Button
              onClick={() => {
                handleSetTaskTime(buttonState);
              }}
              size="small"
              startIcon={<Icon color="#fff" icon={ICONS.timerFill} size="1rem" style={{}} />}
              sx={{
                lineHeight: 1.35,
                padding: '0.25rem 0.5rem',
                width: '50%',
              }}
              variant="contained"
            >
              {buttonState === 'setEnd' ? '作業を終了' : '作業を開始'}
            </Button>
            <Button
              color="primary"
              onClick={() => {
                append({ end: '', id: 0, start: '' });
              }}
              size="small"
              startIcon={<AddCircleIcon color="primary" />}
              sx={{ lineHeight: 1.35, padding: '0.25rem 0.5rem', width: '50%' }}
              variant="outlined"
            >
              作業時間を追加
            </Button>
          </Stack>
        </Stack>
        <Controller
          control={control}
          name="memo"
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete="off"
              error={!!errors.memo}
              helperText={errors.memo?.message}
              id="memo"
              label="メモ"
              multiline
              placeholder="メモを入力（500文字以内）"
              spellCheck="false"
            />
          )}
        />
        <Controller
          control={control}
          name="completed"
          render={({ field }) => (
            <FormControlLabel
              {...field}
              checked={field.value}
              control={
                <Checkbox
                  id="completed"
                  size="small"
                  sx={{
                    marginLeft: '-10px',
                  }}
                />
              }
              label="完了"
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="visible"
          render={({ field }) => (
            <FormControlLabel
              {...field}
              checked={field.value}
              control={
                <Checkbox
                  id="visible"
                  size="small"
                  sx={{
                    marginLeft: '-10px',
                  }}
                />
              }
              label="カレンダーに表示する"
              onChange={field.onChange}
              style={{ marginTop: '-4px' }}
            />
          )}
        />
        <Stack spacing={1.5}>
          <PrimaryButton loading={isSaveLoading} type="submit">
            {currentTodoId === 0 ? '保存' : '更新'}
          </PrimaryButton>
          {currentTodoId !== 0 && (
            <DeleteButton loading={isDelLoading} onClick={handleDelete}>
              削除
            </DeleteButton>
          )}
        </Stack>
      </Stack>
    );
  }
);
