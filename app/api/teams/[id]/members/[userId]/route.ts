import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string; userId: string }>;
}

// DELETE /api/teams/[id]/members/[userId] - Xóa thành viên khỏi team (Chỉ Owner có quyền, không được tự xóa chính mình nếu là Owner duy nhất)
export async function DELETE(request: Request, context: RouteParams) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in" },
        { status: 401 }
      );
    }

    const { id: teamId, userId: targetUserId } = await context.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Role check: ONLY Owner can remove members
    if (team.ownerId !== authUser.id) {
      return NextResponse.json(
        { success: false, error: "Only the team Owner can remove members" },
        { status: 403 }
      );
    }

    // Rule: Cannot remove the Owner from the team
    if (targetUserId === team.ownerId) {
      return NextResponse.json(
        { success: false, error: "Cannot remove the team Owner from the team" },
        { status: 400 }
      );
    }

    // Check if membership exists
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Member does not exist in this team" },
        { status: 404 }
      );
    }

    // Remove member and unassign their tasks in this team
    await prisma.$transaction([
      prisma.task.updateMany({
        where: {
          teamId,
          assigneeId: targetUserId,
        },
        data: {
          assigneeId: null,
        },
      }),
      prisma.teamMember.delete({
        where: {
          teamId_userId: {
            teamId,
            userId: targetUserId,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Member removed from team successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error removing member";
    console.error("DELETE /api/teams/[id]/members/[userId] error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
