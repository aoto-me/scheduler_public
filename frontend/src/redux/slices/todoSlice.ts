import type { TaskTime, Todo } from '@/types';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';
import type { RootState } from '../store';

export interface TodoState {
  data: Record<number, Todo | undefined>; // id で一元管理
  fetchedMonths: Record<string, boolean>; // yyyy-mm をキーとして、月のデータが取得済みかどうか
  taskTimes: Record<number, TaskTime[] | undefined>; // TodoId に紐づいたデータ
}

const initialState: TodoState = {
  data: {},
  fetchedMonths: {},
  taskTimes: {},
};

export const todoSlice = createSlice({
  initialState,
  name: 'todo',
  reducers: {
    /**
     * Todoの追加
     */
    addTodo: (state, action: PayloadAction<{ data: Todo; taskTime: TaskTime[] }>) => {
      const { data: todo, taskTime } = action.payload;

      // data に追加
      state.data[todo.id] = todo;
      // taskTimes に登録
      state.taskTimes[todo.id] = taskTime;
    },

    /**
     * TaskTimeの削除
     */
    removeTaskTime: (state, action: PayloadAction<{ taskTimeId: number; todoId: number }>) => {
      const { taskTimeId, todoId } = action.payload;

      const todoTaskTimes = state.taskTimes[todoId];
      if (todoTaskTimes) {
        state.taskTimes[todoId] = todoTaskTimes.filter(task => task.id !== taskTimeId);
      }
    },

    /**
     * Todoの削除
     */
    removeTodo: (state, action: PayloadAction<number>) => {
      const id = action.payload;

      // dataから除外
      delete state.data[id];
      // taskTimesから除外
      delete state.taskTimes[id];
    },

    /**
     * 1か月分まとめて登録
     */
    setTodoData: (state, action: PayloadAction<{ data: Todo[]; key: string; taskTimes: TaskTime[] }>) => {
      const { data, key, taskTimes } = action.payload;

      // データをフラットに格納
      for (const todo of data) {
        state.data[todo.id] = todo;
      }

      // taskTime の登録（重複除外）
      for (const item of taskTimes) {
        const list = state.taskTimes[item.todoId] ?? [];
        const exists = list.some(r => r.id === item.id); // taskTime の id で重複判定
        if (!exists) list.push(item);
        state.taskTimes[item.todoId] = list;
      }

      // 取得済みフラグを更新
      state.fetchedMonths[key] = true;
    },

    /**
     * キーなしでのTodoデータの登録（projectページで使用）
     */
    setTodoDataWithoutKey: (state, action: PayloadAction<{ data: Todo[]; taskTime: TaskTime[] }>) => {
      const { data, taskTime } = action.payload;

      // データをフラットに格納
      for (const todo of data) {
        state.data[todo.id] = todo;
      }

      // taskTime の登録（重複除外）
      for (const item of taskTime) {
        const list = state.taskTimes[item.todoId] ?? [];
        const exists = list.some(t => t.id === item.id); // TaskTime の id で重複判定
        if (!exists) list.push(item);
        state.taskTimes[item.todoId] = list;
      }
    },

    /**
     * 完了 / 未完了 の更新
     */
    updateCompleted: (state, action: PayloadAction<{ completed: 0 | 1; id: number }>) => {
      const { completed, id } = action.payload;

      // 対象のTodoが存在する場合のみ更新
      if (state.data[id]) state.data[id].completed = completed;
    },

    /**
     * start / end の更新
     */
    updateStartEnd: (state, action: PayloadAction<{ end: null | string; id: number; start: string }>) => {
      const { end, id, start } = action.payload;

      // 対象のTodoが存在する場合のみ更新
      if (state.data[id]) {
        state.data[id] = {
          ...state.data[id],
          end,
          start,
        };
      }
    },

    /**
     * Todoの更新
     */
    updateTodo: (state, action: PayloadAction<{ data: Todo; taskTime: TaskTime[] }>) => {
      const { data: todo, taskTime } = action.payload;

      state.data[todo.id] = todo;

      state.taskTimes[todo.id] = taskTime;
    },

    /**
     * projectの削除に伴う更新
     */
    updateTodoProject: (state, action: PayloadAction<number[]>) => {
      const ids = action.payload;

      for (const id of ids) {
        const todo = state.data[id];
        if (todo) {
          todo.projectId = null;
          todo.sectionId = null;
          todo.sort = null;
        }
      }
    },

    /**
     * 同セクション内でのTodoの並び替え
     */
    updateTodoSort: (state, action: PayloadAction<number[]>) => {
      const ids = action.payload;

      for (const [index, id] of ids.entries()) {
        const todo = state.data[id];
        if (todo) todo.sort = index + 1; // 1スタート
      }
    },

    /**
     * セクション間をまたいでのTodoの並び替え
     */
    updateTodoSortOverSection: (
      state,
      action: PayloadAction<{
        afterIds: number[]; // 移動先セクションでのidの並び
        afterSectionId: null | string; // 移動先セクション
        id: number; // 移動対象のtodoのid
        projectId: number;
      }>
    ) => {
      const { afterIds, afterSectionId, id } = action.payload;

      // 移動対象Todoの sectionId を更新
      const targetTodo = state.data[id];
      if (!targetTodo) return;
      targetTodo.sectionId = afterSectionId;

      // afterIds の順番に従って sort を更新
      for (const [index, todoId] of afterIds.entries()) {
        const todo = state.data[todoId];
        if (!todo) continue;
        todo.sort = index + 1;
      }
    },
  },
});

export const {
  addTodo,
  removeTaskTime,
  removeTodo,
  setTodoData,
  setTodoDataWithoutKey,
  updateCompleted,
  updateStartEnd,
  updateTodo,
  updateTodoProject,
  updateTodoSort,
  updateTodoSortOverSection,
} = todoSlice.actions;

export default todoSlice.reducer;

// 全てのtaskTimeを取得
export const selectTaskTimes = (state: RootState) => state.todo.taskTimes;

// Todoを projectId ⇒ sectionId ごとに分類する
export const selectTodosByProjectAndSection = createSelector(
  [(state: RootState) => state.todo.data],
  (data): Record<number, Record<string, Todo[]>> => {
    const result: Record<number, Record<string, Todo[]>> = {};

    for (const todo of Object.values(data)) {
      if (!todo) continue;

      const { projectId, sectionId } = todo;

      // projectId が null の場合はスキップ
      if (projectId === null) continue;

      // projectId ごとの格納先を用意
      result[projectId] ??= {};

      // sectionId が null の場合は "sec_0" として扱う
      const secId = sectionId ?? 'sec_0';

      // sectionId ごとの格納先を用意
      result[projectId][secId] ??= [];

      result[projectId][secId].push(todo);
    }

    return result;
  }
);

/**
 * sectionごとtodoのidを分類したオブジェクト（Todoの並びソート済み）
 * {
 *   sec_1 : [1, 2, 3],
 *   sec_0 : [],
 * }
 */
export const selectTodoIdsByProject = createSelector(
  [selectTodosByProjectAndSection, (_: RootState, projectId: number) => projectId],
  (todosByProject, projectId): Record<string, number[]> => {
    const sections = todosByProject[projectId] ?? {};

    const result: Record<string, number[]> = {};
    for (const [sectionId, todos] of Object.entries(sections)) {
      // sort 順に並べてから todo の id だけ抽出
      result[sectionId] = [...todos].sort((a, b) => (a.sort ?? Infinity) - (b.sort ?? Infinity)).map(todo => todo.id);
    }
    return result;
  }
);

// project内で利用されているTodoのMapを取得
export const selectTodoMapByProject = createSelector(
  [selectTodosByProjectAndSection, (_: RootState, projectId: number) => projectId],
  (todosByProject, projectId): Map<number, Todo> => {
    const sectionMap = todosByProject[projectId] as Record<string, Todo[]> | undefined;
    if (!sectionMap) return new Map();

    const todos = Object.values(sectionMap).flat();

    return new Map(todos.map(todo => [todo.id, todo]));
  }
);

// id で該当のデータを取得
export const selectTodoById = createSelector(
  [(state: RootState) => state.todo.data, (_: RootState, id: number) => id],
  (data, id): null | Todo => data[id] ?? null
);

// 月別の取得済みフラグの取得
export const selectFetchedMonths = (state: RootState) => state.todo.fetchedMonths;

// 全データを type の順番で並び替えしたデータを取得
export const selectAllTodoSortedByType = createSelector(
  [(state: RootState) => state.todo.data, (_: RootState, isPrivate: boolean) => isPrivate],
  (entities, isPrivate): Todo[] => {
    let todos = Object.values(entities).filter((t): t is Todo => !!t);

    if (isPrivate) {
      todos = todos.filter(todo => todo.type === '仕事');
    }

    // タイプで並べ替え
    const typeOrder: Record<string, number> = {
      プライベート: 1,
      仕事: 0,
      '休憩・睡眠': 4,
      生活: 2,
      '趣味・勉強': 3,
    };

    return todos.sort((a, b) => (typeOrder[a.type] ?? Infinity) - (typeOrder[b.type] ?? Infinity));
  }
);

// type の順番で並び替えしたデータから Date のデータを取得
export const selectTodoByDay = createSelector(
  [
    (state: RootState, isPrivate: boolean, _: Date) => selectAllTodoSortedByType(state, isPrivate),
    (_: RootState, __: boolean, date: Date) => date,
  ],
  (todos, date) => {
    const targetDate = startOfDay(date); // 比較用に時刻を 00:00 にする

    const filteredTodos = todos.filter(todo => {
      // 比較用に時刻を 00:00 にする
      const startDate = startOfDay(todo.start);
      const endDate = todo.end ? startOfDay(todo.end) : null;
      if (endDate) {
        // start <= currentDay <= end
        return (
          (isSameDay(targetDate, startDate) || isAfter(targetDate, startDate)) &&
          (isSameDay(targetDate, endDate) || isBefore(targetDate, endDate))
        );
      }
      // start === currentDay
      return isSameDay(targetDate, startDate);
    });

    // startとendが同じ日付か、日を跨いでいるかで配列を分ける
    const sameDateTodos: Todo[] = [];
    const differentDateTodos: Todo[] = [];

    for (const todo of filteredTodos) {
      const startDate = todo.start.slice(0, 10); // yyyy-MM-dd
      const endDate = todo.end?.slice(0, 10); // endがnullのときはundefined

      if (!endDate || startDate === endDate) {
        sameDateTodos.push(todo);
      } else {
        differentDateTodos.push(todo);
      }
    }

    // 日付が同じものは、時間の順番に並び替える
    const sortedSameDateTodos = sameDateTodos.sort((a, b) => {
      // 1. start が違えば start で比較
      const startCompare = a.start.localeCompare(b.start);
      if (startCompare !== 0) return startCompare;

      // 2-1. 片方だけ end がある → end がない方を前に
      if (a.end && !b.end) return 1;
      if (!a.end && b.end) return -1;

      // 2-2. 両方 end がない → 同じとみなす
      if (!a.end && !b.end) return 0;

      // 2-3. 両方 end がある → end を比較（早い方が前）
      if (a.end && b.end) return a.end.localeCompare(b.end);

      return 0;
    });

    return [...differentDateTodos, ...sortedSameDateTodos];
  }
);
