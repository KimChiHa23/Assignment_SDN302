import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/teams/[id]/members - Thêm thành viên vào team bằng email nhập vào (Chỉ Owner có quyền, gán role "MEMBER")
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
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Role check: ONLY Owner can add members
    if (team.ownerId !== authUser.id) {
      return NextResponse.json(
        { success: false, error: "Only the team Owner can add new members" },
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

    // Check if user is already a member
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
