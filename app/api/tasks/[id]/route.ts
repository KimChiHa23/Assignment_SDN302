import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/tasks/[id] - Cập nhật task theo id
export async function PUT(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Task ID is required" }, { status: 400 });
    }

    // Kiểm tra task có tồn tại không
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, teamId, assigneeId } = body;

    if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
      return NextResponse.json(
        { success: false, error: "Task title cannot be empty" },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(teamId !== undefined && { teamId: teamId || null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update task";
    console.error("PUT /api/tasks/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Xóa task theo id
export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Task ID is required" }, { status: 400 });
    }

    // Kiểm tra task có tồn tại không
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete task";
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
