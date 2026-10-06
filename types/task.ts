export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string; // "To Do" | "In Progress" | "Done"
  priority: string; // "Low" | "Medium" | "High"
  dueDate?: string | null;
  teamId: string;
  assigneeId?: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  } | null;
  team?: {
    id: string;
    name: string;
    ownerId: string;
  };
}

export type TaskStatus = "All" | "To Do" | "In Progress" | "Done";
export type TaskPriority = "All" | "Low" | "Medium" | "High";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  assigneeId?: string | null;
}
