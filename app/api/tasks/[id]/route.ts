import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/tasks/[id] - Cập nhật trạng thái, độ ưu tiên, người phụ trách, due date (Thành viên trong team đều có quyền)
export async function PUT(request: Request, context: RouteParams) {
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

    // Find task with team info
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Check permissions: User must be a member or Owner of the team
    const isOwner = task.team.ownerId === authUser.id;
    const isMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: task.teamId,
          userId: authUser.id,
        },
      },
    });

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to update tasks in this team" },
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

    // If changing assignee, verify new assignee belongs to team
    if (assigneeId) {
      const isAssigneeInTeam = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: task.teamId,
            userId: assigneeId,
          },
        },
      });
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

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating task";
    console.error("PUT /api/tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete task (Strict permission: ONLY Creator, Assignee, or Team Owner)
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
        team: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Strict deletion rule:
    // ONLY allowed for:
    // 1. Task creator (creatorId === authUser.id)
    // 2. Task assignee (assigneeId === authUser.id)
    // 3. Team Owner (task.team.ownerId === authUser.id)
    const isCreator = task.creatorId === authUser.id;
    const isAssignee = task.assigneeId === authUser.id;
    const isTeamOwner = task.team.ownerId === authUser.id;

    if (!isCreator && !isAssignee && !isTeamOwner) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied. Only the task creator, assignee, or team owner can delete this task.",
        },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
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
