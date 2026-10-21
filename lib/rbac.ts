export type Role = "OWNER" | "ADMIN" | "MEMBER";

export interface TaskPermissionTarget {
  creatorId: string;
  assigneeId?: string | null;
}

/**
 * Kiểm tra xem role có được phép xóa Team không.
 * Chỉ OWNER mới có quyền xóa Team.
 */
export function canDeleteTeam(role?: Role | null): boolean {
  return role === "OWNER";
}

/**
 * Kiểm tra xem role có được phép chỉnh sửa thông tin Team không.
 * Chỉ OWNER có quyền sửa Team.
 */
export function canEditTeam(role?: Role | null): boolean {
  return role === "OWNER";
}

/**
 * Kiểm tra xem role có quyền mời thành viên mới vào Team không.
 * Cả OWNER và ADMIN đều có quyền mời.
 */
export function canInviteMember(role?: Role | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Kiểm tra xem actor có quyền xóa targetMember khỏi Team không.
 * - OWNER: Xóa được mọi thành viên (trừ chính mình nếu là Owner duy nhất).
 * - ADMIN: Chỉ được xóa thành viên có role MEMBER. Không được xóa Owner hoặc Admin khác.
 * - MEMBER: Không có quyền xóa ai.
 */
export function canRemoveMember(
  actorRole: Role,
  targetRole: Role,
  isSelf: boolean
): boolean {
  if (isSelf) return false; // Không tự xóa qua action này (hoặc có flow rời team riêng)

  if (actorRole === "OWNER") {
    return targetRole !== "OWNER";
  }

  if (actorRole === "ADMIN") {
    return targetRole === "MEMBER";
  }

  return false;
}

/**
 * Kiểm tra xem actor có quyền thay đổi vai trò (role) của targetMember không.
 * - OWNER: Có quyền thăng/hạ bất kỳ thành viên nào (giữa ADMIN và MEMBER).
 * - ADMIN: Không được sửa Owner, không được sửa Admin khác, không được phong làm Owner.
 * - MEMBER: Không có quyền thay đổi vai trò.
 */
export function canChangeMemberRole(
  actorRole: Role,
  targetCurrentRole: Role,
  newRole: Role
): { allowed: boolean; reason?: string } {
  if (actorRole === "MEMBER") {
    return { allowed: false, reason: "Members do not have permission to manage roles" };
  }

  if (targetCurrentRole === "OWNER") {
    return { allowed: false, reason: "Cannot change the role of the Team Owner" };
  }

  if (newRole === "OWNER") {
    return { allowed: false, reason: "Only the Team Owner can transfer team ownership" };
  }

  if (actorRole === "ADMIN") {
    if (targetCurrentRole === "ADMIN") {
      return { allowed: false, reason: "Admins cannot change the role of other Admins" };
    }
    // Admin chỉ có thể quản lý Member
    if (newRole !== "MEMBER" && newRole !== "ADMIN") {
      return { allowed: false, reason: "Invalid role specified" };
    }
  }

  if (actorRole === "OWNER") {
    if (newRole !== "ADMIN" && newRole !== "MEMBER") {
      return { allowed: false, reason: "Invalid role specified" };
    }
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Kiểm tra xem role có quyền tạo Task mới trong Team không.
 * OWNER, ADMIN, MEMBER đều có quyền tạo task.
 */
export function canCreateTask(role?: Role | null): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
}

/**
 * Kiểm tra quyền chỉnh sửa Task:
 * - OWNER & ADMIN: Chỉnh sửa được mọi task trong team.
 * - MEMBER: Chỉ được chỉnh sửa task do chính mình tạo ra hoặc được gán.
 */
export function canEditTask(
  role: Role,
  task: TaskPermissionTarget,
  userId: string
): boolean {
  if (role === "OWNER" || role === "ADMIN") {
    return true;
  }
  if (role === "MEMBER") {
    return task.creatorId === userId || task.assigneeId === userId;
  }
  return false;
}

/**
 * Kiểm tra quyền xóa Task:
 * - OWNER & ADMIN: Xóa được mọi task trong team.
 * - MEMBER: Chỉ được xóa task do chính mình tạo ra hoặc được gán.
 */
export function canDeleteTask(
  role: Role,
  task: TaskPermissionTarget,
  userId: string
): boolean {
  if (role === "OWNER" || role === "ADMIN") {
    return true;
  }
  if (role === "MEMBER") {
    return task.creatorId === userId || task.assigneeId === userId;
  }
  return false;
}
