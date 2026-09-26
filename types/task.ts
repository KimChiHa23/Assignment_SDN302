export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string; // "To Do" | "In Progress" | "Done"
  priority: string; // "Low" | "Medium" | "High"
  dueDate?: string | null;
  teamId?: string | null;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type TaskStatus = "All" | "To Do" | "In Progress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";
