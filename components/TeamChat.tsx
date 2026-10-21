"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  MessageSquare,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { MessageItem } from "@/types/message";
import { AuthUser } from "@/types/auth";
import {
  subscribeToRealtimeChannel,
  broadcastLocally,
} from "@/lib/realtime-client";

interface TeamChatProps {
  teamId: string;
  teamName: string;
  currentUser: AuthUser | null;
}

function formatChatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function TeamChat({
  teamId,
  teamName,
  currentUser,
}: TeamChatProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  // Lấy lịch sử chat ban đầu
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!teamId) return;
      try {
        const res = await fetch(`/api/teams/${teamId}/messages`);
        const data = await res.json();
        if (!ignore && res.ok && data.success) {
          setMessages(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
          setTimeout(() => scrollToBottom(false), 100);
        }
      }
    }
    load();

    return () => {
      ignore = true;
    };
  }, [teamId, scrollToBottom]);

  // Đăng ký nhận tin nhắn real-time
  useEffect(() => {
    if (!teamId) return;

    const channelName = `team-${teamId}`;
    const unsubscribe = subscribeToRealtimeChannel(
      channelName,
      (event, payload) => {
        if (event === "chat:message") {
          const newMsg = payload as MessageItem;
          setMessages((prev) => {
            // Tránh duplicate id
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
          setTimeout(() => scrollToBottom(true), 50);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [teamId, scrollToBottom]);

  // Gửi tin nhắn
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || isSending || !currentUser) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to send message");
        return;
      }

      // Optimistic update state if not already received from broadcast
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.data.id)) return prev;
        return [...prev, data.data];
      });

      // Broadcast locally so other open tabs on this browser see it instantly
      broadcastLocally(`team-${teamId}`, "chat:message", data.data);

      setInputText("");
      setTimeout(() => scrollToBottom(true), 50);
    } catch {
      setError("Network error sending message");
    } finally {
      setIsSending(false);
    }
  };

  // Nhấn Enter để gửi (Shift + Enter để xuống dòng)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[620px] flex-col rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-[#181329] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800/80 bg-slate-50/60 dark:bg-purple-950/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Team Live Chat</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time discussion for {teamName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
            Realtime Active
          </span>
        </div>
      </div>

      {/* Messages List Area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/30 dark:bg-transparent"
      >
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600 mb-2" />
            <span className="text-xs">Loading chat history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 mb-3 shadow-xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No messages yet
            </h4>
            <p className="mt-1 text-[11px] text-slate-400 max-w-xs">
              Be the first to say hello! All online team members will receive messages immediately in real time.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser?.id;
            const prevMsg = messages[idx - 1];
            const isSameSender = prevMsg && prevMsg.senderId === msg.senderId;

            return (
              <div
                key={`${msg.id || idx}-${idx}`}
                className={`flex gap-2.5 ${isMe ? "justify-end" : "justify-start"} ${
                  isSameSender ? "mt-1" : "mt-3.5"
                }`}
              >
                {/* Avatar for other users */}
                {!isMe && (
                  <div className="flex shrink-0 items-end">
                    {!isSameSender ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-slate-600 to-slate-800 text-[10px] font-bold text-white shadow-xs">
                        {msg.sender.name ? msg.sender.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    ) : (
                      <div className="w-7" />
                    )}
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender Name if first in group */}
                  {!isMe && !isSameSender && (
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 px-1">
                      {msg.sender.name}
                    </span>
                  )}

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-xs shadow-xs leading-relaxed whitespace-pre-wrap break-words ${
                      isMe
                        ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-br-xs"
                        : "bg-white text-slate-800 border border-slate-200/80 dark:border-slate-800 dark:bg-[#201a35] dark:text-slate-100 rounded-bl-xs"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] text-slate-400">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{formatChatTime(msg.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-100 p-3 sm:p-4 bg-white dark:border-slate-800 dark:bg-[#181329]">
        {error && (
          <div className="mb-2 rounded-xl bg-rose-50 px-3 py-1.5 text-[11px] text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-[#141022] dark:text-white dark:focus:border-purple-600 dark:placeholder:text-slate-500 max-h-28"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md shadow-purple-500/25 transition hover:from-purple-700 hover:to-violet-700 active:scale-95 disabled:opacity-50 disabled:shadow-none"
            title="Send Message"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
