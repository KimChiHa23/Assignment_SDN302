import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { broadcastToTeam, broadcastToUser } from "@/lib/realtime-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teams/[id]/tasks - Lấy danh sách task của team
export async function GET(request: Request, context: RouteParams) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in" },
        { status: 401 }
      );
    }

    const { id: teamId } = await context.params;

    // Check permissions: User must be a member or Owner of the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { where: { userId: authUser.id } },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    if (team.ownerId !== authUser.id && team.members.length === 0) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to view tasks in this team" },
        { status: 403 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { teamId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching tasks";
    console.error("GET /api/teams/[id]/tasks error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/teams/[id]/tasks - Tạo task mới trong team
export async function POST(request: Request, context: RouteParams) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in" },
        { status: 401 }
      );
    }

    const { id: teamId } = await context.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { where: { userId: authUser.id } },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    if (team.ownerId !== authUser.id && team.members.length === 0) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to create tasks in this team" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    // Validate title
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Task title is required" },
        { status: 400 }
      );
    }

    // Verify assignee belongs to team if provided
    if (assigneeId) {
      const isAssigneeInTeam = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: assigneeId,
          },
        },
      });

      const isAssigneeOwner = team.ownerId === assigneeId;

      if (!isAssigneeInTeam && !isAssigneeOwner) {
        return NextResponse.json(
          { success: false, error: "Assignee must be a member of this team" },
          { status: 400 }
        );
      }
    }

    // Create task
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        status: status || "To Do",
        priority: priority || "Medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId,
        assigneeId: assigneeId || null,
        creatorId: authUser.id,
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

    // Tự động tạo Notification nếu có gán task cho người khác
    if (assigneeId && assigneeId !== authUser.id) {
      try {
        const notification = await prisma.notification.create({
          data: {
            userId: assigneeId,
            type: "TASK_ASSIGNED",
            title: "Task Assigned",
            message: `You were assigned to task "${newTask.title}" in team "${team.name}" by ${authUser.name || "a teammate"}`,
            link: `/teams/${teamId}`,
          },
        });
        await broadcastToUser(assigneeId, "notification:new", notification);
      } catch (notifErr) {
        console.error("Error creating notification:", notifErr);
      }
    }

    // Phát sóng real-time tới tất cả thành viên trong team
    await broadcastToTeam(teamId, "task:created", newTask);

    return NextResponse.json(
      {
        success: true,
        message: "Task created successfully",
        data: newTask,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating task";
    console.error("POST /api/teams/[id]/tasks error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
