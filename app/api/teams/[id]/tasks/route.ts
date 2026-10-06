import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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

// POST /api/teams/[id]/tasks - Create a new task in team
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

    // If assigneeId is provided, check if assignee belongs to team
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

    // Create task with creatorId
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
