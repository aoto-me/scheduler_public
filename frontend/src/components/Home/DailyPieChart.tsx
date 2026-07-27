import { ICONS } from '@/configs';
import { selectTaskTimes, useAppSelector } from '@/redux';
import { theme } from '@/theme';
import type { Todo, TodoType } from '@/types';
import { convertStrToDate, todoMainColor } from '@/utils';
import { alpha, styled } from '@mui/material/styles';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { PieChart } from '@mui/x-charts/PieChart';
import { addMinutes, differenceInMinutes, format, startOfDay } from 'date-fns';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../ui';

interface DailyPieChartProps {
  currentDay: Date;
  currentDayTodos: Todo[];
}

interface ParsedTodos {
  id: number | string;
  label: string;
  start: string;
  startMinutes: number;
  todoMinutes: number;
  type: '不明' | TodoType;
}

const getChartColor = (type: string) => {
  switch (type) {
    case 'プライベート': {
      return alpha(todoMainColor('プライベート'), 0.7);
    }
    case '不明': {
      return theme.palette.grey[300];
    }
    case '仕事': {
      return alpha(todoMainColor('仕事'), 0.7);
    }
    case '休憩・睡眠': {
      return alpha(todoMainColor('休憩・睡眠'), 0.7);
    }
    case '生活': {
      return alpha(todoMainColor('生活'), 0.7);
    }
    case '趣味・勉強': {
      return alpha(todoMainColor('趣味・勉強'), 0.7);
    }
    default: {
      return theme.palette.grey[300];
    }
  }
};

export const DailyPieChart = memo(({ currentDay, currentDayTodos }: DailyPieChartProps) => {
  const taskTime = useAppSelector(selectTaskTimes);
  const dailyMinutes = 1440 - 1; // FullCalendarで24:00を扱うと翌日になるため、23:59までを1日の上限とする
  const ulRef = useRef<HTMLUListElement>(null);
  const [ulHeight, setUlHeight] = useState(30);
  const currentDayStr = format(currentDay, 'yyyy-MM-dd');
  const startOfCurrentDay = startOfDay(currentDay); // currentDayを0時にする

  useEffect(() => {
    if (!ulRef.current) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setUlHeight(entry.contentRect.height);
      }
    });

    observer.observe(ulRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const minutesObj = useMemo(() => {
    const setEndTimeTodos = currentDayTodos.reduce<Todo[]>((result, todo) => {
      const taskTimes = taskTime[todo.id] ?? [];

      // 1. endとstartがセットしてあり、同日であればデータを利用する
      if (todo.start && todo.end?.slice(0, 10) === todo.start.slice(0, 10)) {
        result.push(todo);
        return result;
      }

      // 2. taskTimeに start と end が設定されており、どちらもcurrentDayであればデータを利用する
      const currentDayTaskTimes = taskTimes.filter(
        ({ end, start }) => start?.slice(0, 10) === currentDayStr && end?.slice(0, 10) === currentDayStr
      );
      for (const taskTim of currentDayTaskTimes) {
        result.push({
          ...todo,
          end: taskTim.end!,
          start: taskTim.start!,
        });
      }

      return result;
    }, []);

    // 時間差の計算と並び替え
    const parsedTodos: ParsedTodos[] = setEndTimeTodos
      .filter(todo => {
        const startDate = convertStrToDate(todo.start);
        const endDate = convertStrToDate(todo.end!);
        // 終了が開始より前なら除外
        return endDate.getTime() >= startDate.getTime();
      })
      .map(todo => {
        const startDate = convertStrToDate(todo.start);
        const endDate = convertStrToDate(todo.end!);
        // 差を計算（分単位）
        const startMinutes = differenceInMinutes(startDate, startOfCurrentDay);
        const todoMinutes = differenceInMinutes(endDate, startDate);
        return {
          id: todo.id,
          label: todo.content,
          start: format(startDate, 'HH:mm'),
          startMinutes,
          todoMinutes,
          type: todo.type,
        };
      })
      .sort((a, b) => a.startMinutes - b.startMinutes);

    const withGaps: typeof parsedTodos = [];

    let currentTime = 0;
    for (const [index, todo] of parsedTodos.entries()) {
      // 空白があれば追加
      const gapStartDate = addMinutes(startOfCurrentDay, currentTime);
      if (todo.startMinutes > currentTime) {
        withGaps.push({
          id: `gap-${String(index)}`,
          label: '不明',
          start: format(gapStartDate, 'HH:mm'),
          startMinutes: currentTime,
          todoMinutes: todo.startMinutes - currentTime,
          type: '不明',
        });
      }

      // Todo自体を追加
      withGaps.push(todo);

      // 次の基準時間を更新
      currentTime = todo.startMinutes + todo.todoMinutes;
    }

    // 最後のTodoの後に空白があれば追加
    if (currentTime < dailyMinutes) {
      const gapStartDate = addMinutes(startOfCurrentDay, currentTime);
      withGaps.push({
        id: 'gap-end',
        label: '不明',
        start: format(gapStartDate, 'HH:mm'),
        startMinutes: currentTime,
        todoMinutes: dailyMinutes - currentTime,
        type: '不明',
      });
    }

    return withGaps;
  }, [currentDayTodos, startOfCurrentDay, currentDayStr, taskTime, dailyMinutes]);

  // タイプ別の時間の集計
  const totalMinutesByType = useMemo(() => {
    const totalMinutesByTypeObj: Record<string, number> = {};
    // タイプ別の時間を合算する
    for (const todo of minutesObj) {
      const { todoMinutes, type } = todo;
      if (!totalMinutesByTypeObj[type]) {
        totalMinutesByTypeObj[type] = 0;
      }
      totalMinutesByTypeObj[type] += todoMinutes;
    }

    const totalMinutesByTypeArray: { time: string; type: string }[] = [];
    for (const [key, value] of Object.entries(totalMinutesByTypeObj)) {
      if (value === 0) continue;

      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      let time = '';

      if (hours > 0 && minutes > 0) {
        time = `${String(hours)}時間${String(minutes)}分`;
      } else if (hours > 0) {
        time = `${String(hours)}時間`;
      } else if (minutes > 0) {
        time = `${String(minutes)}分`;
      }

      totalMinutesByTypeArray.push({
        time,
        type: key,
      });
    }

    return totalMinutesByTypeArray;
  }, [minutesObj]);

  // グラフに渡すデータの形式に変換
  const chartData = useMemo(
    () =>
      minutesObj.map(item => ({
        color: getChartColor(item.type),
        id: item.id,
        label: item.label,
        value: item.todoMinutes,
      })),
    [minutesObj]
  );

  const StyledText = styled('text')(({ theme }) => ({
    dominantBaseline: 'central',
    fill: theme.palette.text.primary,
    fontSize: 14,
    fontWeight: 700,
    textAnchor: 'middle',
  }));

  function PieCenterLabel({ children }: { children: React.ReactNode }) {
    const { height, left, top, width } = useDrawingArea();
    return (
      <StyledText x={left + width / 2} y={top + height / 2}>
        {children}
      </StyledText>
    );
  }

  return (
    <>
      <PieChart
        hideLegend
        series={[
          {
            arcLabel: 'label',
            arcLabelMinAngle: 60,
            data: chartData,
            innerRadius: 50,
            valueFormatter: ({ value }) => {
              // value = totalMinutes
              const hours = Math.floor(value / 60);
              const minutes = value % 60;
              if (hours > 0 && minutes > 0) {
                return `${String(hours)}時間${String(minutes)}分`;
              }
              if (hours > 0) {
                return `${String(hours)}時間`;
              }
              return `${String(minutes)}分`;
            },
          },
        ]}
        sx={{
          '& .MuiPieChart-seriesLabels': {
            fontSize: '11px',
            fontWeight: 'bold',
          },
          height: `calc(100% - ${String(ulHeight)}px - 10px)`,
          width: '100%',
        }}
      >
        <PieCenterLabel>1日の記録</PieCenterLabel>
      </PieChart>
      <ul
        ref={ulRef}
        style={{
          columnGap: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          marginTop: '10px',
          rowGap: '4px',
        }}
      >
        {totalMinutesByType.map(
          (item, index) =>
            item.time !== '' && (
              <li
                key={`${item.type}-${String(index)}`}
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: '4px',
                }}
              >
                <Icon color={getChartColor(item.type)} icon={ICONS.squareFill} size="1rem" />
                <span
                  style={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.8125rem',
                    marginRight: '4px',
                  }}
                >
                  {item.type}
                </span>
                <span style={{ fontSize: '0.8125rem' }}>{item.time}</span>
              </li>
            )
        )}
      </ul>
    </>
  );
});
