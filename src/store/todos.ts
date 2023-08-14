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

type FilterStatus = "all" | "todo" | "done";
type Filters = Filter[];
interface Filter {
  label: string;
  name: FilterStatus;
}

interface CreateTodoPayload {
  title: string;
}

interface DeleteTodoPayload {
  id: string;
}

interface ReorderTodosPayload {
  oldIndex: number;
  newIndex: number;
}

const filters: Filters = [
  { label: "전체", name: "all" },
  { label: "할 일만", name: "todo" },
  { label: "완료만", name: "done" }
];

const currentTodo: Todo = {
  id: "",
  order: 0,
  title: "",
  done: false,
  createdAt: "",
  updatedAt: ""
};

export const useTodosStore = defineStore("todos", {
  state: () => ({
    todos: [] as Todos,
    filterStatus: "all" as FilterStatus,
    filters,
    currentTodo
  }),
  getters: {
    filteredTodos(state) {
      return state.todos.filter((todo) => {
        switch (state.filterStatus) {
          case "todo":
            return !todo.done;
            break;
          case "done":
            return todo.done;
            break;
          case "all":
          default:
            return true;
        }
      });
    }
  },
  actions: {
    async fetchTodos() {
      const { data } = await axios.post("/api/todos", {
        method: "GET"
      });
      this.todos = data;
    },
    async createTodo({ title }: CreateTodoPayload) {
      try {
        const { data: createdTodo } = await axios.post("/api/todos", {
          method: "POST",
          data: {
            title
          }
        });
        this.todos.unshift(createdTodo);
      } catch (error) {
        console.error("createdTodo:", error);
      }
    },
    async updateTodo(todo: Todo) {
      const foundTodo = this.todos.find((t) => t.id === todo.id);
      if (!foundTodo) return;
      const backedUpTodo = { ...foundTodo };
      Object.assign(foundTodo, todo);

      try {
        const { id: path, title, done } = todo;
        const { data: updatedTodo } = await axios.post("/api/todos", {
          method: "PUT",
          path,
          data: {
            title,
            done
          }
        });
        foundTodo.updatedAt = updatedTodo.updatedAt;
      } catch (error) {
        console.error("updatedTodo:", error);
        Object.assign(foundTodo, backedUpTodo);
      }
    },
    updateCheckboxes(done: boolean) {
      this.todos.forEach((todo) => {
        this.updateTodo({
          ...todo,
          done
        });
      });
    },
    async deleteTodo({ id }: DeleteTodoPayload) {
      try {
        await axios.post("/api/todos", {
          method: "DELETE",
          path: id
        });
        this.todos = this.todos.filter((todo) => todo.id !== id);
      } catch (error) {
        console.error("deleteTodo:", error);
      }
    },
    async deleteDoneTodos() {
      const todoIds = this.todos
        .filter((todo) => todo.done)
        .map((todo) => todo.id);
      if (!todoIds.length) return;

      try {
        await axios.post("/api/todos", {
          method: "DELETE",
          path: "deletions",
          data: {
            todoIds
          }
        });
        this.todos = this.todos.filter((todo) => !todoIds.includes(todo.id));
      } catch (error) {
        console.error("deleteDoneTodos", error);
      }
    },
    reorderTodos({ oldIndex, newIndex }: ReorderTodosPayload) {
      if (oldIndex === newIndex) return;
      const movedTodo = this.todos.splice(oldIndex, 1)[0];
      this.todos.splice(newIndex, 0, movedTodo);
      const todoIds = this.todos.map((todo) => todo.id);
      axios.post("/api/todos", {
        method: "PUT",
        path: "reorder",
        data: {
          todoIds
        }
      });
    }
  }
});
