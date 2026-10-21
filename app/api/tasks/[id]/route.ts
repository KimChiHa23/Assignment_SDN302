import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { canEditTask, canDeleteTask, Role } from "@/lib/rbac";
import { broadcastToTeam, broadcastToUser } from "@/lib/realtime-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Handler dùng chung cho PUT và PATCH cập nhật task
async function handleUpdateTask(request: Request, context: RouteParams) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Tìm task cùng thông tin team và các thành viên
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Xác định vai trò của user trong team này
    let userRole: Role | null = null;
    if (task.team.ownerId === authUser.id) {
      userRole = "OWNER";
    } else {
      const membership = task.team.members.find((m) => m.userId === authUser.id);
      if (membership) {
        userRole = membership.role as Role;
      }
    }

    if (!userRole) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this team" },
        { status: 403 }
      );
    }

    // Kiểm tra RBAC: Member chỉ sửa task do mình tạo hoặc được gán
    if (!canEditTask(userRole, task, authUser.id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied. Members can only edit tasks created by or assigned to them.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
      return NextResponse.json(
        { success: false, error: "Task title cannot be empty" },
        { status: 400 }
      );
    }

    // Nếu thay đổi người được gán, kiểm tra người đó có thuộc team không
    if (assigneeId) {
      const isAssigneeInTeam = task.team.members.some((m) => m.userId === assigneeId);
      const isAssigneeOwner = task.team.ownerId === assigneeId;

      if (!isAssigneeInTeam && !isAssigneeOwner) {
        return NextResponse.json(
          { success: false, error: "Assignee must be a member of this team" },
          { status: 400 }
        );
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Nếu gán mới hoặc đổi assignee cho người khác, tạo Notification
    if (
      assigneeId &&
      assigneeId !== task.assigneeId &&
      assigneeId !== authUser.id
    ) {
      try {
        const notification = await prisma.notification.create({
          data: {
            userId: assigneeId,
            type: "TASK_ASSIGNED",
            title: "Task Assigned",
            message: `You were assigned to task "${updatedTask.title}" in team "${task.team.name}" by ${authUser.name || "a teammate"}`,
            link: `/teams/${task.teamId}`,
          },
        });
        await broadcastToUser(assigneeId, "notification:new", notification);
      } catch (notifErr) {
        console.error("Error creating notification on task update:", notifErr);
      }
    }

    // Phát sóng real-time tới tất cả thành viên trong team
    await broadcastToTeam(task.teamId, "task:updated", updatedTask);

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating task";
    console.error("PUT/PATCH /api/tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteParams) {
  return handleUpdateTask(request, context);
}

export async function PATCH(request: Request, context: RouteParams) {
  return handleUpdateTask(request, context);
}

// DELETE /api/tasks/[id] - Xóa task (Kiểm tra phân quyền RBAC nghiêm ngặt: Owner & Admin xóa được mọi task; Member chỉ xóa được task do mình tạo hoặc được gán)
export async function DELETE(request: Request, context: RouteParams) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Xác định vai trò của user trong team
    let userRole: Role | null = null;
    if (task.team.ownerId === authUser.id) {
      userRole = "OWNER";
    } else {
      const membership = task.team.members.find((m) => m.userId === authUser.id);
      if (membership) {
        userRole = membership.role as Role;
      }
    }

    if (!userRole) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this team" },
        { status: 403 }
      );
    }

    // Kiểm tra RBAC
    if (!canDeleteTask(userRole, task, authUser.id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied. Only Owner, Admin, or the task creator/assignee can delete this task.",
        },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    // Phát sóng real-time xóa task tới các client trong team
    await broadcastToTeam(task.teamId, "task:deleted", {
      taskId: id,
      teamId: task.teamId,
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
      data: { id, teamId: task.teamId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error deleting task";
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
