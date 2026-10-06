import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/teams - Lấy danh sách các team mà user hiện tại đang là thành viên hoặc Owner
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in to access teams" },
        { status: 401 }
      );
    }

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: authUser.id },
          { members: { some: { userId: authUser.id } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: { members: true, tasks: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedTeams = teams.map((team) => {
      const isOwner = team.ownerId === authUser.id;
      const membership = team.members.find((m) => m.userId === authUser.id);
      const role = isOwner ? "OWNER" : membership?.role || "MEMBER";

      return {
        ...team,
        currentUserRole: role,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedTeams,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching teams";
    console.error("GET /api/teams error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in to create a team" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Team name is required" },
        { status: 400 }
      );
    }

    const newTeam = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          ownerId: authUser.id,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: authUser.id,
          role: "OWNER",
        },
      });

      return team;
    });

    const fullTeam = await prisma.team.findUnique({
      where: { id: newTeam.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { members: true, tasks: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Team created successfully",
        data: {
          ...fullTeam,
          currentUserRole: "OWNER",
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating team";
    console.error("POST /api/teams error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
