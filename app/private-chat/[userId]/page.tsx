"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
};

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export default function PrivateChatPage() {
  const params = useParams();
  const targetUserId = params.userId as string;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!chatId) return;

    loadMessages(chatId);

    const channel = supabase
      .channel(`private-chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  async function init() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      alert("請先登入");
      window.location.href = "/";
      return;
    }

    const me: User = JSON.parse(saved);
    setCurrentUser(me);

    const { data: target, error: targetError } = await supabase
      .from("users")
      .select("id, nickname, rank_level")
      .eq("id", targetUserId)
      .single();

    if (targetError || !target) {
      alert("找不到這位使用者");
      window.location.href = "/users";
      return;
    }

    setTargetUser(target);

    if (!canPrivateChat(me.rank_level, target.rank_level, me.id, target.id)) {
      alert("你沒有權限私訊這位使用者");
      window.location.href = "/users";
      return;
    }

    await findOrCreateChat(me.id, target.id);
  }

  function canPrivateChat(
    myRank: number,
    targetRank: number,
    myId: string,
    targetId: string
  ) {
    if (myId === targetId) return false;

    // 新成員不能私訊
    if (myRank === 0 || targetRank === 0) return false;

    // 王族不走一般私訊
    if (myRank === 6 || targetRank === 6) return false;

    // C/B奴只能私訊平民、騎士、貴族
    if (myRank === 1 || myRank === 2) {
      return targetRank >= 3 && targetRank <= 5;
    }

    // 平民、騎士、貴族可以私訊 C奴～貴族
    if (myRank >= 3 && myRank <= 5) {
      return targetRank >= 1 && targetRank <= 5;
    }

    return false;
  }

  async function findOrCreateChat(userA: string, userB: string) {
    const { data: existing } = await supabase
      .from("private_chats")
      .select("*")
      .or(
        `and(user1_id.eq.${userA},user2_id.eq.${userB}),and(user1_id.eq.${userB},user2_id.eq.${userA})`
      )
      .maybeSingle();

    if (existing) {
      setChatId(existing.id);
      return;
    }

    const { data: created, error } = await supabase
      .from("private_chats")
      .insert({
        user1_id: userA,
        user2_id: userB,
      })
      .select()
      .single();

    if (error || !created) {
      alert("建立聊天室失敗");
      return;
    }

    setChatId(created.id);
  }

  async function loadMessages(id: string) {
const saved = localStorage.getItem("currentUser");

if (saved) {
  const user = JSON.parse(saved);

  await supabase
    .from("private_messages")
    .update({ is_read: true })
    .eq("chat_id", id)
    .neq("sender_id", user.id)
    .eq("is_read", false);
}
  const { data } = await supabase
    .from("private_messages")
    .select("*")
    .eq("chat_id", id)
    .order("created_at", { ascending: true });

  setMessages(data || []);
}

  async function sendMessage() {
    if (!chatId || !currentUser || !text.trim()) return;

    const content = text.trim();
    setText("");

    const { error } = await supabase.from("private_messages").insert({
  chat_id: chatId,
  sender_id: currentUser.id,
  message: content,
  is_read: false,
});

if (error) {
  alert(error.message);
  return;
}

const { error: notifyError } = await supabase.from("notifications").insert({
  user_id: targetUser?.id,
  title: "新的私訊",
  content: `${currentUser.nickname} 傳了一則私訊給你。`,
  type: "private_message",
  
related_id: currentUser.id,
});

if (notifyError) {
  alert("通知建立失敗：" + notifyError.message);
}

loadMessages(chatId);
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => window.history.back()}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-400"
      >
        ← 返回
      </button>

      <h1 className="text-2xl font-bold mb-2">💬 私訊</h1>

      <p className="text-zinc-400 mb-6">
        對象：{targetUser ? targetUser.nickname : "讀取中..."}
      </p>

      <div className="border border-zinc-800 rounded-xl p-4 h-[60vh] overflow-y-auto mb-4 bg-zinc-950">
        {messages.length === 0 ? (
          <p className="text-zinc-500">尚無訊息</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUser?.id;

            return (
              <div
                key={msg.id}
                className={`mb-3 flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-xl px-4 py-2 ${
                    isMine
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {msg.message}
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
          placeholder="輸入訊息..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 outline-none"
        />

        <button
          onClick={sendMessage}
          className="bg-white text-black rounded-lg px-5 py-2 font-bold"
        >
          送出
        </button>
      </div>
    </main>
  );
}