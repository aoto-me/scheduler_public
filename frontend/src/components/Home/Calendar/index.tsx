import { MentalIcons } from '@/components/Health';
import { convertToRemixIcon, Icon } from '@/components/ui';
import { API_ENDPOINTS, ICONS } from '@/configs';
import { useAuthContext } from '@/contexts';
import { useHttpRequest } from '@/hooks';
import {
  selectAllDiaryCard,
  selectAllFoodTotal,
  selectAllHealthDataWithItem,
  selectAllTodoSortedByType,
  selectCalendarYearEventMap,
  selectHolidays,
  selectMoneyBalanceAllDays,
  selectProjectTitleMap,
  setHolidays,
  updateStartEnd,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { convertStrToDate, splitDate, todoLightColor } from '@/utils';
import type { DatesSetArg, DayCellContentArg, EventContentArg } from '@fullcalendar/core';
import jaLocale from '@fullcalendar/core/locales/ja';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import { Box, Chip, styled, Tooltip, tooltipClasses, type TooltipProps } from '@mui/material';
import axios from 'axios';
import { addDays, format, isSameMonth, subDays } from 'date-fns';
import { memo, useCallback, useEffect, useMemo } from 'react';
import './style.scss';

// fullCalendarの9時間ズレを修正
export const subtractNineHours = (date: Date, type: 'end' | 'start'): string => {
  const timeUtc = new Date(date);
  timeUtc.setHours(timeUtc.getHours() - 9);

  // end かつ 00:00 の場合は1日減らす
  if (type === 'end' && timeUtc.getHours() === 0 && timeUtc.getMinutes() === 0 && timeUtc.getSeconds() === 0) {
    return format(subDays(timeUtc, 1), 'yyyy-MM-dd HH:mm:ss');
  }

  return format(timeUtc, 'yyyy-MM-dd HH:mm:ss');
};

interface CalendarProps {
  currentDay: Date;
  currentType: 'diary' | 'health' | 'money' | 'todo';
  healthIconMap: Map<string, string>;
  setCurrentDay: React.Dispatch<React.SetStateAction<Date>>;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  setCurrentTodoId: React.Dispatch<React.SetStateAction<number>>;
  setCurrentType: React.Dispatch<React.SetStateAction<'diary' | 'health' | 'money' | 'todo'>>;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Calendar = memo(
  ({
    currentDay,
    currentType,
    healthIconMap,
    setCurrentDay,
    setCurrentMonth,
    setCurrentTodoId,
    setCurrentType,
    setIsDrawerOpen,
    setIsModalOpen,
  }: CalendarProps) => {
    const { patchRequest } = useHttpRequest();
    const dispatch = useAppDispatch();
    const holidays = useAppSelector(selectHolidays);
    const { isPrivate } = useAuthContext();
    const calendarYearEventMap = useAppSelector(selectCalendarYearEventMap);
    const diaries = useAppSelector(selectAllDiaryCard);
    const foodTotalMap = useAppSelector(selectAllFoodTotal);
    const healthWithItemAllDays = useAppSelector(selectAllHealthDataWithItem);
    const moneyBalanceAllDays = useAppSelector(selectMoneyBalanceAllDays);
    const projectMap = useAppSelector(selectProjectTitleMap);
    const todos = useAppSelector(state => selectAllTodoSortedByType(state, isPrivate ?? false));

    // 祝日APIから祝日を取得(3年分のデータのみ取得可能)
    useEffect(() => {
      if (holidays.length > 0) return;
      axios
        .get<Record<string, string>>(`https://holidays-jp.github.io/api/v1/date.json?ts=${String(Date.now())}`)
        .then(response => {
          const holidaysEvent = Object.entries(response.data).map(([date, title]) => ({
            classNames: 'holiday',
            display: 'background',
            editable: false,
            start: date,
            title,
          }));
          dispatch(setHolidays(holidaysEvent));
        })
        .catch((error: unknown) => {
          console.error(error);
        });
    }, []);

    // yearEventのイベントオブジェクトの作成
    const myEvent = useMemo(() => {
      if (!calendarYearEventMap) return [];
      return Object.entries(calendarYearEventMap).map(([date, title], index) => ({
        backgroundColor: 'transparent',
        classNames: ['myEvent'],
        editable: false,
        end: `${date} 23:59:00`, // その日の1番最後に表示するために23:59
        id: `myEvent-${String(index)}`,
        start: `${date} 23:58:00`, // その日の1番最後に表示するために23:58
        title,
      }));
    }, [calendarYearEventMap]);

    // 選択中の日付の色背景色を設定するためのイベントオブジェクトの作成
    const backgroundEvent = useMemo(
      () => ({
        backgroundColor: '#c2dee1',
        classNames: 'fc-currentDay',
        display: 'background',
        start: format(currentDay, 'yyyy-MM-dd'),
      }),
      [currentDay]
    );

    // todoのイベントオブジェクトの作成
    const todoEvents = useMemo(
      () =>
        todos
          .filter(todo => todo.visible === 1)
          .map(data => {
            const startRaw = data.start.replace(/([T\s])00:00:00$/, '');
            const start = new Date(startRaw);
            const startHour = start.getHours();
            let end = data.end ?? null;
            // endを設定しない場合、startの時間+1時間を終了時間とみなすため、
            // 23時以降の予定を登録すると、次の日に表示が跨ぐのを防ぐ
            if (!end && startHour >= 23) {
              // 同じ日付の23:59:00を作成
              const { day, month, year } = splitDate(start);
              end = `${year}-${month}-${day} 23:59:00`;
            }
            // endの時間が00:00:00の場合、1日プラスする（表示が当日を含まないため）
            const regex = /[ T]00:00(:00)?$/;
            if (end && regex.test(end)) {
              const endDate = convertStrToDate(end);
              const nextEndDate = addDays(endDate, 1);
              end = format(nextEndDate, 'yyyy-MM-dd HH:mm:ss');
            }
            let dataType = '';
            let backgroundColor = '';
            switch (data.type) {
              case 'プライベート': {
                dataType = 'private';
                backgroundColor = todoLightColor('プライベート');
                break;
              }
              case '仕事': {
                dataType = 'work';
                backgroundColor = todoLightColor('仕事');
                break;
              }
              case '休憩・睡眠': {
                dataType = 'rest';
                backgroundColor = todoLightColor('休憩・睡眠');
                break;
              }
              case '生活': {
                dataType = 'routine';
                backgroundColor = todoLightColor('生活');
                break;
              }
              case '趣味・勉強': {
                dataType = 'study';
                backgroundColor = todoLightColor('趣味・勉強');
                break;
              }
              default: {
                dataType = 'work';
                backgroundColor = todoLightColor('');
              }
            }
            // projectIdがあれば、3番目のクラスとして渡す
            const classNames = data.projectId ? `todo ${dataType} ${String(data.projectId)}` : `todo ${dataType}`;
            return {
              id: data.id,
              start: startRaw,
              title: data.content,
              ...(end ? { end } : {}),
              backgroundColor,
              classNames,
            };
          }),
      [todos]
    );

    // 収支を表示するためのイベントオブジェクトの作成
    const moneyEvents = useMemo(() => {
      if (isPrivate) return [];
      return [...moneyBalanceAllDays.entries()].map(([date, { expense, income }]) => ({
        backgroundColor: 'transparent',
        classNames: 'money',
        display: 'block',
        editable: false,
        expense: expense.toLocaleString('ja-JP'),
        income: income.toLocaleString('ja-JP'),
        start: date,
      }));
    }, [moneyBalanceAllDays, isPrivate]);

    // 食事記録を表示するためのイベントオブジェクトの作成
    const foodEvents = useMemo(() => {
      if (isPrivate) return [];
      return [...foodTotalMap.entries()].map(([date, { carb, energy, fat, protein, salt }]) => ({
        backgroundColor: 'transparent',
        carb: carb.toLocaleString('ja-JP'),
        classNames: 'food',
        display: 'block',
        editable: false,
        energy: energy.toLocaleString('ja-JP'),
        fat: fat.toLocaleString('ja-JP'),
        protein: protein.toLocaleString('ja-JP'),
        salt: salt.toLocaleString('ja-JP'),
        start: date,
      }));
    }, [foodTotalMap]);

    // 体調の記録を表示するためのイベントオブジェクトの作成
    const healthEvents = useMemo(() => {
      if (isPrivate) return [];
      return healthWithItemAllDays.map(health => ({
        backgroundColor: 'transparent',
        classNames: 'health',
        display: 'block',
        editable: false,
        exercise: health.exercise === 1,
        item: health.item,
        memo: health.memo,
        mental: health.mental,
        start: health.date,
      }));
    }, [healthWithItemAllDays, isPrivate]);

    // 日記を表示するためのイベントオブジェクトの作成
    const diaryEvents = useMemo(() => {
      if (isPrivate) return [];
      return diaries.map(diary => ({
        backgroundColor: todoLightColor('休憩・睡眠'),
        classNames: 'diary',
        editable: false,
        start: diary.date,
        title: diary.title,
      }));
    }, [diaries, isPrivate]);

    // 表示中の月を変更したときに呼び出される関数
    const handleDateSet = useCallback(
      (datesInfo: DatesSetArg) => {
        const month = datesInfo.view.currentStart;
        setCurrentMonth(month);
        // 表示中の月が現在の月であれば、現在の日付を更新(他の月の時には勝手に今日にしない)
        if (isSameMonth(new Date(), month)) {
          setCurrentDay(new Date());
        }
      },
      [setCurrentDay, setCurrentMonth]
    );

    // 日付をクリックしたときに呼び出される関数
    const handleDateClick = useCallback(
      (dateInfo: DateClickArg) => {
        setIsModalOpen(false);
        setCurrentDay(new Date(dateInfo.dateStr));
        setIsDrawerOpen(true);
      },
      [setCurrentDay, setIsDrawerOpen, setIsModalOpen]
    );

    // カレンダーの日付の表示から「日」を削除する
    const renderDayCell = useCallback((dayCellContent: DayCellContentArg) => {
      const { dayNumberText, isToday } = dayCellContent;
      const replaceDayNumberText = dayNumberText.replace('日', '');

      return isToday ? (
        <div className="fc-todayNum">
          <span>{replaceDayNumberText}</span>
        </div>
      ) : (
        <>{replaceDayNumberText}</>
      );
    }, []);

    // healthのメモにカーソルを合わせた時に表示するためのツールチップ
    const CustomTooltip = styled(({ className, ...props }: TooltipProps) => (
      <Tooltip {...props} classes={{ popper: className }} />
    ))({
      [`& .${tooltipClasses.arrow}`]: {
        color: 'rgba(0, 0, 0, 0.75)',
      },
      [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        maxWidth: 250,
      },
    });

    // イベントの内容の表示をカスタマイズ
    const renderEventContent = (eventInfo: EventContentArg) => (
      <>
        {eventInfo.event.classNames[0] === 'holiday' && eventInfo.event.title !== '' && (
          <div className="fc-holidayName">{eventInfo.event.title}</div>
        )}

        {eventInfo.event.classNames[0] === 'todo' && eventInfo.event.title !== '' && (
          <>
            {eventInfo.event.classNames[2] && (
              <span className={`fc-project ${eventInfo.event.classNames[1]}`}>
                {projectMap?.get(Number(eventInfo.event.classNames[2]))}
              </span>
            )}
            {eventInfo.event.startStr.slice(0, 10) === eventInfo.event.endStr.slice(0, 10) && (
              <span>{eventInfo.timeText} </span>
            )}
            {eventInfo.event.title}
          </>
        )}

        {eventInfo.event.classNames[0] === 'health' && (
          <div className="fc-health">
            <div className="healthIcons">
              {eventInfo.event.extendedProps.mental > 0 && (
                <p
                  style={{
                    fontSize: '1.15rem',
                    lineHeight: 1,
                  }}
                >
                  {MentalIcons[eventInfo.event.extendedProps.mental as number].icon}
                </p>
              )}
              {(eventInfo.event.extendedProps.memo as string).length > 0 && (
                <div className="memo">
                  <CustomTooltip
                    arrow
                    disableFocusListener
                    disableTouchListener
                    title={eventInfo.event.extendedProps.memo as string}
                  >
                    <span>
                      <Icon icon={ICONS.memoFill} size="1rem" />
                    </span>
                  </CustomTooltip>
                </div>
              )}
              {eventInfo.event.extendedProps.exercise && (
                <span>
                  <Icon icon={ICONS.runFill} size="1.15rem" />
                </span>
              )}
            </div>
            <div className="healthItems">
              {(eventInfo.event.extendedProps.item as string[]).map((item: string, index: number) => (
                <Chip
                  icon={
                    <Icon
                      icon={convertToRemixIcon(healthIconMap.get(item) ?? 'dossier-line')}
                      size="0.875rem"
                      style={{
                        flexShrink: 0,
                        lineHeight: 1,
                        marginLeft: '4px',
                        marginRight: '-4px',
                      }}
                    />
                  }
                  key={index}
                  label={item}
                  size="small"
                  sx={{
                    fontSize: '12px',
                    height: 'auto',
                    padding: '3px',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {eventInfo.event.classNames[0] === 'food' && eventInfo.event.extendedProps.energy !== '0' && (
          <div className="fc-food">
            <p>
              <span>熱</span>
              {eventInfo.event.extendedProps.energy} kcal
            </p>
            <p>
              <span>蛋</span>
              {eventInfo.event.extendedProps.protein} g
            </p>
            <p>
              <span>脂</span>
              {eventInfo.event.extendedProps.fat} g
            </p>
            <p>
              <span>炭</span>
              {eventInfo.event.extendedProps.carb} g
            </p>
            <p>
              <span>塩</span>
              {eventInfo.event.extendedProps.salt} g
            </p>
          </div>
        )}

        {eventInfo.event.classNames[0] === 'diary' && eventInfo.event.title !== '' && <>{eventInfo.event.title}</>}

        {eventInfo.event.extendedProps.income !== undefined && eventInfo.event.extendedProps.income !== '0' ? (
          <div className="fc-income">+ {eventInfo.event.extendedProps.income}</div>
        ) : (
          <></>
        )}
        {eventInfo.event.extendedProps.expense !== undefined && eventInfo.event.extendedProps.expense !== '0' ? (
          <div className="fc-expense">- {eventInfo.event.extendedProps.expense}</div>
        ) : (
          <></>
        )}

        {eventInfo.event.classNames[0] === 'myEvent' && eventInfo.event.title !== '' && <>{eventInfo.event.title}</>}
      </>
    );

    // カレンダーの描画完了を検知するコールバック
    const handleViewDidMount = useCallback(() => {
      const fcToolbars = document.querySelectorAll('.fc-toolbar-chunk');
      if (fcToolbars.length > 0) {
        fcToolbars[1].classList.add('fc-filter-buttons');
        fcToolbars[1].firstElementChild?.classList.add('fc-button-active');
      }
    }, []);

    // カテゴリによって表示するイベントを変更する
    const filterEventsByCategory = useCallback(
      (category: string) => {
        switch (category) {
          case 'diary': {
            return [...diaryEvents, ...holidays, backgroundEvent];
          }
          case 'health': {
            return [...healthEvents, ...foodEvents, ...holidays, backgroundEvent];
          }
          case 'money': {
            return [...moneyEvents, ...holidays, backgroundEvent];
          }
          case 'todo': {
            return [...myEvent, ...todoEvents, ...holidays, backgroundEvent];
          }
          default: {
            return [...myEvent, ...todoEvents, ...holidays, backgroundEvent];
          }
        }
      },

      [holidays, myEvent, todoEvents, moneyEvents, healthEvents, foodEvents, diaryEvents, currentDay, backgroundEvent] // currentDayを依存関係に入れておかないと、選択日が変わっても色がつかない
    );

    // カテゴリボタンのスタイルを変更する
    const changeButtonStyle = useCallback((e: MouseEvent) => {
      if (e.target !== null) {
        const target = e.target as HTMLElement;
        if (target.parentNode) {
          for (const btn of target.parentNode.childNodes) {
            const filterBtn = btn as HTMLElement;
            filterBtn.classList.remove('fc-button-active');
          }
        }
        target.classList.add('fc-button-active');
      }
    }, []);

    // ドラックアンドドロップでの日付の更新（Todoのみ）
    const saveStartAndEnd = useCallback(
      ({ end, id, start }: { end: Date | null; id: number; start: Date }) => {
        const newStart = subtractNineHours(start, 'start');
        const newEnd = end ? subtractNineHours(end, 'end') : null;
        patchRequest({
          apiUrl: `${API_ENDPOINTS.todo}startAndEnd/${String(id)}/`,
          data: {
            end: newEnd,
            start: newStart,
          },
        })
          .then(response => {
            if (!response) return;
            dispatch(updateStartEnd({ end: newEnd, id: id, start: newStart }));
          })
          .catch(() => {
            console.error('開始日と終了日の更新に失敗しました');
          });
      },
      [dispatch, patchRequest]
    );

    return (
      <Box>
        <FullCalendar
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
          }}
          customButtons={{
            diaryButton: {
              click: e => {
                setCurrentType('diary');
                changeButtonStyle(e);
              },
              hint: '日記のみ表示',
              text: 'Diary',
            },
            healthButton: {
              click: e => {
                setCurrentType('health');
                changeButtonStyle(e);
              },
              hint: 'ヘルスのみ表示',
              text: 'Health',
            },
            moneyButton: {
              click: e => {
                setCurrentType('money');
                changeButtonStyle(e);
              },
              hint: '収支のみ表示',
              text: 'Money',
            },
            todoButton: {
              click: e => {
                setCurrentType('todo');
                changeButtonStyle(e);
              },
              hint: 'ToDoのみ表示',
              text: 'ToDo',
            },
          }}
          dateClick={handleDateClick}
          datesSet={handleDateSet}
          dayCellContent={renderDayCell}
          editable={true}
          eventClick={info => {
            if (info.event.classNames[0] === 'todo') {
              setCurrentTodoId(Number(info.event.id));
              setIsModalOpen(true);
            }
          }}
          eventContent={renderEventContent}
          eventDisplay="block"
          eventDrop={info => {
            const eventObj = info.event;
            saveStartAndEnd({
              end: eventObj.end,
              id: Number(eventObj.id),
              start: eventObj.start!,
            });
          }}
          events={filterEventsByCategory(currentType)}
          eventTimeFormat={{
            hour: 'numeric',
            meridiem: false,
            minute: '2-digit',
          }}
          headerToolbar={{
            center: 'todoButton moneyButton healthButton diaryButton',
          }}
          height={'auto'}
          initialView="dayGridMonth"
          locale={jaLocale}
          plugins={[dayGridPlugin, interactionPlugin]}
          timeZone="Asia/Tokyo"
          viewDidMount={handleViewDidMount} // カレンダー描画完了の検知
        />
      </Box>
    );
  }
);
