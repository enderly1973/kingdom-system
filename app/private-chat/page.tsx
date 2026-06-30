"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
};

type PrivateChat = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  otherUser?: User | null;
  lastMessage?: string;
  lastTime?: string;
  unreadCount?: number;
};

export default function PrivateChatListPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<PrivateChat[]>([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const me = JSON.parse(saved);
    setCurrentUser(me);
    loadChats(me.id);
  }

  async function loadChats(userId: string) {
    const { data: chatData, error } = await supabase
      .from("private_chats")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    const result: PrivateChat[] = [];

    for (const chat of chatData || []) {
      const otherUserId =
        chat.user1_id === userId ? chat.user2_id : chat.user1_id;

      const { data: otherUser } = await supabase
        .from("users")
        .select("id, nickname, rank_level")
        .eq("id", otherUserId)
        .single();

      const { data: lastMessage } = await supabase
        .from("private_messages")
        .select("message, created_at")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
        const { count: unreadCount } = await supabase
  .from("private_messages")
  .select("*", { count: "exact", head: true })
  .eq("chat_id", chat.id)
  .neq("sender_id", userId)
  .eq("is_read", false);

      result.push({
        ...chat,
        otherUser,
        lastMessage: lastMessage?.message || "尚無訊息",
lastTime: lastMessage?.created_at,
unreadCount: unreadCount || 0,
      });
    }

    result.sort((a, b) => {
      const timeA = a.lastTime || a.created_at;
      const timeB = b.lastTime || b.created_at;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    setChats(result);
  }

  function formatTime(time?: string) {
    if (!time) return "";

    return new Date(time).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getRankName(rank: number) {
    if (rank === 1) return "C級奴隸";
    if (rank === 2) return "B級奴隸";
    if (rank === 3) return "平民";
    if (rank === 4) return "騎士";
    if (rank === 5) return "貴族";
    return `階級 ${rank}`;
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => (window.location.href = "/")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-400"
      >
        ← 返回首頁
      </button>

      <h1 className="text-3xl font-bold mb-6">💬 私訊列表</h1>

      {chats.length === 0 ? (
        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950">
          <p className="text-zinc-400 mb-4">目前沒有私訊聊天室。</p>

          <button
            onClick={() => (window.location.href = "/users")}
            className="bg-white text-black rounded-lg px-4 py-2 font-bold"
          >
            前往成員名錄
          </button>
        </div>
      ) : (
        <section className="space-y-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() =>
                (window.location.href = `/private-chat/${chat.otherUser?.id}`)
              }
              className="border border-zinc-800 rounded-xl p-5 bg-zinc-950 cursor-pointer hover:border-zinc-400"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    {chat.otherUser?.nickname || "未知使用者"}
                  </h2>

                  <p className="text-sm text-zinc-500 mb-3">
                    {chat.otherUser
                      ? getRankName(chat.otherUser.rank_level)
                      : ""}
                  </p>

                  <p className="text-zinc-300">{chat.lastMessage}</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
  <p className="text-xs text-zinc-500">
    {formatTime(chat.lastTime || chat.created_at)}
  </p>

  {(chat.unreadCount || 0) > 0 && (
    <span className="bg-red-600 text-white text-xs rounded-full px-2 py-1">
      {chat.unreadCount}
    </span>
  )}
</div>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}