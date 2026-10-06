import { TaskItem } from "./task";

export type TeamRole = "OWNER" | "MEMBER";

export interface TeamMemberItem {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole | string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TeamItem {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  members?: TeamMemberItem[];
  tasks?: TaskItem[];
  _count?: {
    members?: number;
    tasks?: number;
  };
  // Role của user hiện tại trong team này (được gắn thêm để tiện render UI)
  currentUserRole?: TeamRole;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
}

export interface AddMemberPayload {
  email: string;
}
