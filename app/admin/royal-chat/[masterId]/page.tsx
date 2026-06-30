"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
  mentor_id: string | null;
};

type ChatMessage = {
  id: string;
  master_id: string;
  sender_id: string;
  message: string | null;
  message_type: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  sender?: {
    nickname: string;
  };
};

export default function RoyalChatWatchPage({
  params,
}: {
  params: Promise<{ masterId: string }>;
}) {
  const { masterId } = use(params);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [master, setMaster] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const user = JSON.parse(saved);

    if (user.rank_level < 6) {
      alert("只有王族可以進入監察聊天室");
      window.location.href = "/";
      return;
    }

    setCurrentUser(user);
    loadRoom();
  }

  async function loadRoom() {
    

    const { data: masterData } = await supabase
      .from("users")
      .select("id, nickname, rank_level, mentor_id")
      .eq("id", masterId)
      .single();

    setMaster(masterData || null);

    const { data: memberData } = await supabase
      .from("users")
      .select("id, nickname, rank_level, mentor_id")
      .eq("mentor_id", masterId);

    setMembers(memberData || []);

    const { data: messageData, error } = await supabase
      .from("house_chats")
      .select(`
        id,
        master_id,
        sender_id,
        message,
        message_type,
        file_url,
        file_name,
        created_at
        
      `)
      .eq("master_id", masterId)
      .order("created_at", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setMessages((messageData || []) as unknown as ChatMessage[]);
  }

  function formatTime(time: string) {
    return new Date(time).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/admin/royal-chat")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回監察列表
      </button>

      <h1 className="text-4xl font-bold mb-3">👁 唯讀監察聊天室</h1>

      <div className="mb-6 rounded-xl border border-yellow-500 bg-yellow-950/30 p-4">
        <p className="text-yellow-300 font-bold">王族監察模式</p>
        <p className="text-zinc-300 text-sm mt-1">
          此頁只讀取聊天紀錄，不會送出訊息、不會更新已讀，也不會通知聊天室成員。
        </p>
      </div>

      <section className="mb-8 border border-zinc-800 rounded-xl p-5 bg-zinc-950">
        <h2 className="text-2xl font-bold mb-3">
          主人：{master?.nickname || "未知"}
        </h2>

        <div className="flex flex-wrap gap-2">
          {members.length === 0 ? (
            <span className="text-zinc-500">目前沒有附屬</span>
          ) : (
            members.map((member) => (
              <span
                key={member.id}
                className="rounded-full bg-zinc-800 px-3 py-1 text-sm"
              >
                附屬：{member.nickname}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        {messages.length === 0 ? (
          <p className="text-zinc-500">目前沒有聊天紀錄。</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="border border-zinc-800 rounded-xl p-4 bg-zinc-950"
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="font-bold">
                  {master?.id === msg.sender_id
  ? master.nickname
  : members.find((m) => m.id === msg.sender_id)?.nickname || "未知使用者"}
                </p>

                <p className="text-xs text-zinc-500">
                  {formatTime(msg.created_at)}
                </p>
              </div>

              {msg.message_type === "image" && msg.file_url ? (
                <div>
                  <img
                    src={msg.file_url}
                    alt={msg.file_name || "聊天圖片"}
                    className="max-w-xs rounded-lg border border-zinc-800"
                  />
                  {msg.file_name && (
                    <p className="text-xs text-zinc-500 mt-2">
                      {msg.file_name}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-zinc-300 whitespace-pre-wrap">
                  {msg.message || "空白訊息"}
                </p>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}