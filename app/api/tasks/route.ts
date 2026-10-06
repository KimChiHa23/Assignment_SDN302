import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/tasks - Lấy danh sách task (sắp xếp theo createdAt giảm dần)
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    let whereClause = {};
    if (authUser) {
      // Lấy các task thuộc teams mà user tham gia hoặc sở hữu
      whereClause = {
        team: {
          OR: [
            { ownerId: authUser.id },
            { members: { some: { userId: authUser.id } } },
          ],
        },
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true, ownerId: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch tasks";
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Tạo mới task
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in to create a task" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, teamId, assigneeId } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Task title is required",
        },
        { status: 400 }
      );
    }

    let resolvedTeamId = teamId;

    // If teamId is omitted, fallback to the user's first team
    if (!resolvedTeamId) {
      const userTeam = await prisma.team.findFirst({
        where: {
          OR: [
            { ownerId: authUser.id },
            { members: { some: { userId: authUser.id } } },
          ],
        },
      });

      if (!userTeam) {
        return NextResponse.json(
          {
            success: false,
            error: "Please create or join a team before creating a task",
          },
          { status: 400 }
        );
      }
      resolvedTeamId = userTeam.id;
    }

    // Check permissions: authUser must be a member or owner of the team
    const team = await prisma.team.findUnique({
      where: { id: resolvedTeamId },
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
        { success: false, error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        status: status || "To Do",
        priority: priority || "Medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId: resolvedTeamId,
        creatorId: authUser.id,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true, ownerId: true },
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
    const message = error instanceof Error ? error.message : "Failed to create task";
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
