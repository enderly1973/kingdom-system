"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
  mentor_id: string | null;
};

type ChatItem = {
  masterId: string;
  title: string;
  subtitle: string;
  members: User[];
  lastMessage: string;
  lastSenderName: string;
  lastTime: string | null;
  unreadCount: number;
};

export default function HouseChatListPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const localUser = JSON.parse(saved);

    const { data: freshUser, error } = await supabase
      .from("users")
      .select("id, nickname, rank_level, mentor_id")
      .eq("id", localUser.id)
      .single();

    if (error || !freshUser) {
      alert(error?.message || "找不到使用者");
      window.location.href = "/";
      return;
    }

    setCurrentUser(freshUser);
    loadChats(freshUser);
  }

  async function loadChats(user: User) {
    let chatMasterIds: string[] = [];

    if (user.rank_level >= 6) {
      const { data: masters, error: mastersError } = await supabase
        .from("users")
        .select("id")
        .gt("rank_level", 0);

      if (mastersError) {
        console.log(mastersError);
        return;
      }

      chatMasterIds = (masters || []).map((m) => m.id);
    } else {
      if (user.mentor_id) {
        chatMasterIds.push(user.mentor_id);
      }

      const { data: followers, error: followersError } = await supabase
        .from("users")
        .select("id, nickname, rank_level, mentor_id")
        .eq("mentor_id", user.id);

      if (followersError) {
        console.log(followersError);
        return;
      }

      if ((followers || []).length > 0) {
        chatMasterIds.push(user.id);
      }
    }

    const uniqueMasterIds = Array.from(new Set(chatMasterIds));
    const items: ChatItem[] = [];

    for (const masterId of uniqueMasterIds) {
      const item = await buildChatItem(user, masterId);
      if (item) items.push(item);
    }

    items.sort((a, b) => {
      const timeA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
      const timeB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
      return timeB - timeA;
    });

    setChats(items);
  }

  async function buildChatItem(user: User, masterId: string) {
    const { data: members, error: membersError } = await supabase
      .from("users")
      .select("id, nickname, rank_level, mentor_id")
      .or(`id.eq.${masterId},mentor_id.eq.${masterId}`);

    if (membersError) {
      console.log(membersError);
      return null;
    }

    const memberList = members || [];
    const master = memberList.find((m) => m.id === masterId);

    const { data: lastMsg } = await supabase
      .from("house_chats")
      .select("id, sender_id, message, message_type, file_name, created_at")
      .eq("master_id", masterId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: readData } = await supabase
      .from("house_chat_reads")
      .select("last_read_at")
      .eq("user_id", user.id)
      .eq("master_id", masterId)
      .maybeSingle();

    const lastReadAt = readData?.last_read_at || "1970-01-01T00:00:00.000Z";

    const { count } = await supabase
      .from("house_chats")
      .select("id", { count: "exact", head: true })
      .eq("master_id", masterId)
      .gt("created_at", lastReadAt)
      .neq("sender_id", user.id);

    const sender = lastMsg
      ? memberList.find((m) => m.id === lastMsg.sender_id)
      : null;

    const isMyOwnerChat = user.mentor_id === masterId;

    let lastMessage = "目前沒有訊息";

    if (lastMsg) {
      if (lastMsg.message_type === "image") {
        lastMessage = lastMsg.file_name
          ? `傳送了圖片：${lastMsg.file_name}`
          : "傳送了圖片";
      } else {
        lastMessage = lastMsg.message || "空白訊息";
      }
    }

    return {
      masterId,
      title:
        user.rank_level >= 6
          ? "👁 王族監察聊天室"
          : isMyOwnerChat
          ? "我的主人聊天室"
          : "我的附屬聊天室",
      subtitle: `主人：${master?.nickname || "未知"}`,
      members: memberList.filter((m) => m.id !== masterId),
      lastMessage,
      lastSenderName: sender?.nickname || "",
      lastTime: lastMsg?.created_at || null,
      unreadCount: count || 0,
    };
  }

  function goChat(masterId: string) {
    window.location.href = `/house-chat/${masterId}`;
  }

  function formatTime(time: string | null) {
    if (!time) return "";

    return new Date(time).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => (window.location.href = "/tasks")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-400"
      >
        ← 返回任務區
      </button>

      <h1 className="text-3xl font-bold mb-2">聊天室</h1>

<p className="text-zinc-400 mb-6">
  選擇要進入的主人／附屬聊天室。
</p>
      <section className="space-y-4">
        {chats.length === 0 ? (
          <p className="text-zinc-500">目前沒有可進入的聊天室。</p>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.masterId}
              className="border border-zinc-800 rounded-xl p-5 bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold mb-2">{chat.title}</h2>

                  <p className="text-zinc-400 mb-3">{chat.subtitle}</p>

                  {chat.members.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {chat.members.map((member) => (
                        <span
                          key={member.id}
                          className="rounded-full bg-zinc-800 px-3 py-1 text-sm"
                        >
                          {member.nickname}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-zinc-300 mb-2">
                    <span className="text-zinc-500">最後訊息：</span>
                    {chat.lastSenderName && (
                      <span>{chat.lastSenderName}：</span>
                    )}
                    <span>{chat.lastMessage}</span>
                  </div>

                  {chat.lastTime && (
                    <p className="text-xs text-zinc-500">
                      {formatTime(chat.lastTime)}
                    </p>
                  )}
                </div>

                {chat.unreadCount > 0 && (
                  <div className="min-w-7 h-7 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center px-2">
                    {chat.unreadCount}
                  </div>
                )}
              </div>

              <button
                onClick={() => goChat(chat.masterId)}
                className="mt-5 bg-white text-black rounded-lg px-5 py-2 font-bold"
              >
                進入聊天室
              </button>
            </div>
          ))
        )}
      </section>
    </main>
  );
}