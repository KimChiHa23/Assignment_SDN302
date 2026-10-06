import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teams/[id] - Lấy thông tin chi tiết team, bao gồm danh sách thành viên (kèm role) và danh sách task
export async function GET(request: Request, context: RouteParams) {
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
        { success: false, error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Fetch team with relations
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { members: true, tasks: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Access check: User must be Owner or Member
    const isOwner = team.ownerId === authUser.id;
    const membership = team.members.find((m) => m.userId === authUser.id);

    if (!isOwner && !membership) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this team" },
        { status: 403 }
      );
    }

    const currentUserRole = isOwner ? "OWNER" : membership?.role || "MEMBER";

    return NextResponse.json({
      success: true,
      data: {
        ...team,
        currentUserRole,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching team details";
    console.error("GET /api/teams/[id] error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PUT /api/teams/[id] - Update team (Owner only)
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
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Role check: ONLY Owner can update team
    if (team.ownerId !== authUser.id) {
      return NextResponse.json(
        { success: false, error: "Only the team Owner can update team details" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
      return NextResponse.json(
        { success: false, error: "Team name cannot be empty" },
        { status: 400 }
      );
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team updated successfully",
      data: {
        ...updatedTeam,
        currentUserRole: "OWNER",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating team";
    console.error("PUT /api/teams/[id] error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete team (Owner only)
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
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Role check: ONLY Owner can delete team
    if (team.ownerId !== authUser.id) {
      return NextResponse.json(
        { success: false, error: "Only the team Owner can delete this team" },
        { status: 403 }
      );
    }

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error deleting team";
    console.error("DELETE /api/teams/[id] error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
