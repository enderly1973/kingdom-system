"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
  mentor_id: string | null;
};

type RoyalChat = {
  masterId: string;
  masterName: string;
  members: User[];
  lastMessage: string;
  lastTime: string | null;
};

export default function RoyalChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<RoyalChat[]>([]);
  const [search, setSearch] = useState("");

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
    loadChats();
  }

  async function loadChats() {
    const { data: masters, error } = await supabase
      .from("users")
      .select("id, nickname, rank_level, mentor_id")
      .gt("rank_level", 0);

    if (error) {
      alert(error.message);
      return;
    }

    const items: RoyalChat[] = [];

    for (const master of masters || []) {
      const { data: members } = await supabase
        .from("users")
        .select("id, nickname, rank_level, mentor_id")
        .eq("mentor_id", master.id);

      const { data: lastMsg } = await supabase
        .from("house_chats")
        .select("message, message_type, file_name, created_at")
        .eq("master_id", master.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!members || members.length === 0) continue;

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

      items.push({
        masterId: master.id,
        masterName: master.nickname,
        members,
        lastMessage,
        lastTime: lastMsg?.created_at || null,
      });
    }

    items.sort((a, b) => {
      const timeA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
      const timeB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
      return timeB - timeA;
    });

    setChats(items);
  }

  function formatTime(time: string | null) {
    if (!time) return "尚無訊息";

    return new Date(time).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filteredChats = chats.filter((chat) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    const masterName = chat.masterName.toLowerCase();
    const memberNames = chat.members
      .map((m) => m.nickname.toLowerCase())
      .join(" ");

    return masterName.includes(keyword) || memberNames.includes(keyword);
  });

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/admin")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回管理後台
      </button>

      <h1 className="text-4xl font-bold mb-3">👁 王族監察聊天室</h1>

      <p className="text-zinc-400 mb-6">
        王族可查看所有師門聊天室入口。此頁只作為監察入口，不會修改聊天室資料。
      </p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜尋主人或附屬暱稱"
        className="w-full max-w-xl rounded-lg bg-zinc-900 border border-zinc-700 p-3 mb-8"
      />

      {filteredChats.length === 0 ? (
        <p className="text-zinc-500">目前沒有符合條件的聊天室。</p>
      ) : (
        <div className="space-y-5">
          {filteredChats.map((chat) => (
            <div
              key={chat.masterId}
              className="border border-zinc-800 rounded-xl p-5 bg-zinc-950"
            >
              <h2 className="text-2xl font-bold mb-2">
                👑 主人：{chat.masterName}
              </h2>

              <div className="flex flex-wrap gap-2 mb-4">
                {chat.members.map((member) => (
                  <span
                    key={member.id}
                    className="rounded-full bg-zinc-800 px-3 py-1 text-sm"
                  >
                    附屬：{member.nickname}
                  </span>
                ))}
              </div>

              <p className="text-zinc-300 mb-1">
                最後訊息：{chat.lastMessage}
              </p>

              <p className="text-xs text-zinc-500 mb-4">
                {formatTime(chat.lastTime)}
              </p>

              <button
                onClick={() =>
                  (window.location.href = `/admin/royal-chat/${chat.masterId}`)
                }
                className="rounded bg-yellow-500 px-4 py-2 font-bold text-black"
              >
                進入監察
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}