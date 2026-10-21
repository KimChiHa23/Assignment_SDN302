import { EventEmitter } from "events";
import { createClient } from "@supabase/supabase-js";
import Pusher from "pusher";

// Global EventEmitter for server-sent events (SSE) fallback across route handlers
const globalForEvents = globalThis as unknown as {
  realtimeEmitter: EventEmitter | undefined;
};

export const realtimeEmitter =
  globalForEvents.realtimeEmitter ?? new EventEmitter();

// Allow unlimited listeners for team rooms
realtimeEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.realtimeEmitter = realtimeEmitter;
}

// Supabase client instance (server)
let supabaseClient: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false },
      });
    } catch {
      supabaseClient = null;
    }
  }
  return supabaseClient;
}

// Pusher server instance
let pusherServer: Pusher | null = null;
function getPusher() {
  if (pusherServer) return pusherServer;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster =
    process.env.PUSHER_CLUSTER ||
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER ||
    "ap1";

  if (appId && key && secret) {
    try {
      pusherServer = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });
    } catch {
      pusherServer = null;
    }
  }
  return pusherServer;
}

/**
 * Phát sóng sự kiện real-time tới một team
 * @param teamId ID của team
 * @param event Tên sự kiện (ví dụ: 'chat:message', 'task:created', 'task:updated', 'task:deleted')
 * @param payload Dữ liệu đính kèm
 */
export async function broadcastToTeam(
  teamId: string,
  event: string,
  payload: unknown
) {
  const channelName = `team-${teamId}`;

  // 1. In-memory / SSE Emitter (Hoạt động tức thì trên môi trường dev/local & multi-tab)
  try {
    realtimeEmitter.emit(channelName, { event, payload });
  } catch (err) {
    console.error("SSE emit error:", err);
  }

  // 2. Pusher (Nếu có cấu hình env)
  const pusher = getPusher();
  if (pusher) {
    try {
      await pusher.trigger(channelName, event, payload);
    } catch (err) {
      console.warn("Pusher trigger warning:", err);
    }
  }

  // 3. Supabase Realtime Broadcast (Nếu có cấu hình env)
  const supabase = getSupabase();
  if (supabase) {
    try {
      const channel = supabase.channel(channelName);
      await channel.send({
        type: "broadcast",
        event,
        payload,
      });
    } catch (err) {
      console.warn("Supabase broadcast warning:", err);
    }
  }
}

/**
 * Phát sóng sự kiện real-time tới một user cụ thể (dành cho Notifications)
 * @param userId ID người nhận
 * @param event Tên sự kiện (ví dụ: 'notification:new')
 * @param payload Dữ liệu thông báo
 */
export async function broadcastToUser(
  userId: string,
  event: string,
  payload: unknown
) {
  const channelName = `user-${userId}`;

  // 1. In-memory / SSE Emitter
  try {
    realtimeEmitter.emit(channelName, { event, payload });
  } catch (err) {
    console.error("SSE emit error:", err);
  }

  // 2. Pusher
  const pusher = getPusher();
  if (pusher) {
    try {
      await pusher.trigger(channelName, event, payload);
    } catch (err) {
      console.warn("Pusher trigger warning:", err);
    }
  }

  // 3. Supabase Realtime Broadcast
  const supabase = getSupabase();
  if (supabase) {
    try {
      const channel = supabase.channel(channelName);
      await channel.send({
        type: "broadcast",
        event,
        payload,
      });
    } catch (err) {
      console.warn("Supabase broadcast warning:", err);
    }
  }
}
