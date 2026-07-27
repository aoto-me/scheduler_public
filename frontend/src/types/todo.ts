/**
 * ToDoに紐づいたTaskTimeデータ
 */
export interface TaskTime {
  end: null | string;
  id: number;
  start: null | string;
  todoId: number;
}

/**
 * Todoデータ
 */
export interface Todo {
  completed: 0 | 1;
  content: string;
  end: null | string;
  estimated: null | string;
  id: number;
  memo: string;
  projectId: null | number;
  sectionId: null | string;
  sort: null | number;
  start: string;
  type: TodoType;
  visible: 0 | 1;
}

export const TODO_TYPES = ['仕事', 'プライベート', '生活', '休憩・睡眠', '趣味・勉強'] as const;
export type TodoType = (typeof TODO_TYPES)[number];
