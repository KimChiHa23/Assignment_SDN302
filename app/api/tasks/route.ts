import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tasks - Lấy danh sách tất cả các task (sắp xếp theo createdAt giảm dần)
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
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

// POST /api/tasks - Tạo mới task (bắt buộc title, description, status, priority, dueDate là tùy chọn)
export async function POST(request: Request) {
  try {
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

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        status: status || "To Do",
        priority: priority || "Medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId: teamId || null,
        assigneeId: assigneeId || null,
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
