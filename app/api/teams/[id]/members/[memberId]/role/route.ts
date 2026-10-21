import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { canChangeMemberRole, Role } from "@/lib/rbac";
import { broadcastToTeam } from "@/lib/realtime-server";

interface RouteParams {
  params: Promise<{ id: string; memberId: string }>;
}

// PATCH /api/teams/[id]/members/[memberId]/role - Cập nhật vai trò thành viên
export async function PATCH(request: Request, context: RouteParams) {
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
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Xác định vai trò của người thực hiện hành động
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
        { success: false, error: "Permission denied. Only Owner and Admin can manage roles." },
        { status: 403 }
      );
    }

    // Tìm thành viên mục tiêu (hỗ trợ cả membership.id và userId)
    const targetMembership = team.members.find(
      (m) => m.id === memberId || m.userId === memberId
    );

    if (!targetMembership) {
      return NextResponse.json(
        { success: false, error: "Member not found in this team" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { role: newRole } = body;

    if (!newRole || (newRole !== "ADMIN" && newRole !== "MEMBER")) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Role must be 'ADMIN' or 'MEMBER'." },
        { status: 400 }
      );
    }

    const isTargetOwner = targetMembership.userId === team.ownerId;
    const targetCurrentRole: Role = isTargetOwner
      ? "OWNER"
      : (targetMembership.role as Role);

    // Kiểm tra phân quyền RBAC
    const permission = canChangeMemberRole(actorRole, targetCurrentRole, newRole);
    if (!permission.allowed) {
      return NextResponse.json(
        { success: false, error: permission.reason || "Permission denied" },
        { status: 403 }
      );
    }

    // Cập nhật vai trò trong CSDL
    const updatedMember = await prisma.teamMember.update({
      where: { id: targetMembership.id },
      data: { role: newRole as "ADMIN" | "MEMBER" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Phát sóng real-time tới tất cả thành viên trong team
    await broadcastToTeam(teamId, "member:updated", updatedMember);

    return NextResponse.json({
      success: true,
      message: `Role of ${updatedMember.user.name} changed to ${newRole}`,
      data: updatedMember,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating member role";
    console.error("PATCH /api/teams/[id]/members/[memberId]/role error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
