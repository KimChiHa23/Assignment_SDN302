import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { canRemoveMember, Role } from "@/lib/rbac";
import { broadcastToTeam } from "@/lib/realtime-server";

interface RouteParams {
  params: Promise<{ id: string; memberId: string }>;
}

// DELETE /api/teams/[id]/members/[memberId] - Xóa thành viên khỏi team
export async function DELETE(request: Request, context: RouteParams) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in" },
        { status: 401 }
      );
    }

    const { id: teamId, memberId } = await context.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Xác định vai trò của người thực hiện hành động (actor)
    let actorRole: Role | null = null;
    if (team.ownerId === authUser.id) {
      actorRole = "OWNER";
    } else {
      const actorMember = team.members.find((m) => m.userId === authUser.id);
      if (actorMember) {
        actorRole = actorMember.role as Role;
      }
    }

    if (!actorRole || (actorRole !== "OWNER" && actorRole !== "ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Permission denied. Only Owner and Admin can remove members." },
        { status: 403 }
      );
    }

    // Tìm thành viên mục tiêu (memberId có thể là membership.id hoặc userId)
    const targetMembership = team.members.find(
      (m) => m.id === memberId || m.userId === memberId
    );

    if (!targetMembership) {
      return NextResponse.json(
        { success: false, error: "Member not found in this team" },
        { status: 404 }
      );
    }

    const targetUserId = targetMembership.userId;
    const isSelf = targetUserId === authUser.id;
    const isTargetOwner = targetUserId === team.ownerId;
    const targetRole = isTargetOwner ? ("OWNER" as Role) : (targetMembership.role as Role);

    // Không được phép xóa Owner
    if (isTargetOwner) {
      return NextResponse.json(
        { success: false, error: "Cannot remove the team Owner" },
        { status: 400 }
      );
    }

    // Kiểm tra phân quyền RBAC
    if (!canRemoveMember(actorRole, targetRole, isSelf)) {
      if (actorRole === "ADMIN" && targetRole === "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Admins cannot remove other Admins" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { success: false, error: "You do not have permission to remove this member" },
        { status: 403 }
      );
    }

    // Thực hiện xóa và unassign task của thành viên đó trong team
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
          id: targetMembership.id,
        },
      }),
    ]);

    // Phát sóng real-time cho team
    await broadcastToTeam(teamId, "member:removed", {
      memberId: targetMembership.id,
      userId: targetUserId,
      teamId,
    });

    return NextResponse.json({
      success: true,
      message: "Member removed from team successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error removing member";
    console.error("DELETE /api/teams/[id]/members/[memberId] error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
