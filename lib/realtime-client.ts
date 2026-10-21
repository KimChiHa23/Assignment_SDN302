"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Pusher from "pusher-js";

let supabaseClient: SupabaseClient | null = null;
function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      supabaseClient = createClient(url, key);
    } catch {
      supabaseClient = null;
    }
  }
  return supabaseClient;
}

let pusherClient: Pusher | null = null;
function getPusherClient(): Pusher | null {
  if (pusherClient) return pusherClient;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1";

  if (key) {
    try {
      pusherClient = new Pusher(key, {
        cluster,
      });
    } catch {
      pusherClient = null;
    }
  }
  return pusherClient;
}

export type RealtimeEventHandler = (event: string, payload: unknown) => void;

/**
 * Đăng ký lắng nghe sự kiện real-time trên một channel
 * Tự động kết hợp:
 * 1. Server-Sent Events (SSE)
 * 2. Supabase Realtime (nếu có key)
 * 3. Pusher (nếu có key)
 * 4. BroadcastChannel (đồng bộ giữa các tab trình duyệt local)
 *
 * @returns Hàm unsubscribe dọn dẹp sạch sẽ, không gây memory leak
 */
export function subscribeToRealtimeChannel(
  channelName: string,
  onEvent: RealtimeEventHandler
): () => void {
  // Tránh duplicate events bằng event timestamp/id cache
  const recentEvents = new Set<string>();
  const handleDeduplicated = (event: string, payload: unknown) => {
    // Tạo hash đơn giản của event + payload để chống nhận lặp từ nhiều transports
    const eventKey = `${event}:${JSON.stringify(payload)}`;
    if (recentEvents.has(eventKey)) return;
    recentEvents.add(eventKey);
    setTimeout(() => {
      recentEvents.delete(eventKey);
    }, 3000);

    onEvent(event, payload);
  };

  // 1. BroadcastChannel (Local multi-tab instant sync)
  let broadcastChannel: BroadcastChannel | null = null;
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      broadcastChannel = new BroadcastChannel(`taskflow:${channelName}`);
      broadcastChannel.onmessage = (msg) => {
        if (msg.data && msg.data.event) {
          handleDeduplicated(msg.data.event, msg.data.payload);
        }
      };
    } catch {
      broadcastChannel = null;
    }
  }

  // 2. Server-Sent Events (SSE)
  let eventSource: EventSource | null = null;
  if (typeof window !== "undefined" && "EventSource" in window) {
    try {
      eventSource = new EventSource(
        `/api/realtime/sse?channel=${encodeURIComponent(channelName)}`
      );
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.event && data.event !== "connected") {
            handleDeduplicated(data.event, data.payload);
          }
        } catch {
          // Ignore parse errors on heartbeats
        }
      };
    } catch {
      eventSource = null;
    }
  }

  // 3. Supabase Realtime
  let supabaseChannelObj: ReturnType<SupabaseClient["channel"]> | null = null;
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      supabaseChannelObj = supabase
        .channel(channelName)
        .on("broadcast", { event: "*" }, (payload) => {
          handleDeduplicated(payload.event, payload.payload);
        })
        .subscribe();
    } catch (e) {
      console.warn("Supabase Realtime subscribe notice:", e);
    }
  }

  // 4. Pusher
  const pusher = getPusherClient();
  let pusherChannelObj: ReturnType<Pusher["subscribe"]> | null = null;
  if (pusher) {
    try {
      pusherChannelObj = pusher.subscribe(channelName);
      pusherChannelObj.bind_global((event: string, data: unknown) => {
        if (!event.startsWith("pusher:")) {
          handleDeduplicated(event, data);
        }
      });
    } catch (e) {
      console.warn("Pusher subscribe notice:", e);
    }
  }

  // Trả về cleanup callback
  return () => {
    // Đóng BroadcastChannel
    if (broadcastChannel) {
      try {
        broadcastChannel.close();
      } catch {}
    }

    // Đóng EventSource
    if (eventSource) {
      try {
        eventSource.close();
      } catch {}
    }

    // Hủy đăng ký Supabase channel
    if (supabase && supabaseChannelObj) {
      try {
        supabase.removeChannel(supabaseChannelObj);
      } catch {}
    }

    // Hủy đăng ký Pusher channel
    if (pusher && pusherChannelObj) {
      try {
        pusher.unsubscribe(channelName);
      } catch {}
    }
  };
}

/**
 * Phát sóng cục bộ qua BroadcastChannel tới các tab trình duyệt khác
 */
export function broadcastLocally(
  channelName: string,
  event: string,
  payload: unknown
) {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(`taskflow:${channelName}`);
      channel.postMessage({ event, payload });
      setTimeout(() => channel.close(), 500);
    } catch {}
  }
}
