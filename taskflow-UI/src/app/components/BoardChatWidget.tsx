import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  MessageSquareText,
  Send,
  Search,
  X,
  Trash2,
  Users,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { chatApi, usersApi, websocketService } from "../../api";
import type { ChatMessage } from "../../types";

interface BoardChatWidgetProps {
  boardId: number;
  boardName: string;
}

function avatarColor(name: string) {
  const palette = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
  return palette[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(value: string) {
  if (!value) return "Just now";
  const dateStr = value.endsWith("Z") || value.includes("+") ? value : `${value}Z`;
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMinutes = Math.max(1, Math.round((now - date.getTime()) / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function BoardChatWidget({ boardId, boardName }: BoardChatWidgetProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [chatSearchKeyword, setChatSearchKeyword] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userProfileQuery = useQuery({
    queryKey: ["user-profile-me"],
    queryFn: () => usersApi.getMe(),
  });
  const currentUserId = userProfileQuery.data?.id;
  const currentUserFullName = userProfileQuery.data?.fullName;

  const boardChatMessagesQuery = useQuery({
    queryKey: ["board-chat-messages", boardId],
    queryFn: () => chatApi.getBoardMessages(boardId),
    enabled: !!boardId,
  });

  const boardChatSearchQuery = useQuery({
    queryKey: ["board-chat-search", boardId, chatSearchKeyword],
    queryFn: () => chatApi.searchBoardMessages(boardId, chatSearchKeyword),
    enabled: !!boardId && chatSearchKeyword.trim().length > 0,
  });

  const chatMessages = useMemo(() => {
    if (chatSearchKeyword.trim().length > 0 && boardChatSearchQuery.data) {
      return boardChatSearchQuery.data;
    }
    return boardChatMessagesQuery.data ?? [];
  }, [chatSearchKeyword, boardChatSearchQuery.data, boardChatMessagesQuery.data]);

  useEffect(() => {
    if (!boardId) return;

    // Subscribe to real-time STOMP topic for board messages (/topic/board/{boardId})
    const unsubscribe = websocketService.subscribeToBoard(boardId, (wsMessage) => {
      if (wsMessage.type === "CHAT_MESSAGE") {
        queryClient.setQueryData<ChatMessage[]>(
          ["board-chat-messages", boardId],
          (old = []) => {
            const incoming = wsMessage.payload as ChatMessage;
            if (old.some((m) => m.id === incoming.id)) return old;
            return [...old, incoming];
          }
        );
      } else if (wsMessage.type === "CHAT_MESSAGE_DELETE") {
        const deletedId = wsMessage.payload as string;
        queryClient.setQueryData<ChatMessage[]>(
          ["board-chat-messages", boardId],
          (old = []) =>
            old.map((m) =>
              m.id === deletedId
                ? { ...m, isDeleted: true, content: "Message is deleted" }
                : m
            )
        );
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [boardId, queryClient]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, chatMessages.length]);

  const sendBoardMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!boardId) throw new Error("Missing boardId");
      return chatApi.sendBoardMessage(boardId, { content });
    },
    onSuccess: (newMessage: ChatMessage) => {
      setNewChatMessage("");
      if (newMessage && newMessage.id) {
        queryClient.setQueryData<ChatMessage[]>(
          ["board-chat-messages", boardId],
          (old = []) => {
            if (old.some((m) => m.id === newMessage.id)) return old;
            return [...old, newMessage];
          }
        );
      }
    },
  });

  const deleteBoardMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!boardId) throw new Error("Missing boardId");
      await chatApi.deleteBoardMessage(boardId, messageId);
      return messageId;
    },
    onSuccess: (messageId: string) => {
      queryClient.setQueryData<ChatMessage[]>(
        ["board-chat-messages", boardId],
        (old = []) =>
          old.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, content: "Message is deleted" }
              : m
          )
      );
    },
  });

  return (
    <>
      {/* Floating Toggle Button (Fixed Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6366f1] via-[#6d6cf8] to-[#8b5cf6] text-white shadow-[0_10px_25px_-5px_rgba(99,102,241,0.5)] transition-shadow hover:shadow-[0_15px_30px_-5px_rgba(99,102,241,0.7)]"
        >
          {isOpen ? (
            <ChevronDown className="h-6 w-6" />
          ) : (
            <MessageSquareText className="h-6 w-6" />
          )}

          {!isOpen && chatMessages.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ef4444] px-1.5 text-[10px] font-bold text-white shadow-md">
              {chatMessages.length > 99 ? "99+" : chatMessages.length}
            </span>
          )}
        </motion.button>
      </div>

      {/* Floating Board Chat Drawer Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 flex h-[520px] w-96 flex-col overflow-hidden rounded-3xl border border-[#27365a] bg-[#09101f]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#1c2947] bg-[#0c1529]/80 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6d6cf8]/20 text-[#8b8aeb]">
                  <MessageSquareText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#eef2ff] truncate max-w-[190px]">
                    {boardName} Chat
                  </h3>
                  <p className="text-[10px] font-medium text-[#10b981] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    Realtime Project Room
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#65769a] transition-colors hover:bg-[#192542] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="border-b border-[#17233d] bg-[#070d1a] px-3 py-2">
              <div className="flex items-center gap-2 rounded-xl border border-[#1b2847] bg-[#0c1426] px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-[#526388]" />
                <input
                  type="text"
                  value={chatSearchKeyword}
                  onChange={(e) => setChatSearchKeyword(e.target.value)}
                  placeholder="Search project messages..."
                  className="w-full bg-transparent text-xs text-[#eef2ff] placeholder:text-[#526388] focus:outline-none"
                />
                {chatSearchKeyword && (
                  <button
                    onClick={() => setChatSearchKeyword("")}
                    className="text-xs text-[#637498] hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {boardChatMessagesQuery.isLoading && !boardChatMessagesQuery.isError ? (
                <div className="flex h-full items-center justify-center text-xs text-[#64748b]">
                  Loading messages...
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-[#526388]">
                  <MessageSquare className="h-8 w-8 opacity-40 text-[#6d6cf8]" />
                  <p className="font-medium text-[#7e90b8]">No messages in project chat yet.</p>
                  <p className="text-[11px] text-[#485675]">Say hi to your team!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  if (msg.type === "SYSTEM") {
                    return (
                      <div key={msg.id} className="my-2 flex justify-center">
                        <span className="rounded-full border border-[#1e2c4a] bg-[#0c1527] px-3 py-0.5 text-[10px] font-medium text-[#7687aa]">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  const isOwn = Boolean(
                    msg.isOwn ||
                    (currentUserId && msg.senderId === currentUserId) ||
                    (currentUserFullName && msg.senderName && msg.senderName.trim().toLowerCase() === currentUserFullName.trim().toLowerCase())
                  );

                  return (
                    <div
                      key={msg.id}
                      className={`group flex items-start gap-2.5 ${
                        isOwn ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white shadow-sm"
                        style={{ backgroundColor: avatarColor(msg.senderName || "User") }}
                      >
                        {initials(msg.senderName || "U")}
                      </div>
                      <div
                        className={`relative max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          isOwn
                            ? "bg-[#6d6cf8] text-white shadow-md shadow-[#6d6cf8]/20"
                            : "border border-[#1d2a4a] bg-[#10192e] text-[#dce5f8]"
                        } ${msg.isDeleted ? "italic opacity-60" : ""}`}
                      >
                        {!isOwn && (
                          <p className="mb-0.5 text-[10px] font-semibold text-[#8ca0c7]">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <span
                          className={`mt-1 block text-[9px] ${
                            isOwn ? "text-white/70" : "text-[#586b91]"
                          }`}
                        >
                          {formatRelativeTime(msg.createdAt)}
                        </span>

                        {isOwn && !msg.isDeleted && (
                          <button
                            onClick={() => deleteBoardMessageMutation.mutate(msg.id)}
                            title="Delete message"
                            className="absolute -left-6 top-2 hidden text-[#6e7f9e] hover:text-[#ef4444] group-hover:block"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-[#1a2745] bg-[#0a1121] p-3">
              <div className="flex items-center gap-2 rounded-2xl border border-[#202f54] bg-[#060c18] p-1.5 focus-within:border-[#6d6cf8]">
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newChatMessage.trim()) {
                      sendBoardMessageMutation.mutate(newChatMessage.trim());
                    }
                  }}
                  placeholder="Type a message to project..."
                  className="w-full bg-transparent px-2.5 text-xs text-[#eef2ff] placeholder:text-[#526388] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!newChatMessage.trim() || sendBoardMessageMutation.isPending}
                  onClick={() => {
                    if (newChatMessage.trim()) {
                      sendBoardMessageMutation.mutate(newChatMessage.trim());
                    }
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6d6cf8] text-white transition-colors hover:bg-[#5b5cf0] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
