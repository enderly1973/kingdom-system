"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
};

type Message = {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: {
    nickname: string;
  };
};

export default function RoyalChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("royal-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "royal_messages",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function init() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const user = JSON.parse(saved);

    if (user.rank_level !== 6) {
      alert("只有王族可以進入王族聊天室");
      window.location.href = "/";
      return;
    }

    setCurrentUser(user);
  }

  async function loadMessages() {
    const { data, error } = await supabase
      .from("royal_messages")
      .select(`
        *,
        sender:users!royal_messages_sender_id_fkey (
          nickname
        )
      `)
      .order("created_at", { ascending: true });

    if (error) {
      console.log(error.message);
      return;
    }

    setMessages(data || []);
  }

  async function sendMessage() {
    if (!currentUser || !text.trim()) return;

    const content = text.trim();
    setText("");

    const { error } = await supabase.from("royal_messages").insert({
      sender_id: currentUser.id,
      message: content,
    });

    if (error) {
      alert(error.message);
      return;
    }

    loadMessages();
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => (window.location.href = "/")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-400"
      >
        ← 返回首頁
      </button>

      <h1 className="text-3xl font-bold mb-2">👑 王族聊天室</h1>
      <p className="text-zinc-400 mb-6">王族專屬隱藏聊天室</p>

      <div className="border border-zinc-800 rounded-xl p-4 h-[60vh] overflow-y-auto mb-4 bg-zinc-950">
        {messages.length === 0 ? (
          <p className="text-zinc-500">尚無訊息</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUser?.id;

            return (
              <div
                key={msg.id}
                className={`mb-4 flex ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-xl px-4 py-2 ${
                    isMine
                      ? "bg-yellow-600 text-black"
                      : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs text-zinc-400 mb-1">
                      {msg.sender?.nickname || "未知王族"}
                    </p>
                  )}

                  <p>{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="輸入王族訊息..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 outline-none"
        />

        <button
          onClick={sendMessage}
          className="bg-yellow-500 text-black rounded-lg px-5 py-2 font-bold"
        >
          送出
        </button>
      </div>
    </main>
  );
}