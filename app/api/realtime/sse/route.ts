import { NextRequest } from "next/server";
import { realtimeEmitter } from "@/lib/realtime-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channel = searchParams.get("channel");

  if (!channel) {
    return new Response("Channel query parameter is required", { status: 400 });
  }

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Gửi thông điệp kết nối ban đầu
  const initialData = `data: ${JSON.stringify({ event: "connected", channel })}\n\n`;
  await writer.write(encoder.encode(initialData));

  // Handler khi có event mới trong channel
  const onEvent = async (data: { event: string; payload: unknown }) => {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    } catch {
      // Stream đã đóng
      realtimeEmitter.off(channel, onEvent);
    }
  };

  realtimeEmitter.on(channel, onEvent);

  // Ping heartbeat mỗi 25 giây để giữ connection mở trên Vercel / serverless
  const intervalId = setInterval(async () => {
    try {
      await writer.write(encoder.encode(": heartbeat\n\n"));
    } catch {
      clearInterval(intervalId);
      realtimeEmitter.off(channel, onEvent);
    }
  }, 25000);

  // Xử lý dọn dẹp khi client ngắt kết nối (abort)
  request.signal.addEventListener("abort", () => {
    clearInterval(intervalId);
    realtimeEmitter.off(channel, onEvent);
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
