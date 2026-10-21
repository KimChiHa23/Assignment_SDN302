import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { broadcastToTeam } from "@/lib/realtime-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teams/[id]/messages - Lấy lịch sử chat của team (sắp xếp tăng dần theo thời gian)
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
    if (!teamId) {
      return NextResponse.json(
        { success: false, error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Kiểm tra xem team có tồn tại và user có quyền truy cập không
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

    const isOwner = team.ownerId === authUser.id;
    const isMember = team.members.length > 0;

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to view messages in this team" },
        { status: 403 }
      );
    }

    // Lấy tin nhắn sắp xếp tăng dần theo thời gian
    const messages = await prisma.message.findMany({
      where: { teamId },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching messages";
    console.error("GET /api/teams/[id]/messages error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/teams/[id]/messages - Gửi tin nhắn mới, lưu CSDL và phát sóng real-time
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
    if (!teamId) {
      return NextResponse.json(
        { success: false, error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Kiểm tra xem team có tồn tại và user có thuộc team không
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

    const isOwner = team.ownerId === authUser.id;
    const isMember = team.members.length > 0;

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to send messages in this team" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    // Lưu tin nhắn vào CSDL
    const newMessage = await prisma.message.create({
      data: {
        content: content.trim(),
        teamId,
        senderId: authUser.id,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Phát sóng real-time tới tất cả thành viên trong team
    await broadcastToTeam(teamId, "chat:message", newMessage);

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully",
        data: newMessage,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error sending message";
    console.error("POST /api/teams/[id]/messages error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
