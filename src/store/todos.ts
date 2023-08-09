import { defineStore } from "pinia";
import axios from "axios";

export type Todos = Todo[]; // 할 일 목록

export interface Todo {
  id: string; // 할 일 ID
  order: number; // 할 일 순서
  title: string; // 할 일 제목
  done: boolean; // 할 일 완료 여부
  createdAt: string; // 할 일 생성일
  updatedAt: string; // 할 일 수정일
}

interface CreateTodoPayload {
  title: string;
}

export const useTodosStore = defineStore("todos", {
  state: () => ({
    todos: [] as Todos
  }),
  getters: {},
  actions: {
    async fetchTodos() {
      const { data } = await axios.post("/api/todos", {
        method: "GET"
      });
      this.todos = data;
    },
    async createTodo({ title }: CreateTodoPayload) {
      await axios.post("/api/todos", {
        method: "POST",
        data: {
          title
        }
      });
    }
  }
});
