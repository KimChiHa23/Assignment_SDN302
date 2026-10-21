import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { canInviteMember, Role } from "@/lib/rbac";
import { broadcastToTeam, broadcastToUser } from "@/lib/realtime-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/teams/[id]/members - Thêm thành viên vào team bằng email (Owner & Admin có quyền, gán role "MEMBER")
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
        members: true,
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

    // Role check: Cả Owner và Admin đều có quyền mời thành viên mới
    if (!canInviteMember(actorRole)) {
      return NextResponse.json(
        { success: false, error: "Permission denied. Only Owner and Admin can add members." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "No user found with this email address" },
        { status: 404 }
      );
    }

    // Check if user is already a member or owner
    if (targetUser.id === team.ownerId) {
      return NextResponse.json(
        { success: false, error: "This user is already the Owner of this team" },
        { status: 400 }
      );
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: "User is already a member of this team" },
        { status: 400 }
      );
    }

    // Create TeamMember with role "MEMBER"
    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: targetUser.id,
        role: "MEMBER",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Tự động tạo bản ghi Notification (TEAM_INVITED)
    const notification = await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: "TEAM_INVITED",
        title: "Team Invitation",
        message: `You were added to team "${team.name}" by ${authUser.name || "a team member"}`,
        link: `/teams/${teamId}`,
      },
    });

    // Phát sóng real-time thông báo tới target user
    await broadcastToUser(targetUser.id, "notification:new", notification);

    // Phát sóng real-time cho team (thành viên mới gia nhập)
    await broadcastToTeam(teamId, "member:added", newMember);

    return NextResponse.json(
      {
        success: true,
        message: `Added member ${targetUser.name} to team`,
        data: newMember,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error adding team member";
    console.error("POST /api/teams/[id]/members error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
