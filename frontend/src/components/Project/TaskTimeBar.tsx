import { center, chartColor } from '@/styles';
import type { Section, TaskTime, Todo } from '@/types';
import { convertSecondsToHourMinuteLabel } from '@/utils';
import { Paper } from '@mui/material';
import { type BarItem, legendClasses } from '@mui/x-charts';
import { BarChart } from '@mui/x-charts/BarChart';
import { differenceInSeconds, parseISO } from 'date-fns';
import { memo, useCallback, useMemo } from 'react';

const valueFormatter = (value: null | number) => {
  if (value == null) return '';
  const seconds = Math.round(value * 3600);
  return convertSecondsToHourMinuteLabel(seconds);
};

const yLabels = ['見積', '作業'];

interface TaskTimeBarProps {
  sectionMap: Record<string, Section | undefined>;
  taskTimes: Record<number, TaskTime[] | undefined>;
  todoIdsBySection: Record<string, number[]>;
  todoMap: Map<number, Todo>;
}

export const TaskTimeBar = memo(({ sectionMap, taskTimes, todoIdsBySection, todoMap }: TaskTimeBarProps) => {
  // taskTimeの集計
  const calculateCumulativeSeconds = useCallback(
    (todoId: number): number => {
      const taskTime = taskTimes[todoId];
      if (!taskTime) return 0;

      return taskTime.reduce((total, task) => {
        if (todoId === task.todoId && task.start && task.end) {
          const startTime = parseISO(task.start);
          const endTime = parseISO(task.end);
          const diff = differenceInSeconds(endTime, startTime);

          return diff > 0 ? total + diff : total;
        }
        return total;
      }, 0);
    },
    [taskTimes]
  );

  const data = useMemo(() => {
    return Object.keys(todoIdsBySection).map((sectionId, index) => {
      // セクション名の取得
      const section = sectionMap[sectionId];
      const label = sectionId === 'sec_0' ? '未分類' : (section?.name ?? '不明のセクション');
      // 各セクションの todoId を取得
      const todoIds = todoIdsBySection[sectionId] ?? [];

      // 見積時間の集計
      const totalEstimatedSeconds = todoIds.reduce((total, todoId) => {
        const estimated = todoMap.get(todoId)?.estimated;
        if (!estimated) return total;

        const [hours, minutes, seconds = 0] = estimated.split(':').map(Number);

        return total + hours * 3600 + minutes * 60 + seconds;
      }, 0);

      // taskTimeの集計
      const totalTaskSeconds = todoIds.reduce((total, todoId) => total + calculateCumulativeSeconds(todoId), 0);

      // グラフ用に時間（小数）へ変換
      const estimatedHours = totalEstimatedSeconds / 3600;
      const taskHours = totalTaskSeconds / 3600;

      return {
        barLabel: (item: BarItem) => {
          if (!item.value) return null;
          const seconds = Math.round(item.value * 3600);
          return convertSecondsToHourMinuteLabel(seconds);
        },
        color: sectionId === 'sec_0' ? '#D6D6D6' : chartColor[index % chartColor.length],
        data: [estimatedHours, taskHours],
        id: sectionId,
        label,
        stack: 'total',
        valueFormatter,
      };
    });
  }, [sectionMap, todoIdsBySection, todoMap, calculateCumulativeSeconds]);

  return (
    <Paper
      data-testid="task-time-bar"
      sx={{
        borderRadius: '6px',
        height: '270px',
        p: 2,
        width: '100%',
        ...center,
      }}
      variant="outlined"
    >
      <BarChart
        layout="horizontal"
        margin={{ bottom: 0, left: 0, right: 16, top: 10 }}
        series={data}
        slotProps={{
          legend: {
            sx: {
              [`.${legendClasses.mark}`]: {
                height: 15,
                width: 15,
              },
              columnGap: '12px',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.35,
              rowGap: '8px',
            },
          },
        }}
        sx={{
          '& .MuiBarChart-label': {
            fill: '#fff !important',
            fontSize: '12px !important',
          },
          '& .MuiChartsAxis-tickLabel': {
            fontSize: '12px !important',
            fontWeight: 700,
          },
          height: '100%',
          width: '100%',
        }}
        yAxis={[
          {
            data: yLabels,
            scaleType: 'band',
          },
        ]}
      />
    </Paper>
  );
});
