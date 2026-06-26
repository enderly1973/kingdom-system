"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
  mentor_id?: string | null;
  last_house_chat_read_at?: string | null;
};

export default function TasksPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    loadUnreadCount(currentUser);

    const chatMasterId = currentUser.mentor_id || currentUser.id;

    const channel = supabase
      .channel(`tasks-house-chat-${chatMasterId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "house_chats",
          filter: `master_id=eq.${chatMasterId}`,
        },
        () => {
          loadUnreadCount(currentUser);
        }
      )
      .subscribe();

    const timer = setInterval(() => {
      loadUnreadCount(currentUser);
    }, 3000);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  async function checkUser() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) return;

    const savedUser = JSON.parse(saved);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", savedUser.id)
      .single();

    if (error) {
      console.log(error);
      setCurrentUser(savedUser);
      return;
    }

    setCurrentUser(data);
    localStorage.setItem("currentUser", JSON.stringify(data));
  }

  async function loadUnreadCount(user: User) {
    const chatMasterId = user.mentor_id || user.id;
    const lastReadAt = user.last_house_chat_read_at;

    let query = supabase
      .from("house_chats")
      .select("id", { count: "exact", head: true })
      .eq("master_id", chatMasterId)
      .neq("sender_id", user.id);

    if (lastReadAt) {
      query = query.gt("created_at", lastReadAt);
    }

    const { count, error } = await query;

    if (error) {
      console.log(error);
      return;
    }

    setUnreadCount(count || 0);
  }

  const canCreateTask = currentUser && currentUser.rank_level >= 3;

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-400"
      >
        ← 返回首頁
      </button>

      <h1 className="text-4xl font-bold mb-8">任務區</h1>

      <div className="grid gap-4 max-w-2xl">
        {currentUser && (
          <button
            onClick={() => (window.location.href = "/house-chat")}
            className="border border-cyan-700 rounded-xl p-6 text-left hover:border-cyan-400"
          >
            <h2 className="text-xl font-bold mb-2">
              💬 家族聊天室
              {unreadCount > 0 && `（${unreadCount}）`}
            </h2>
            <p className="text-zinc-400">與家族成員聊天</p>
          </button>
        )}

        {canCreateTask && (
          <button
            onClick={() => (window.location.href = "/tasks/create")}
            className="border border-zinc-700 rounded-xl p-6 text-left hover:border-zinc-400"
          >
            <h2 className="text-xl font-bold mb-2">發布任務</h2>
            <p className="text-zinc-400">建立新的任務</p>
          </button>
        )}

        <button
          onClick={() => (window.location.href = "/tasks/list")}
          className="border border-zinc-700 rounded-xl p-6 text-left hover:border-zinc-400"
        >
          <h2 className="text-xl font-bold mb-2">任務中心</h2>
          <p className="text-zinc-400">查看、接取與追蹤任務</p>
        </button>

        <button
          onClick={() => (window.location.href = "/tasks/report")}
          className="border border-zinc-700 rounded-xl p-6 text-left hover:border-zinc-400"
        >
          <h2 className="text-xl font-bold mb-2">回報任務</h2>
          <p className="text-zinc-400">提交任務成果</p>
        </button>

        {currentUser && currentUser.rank_level >= 3 && (
          <button
            onClick={() => (window.location.href = "/tasks/review")}
            className="border border-zinc-700 rounded-xl p-6 text-left hover:border-zinc-400"
          >
            <h2 className="text-xl font-bold mb-2">審核任務</h2>
            <p className="text-zinc-400">審核已回報的任務</p>
          </button>
        )}

        {currentUser && currentUser.rank_level >= 1 && (
          <button
            onClick={() => (window.location.href = "/tasks/public")}
            className="border border-blue-700 rounded-xl p-6 text-left hover:border-blue-400"
          >
            <h2 className="text-xl font-bold mb-2">🌍 公開任務廣場</h2>
            <p className="text-zinc-400">所有人皆可完成的公開任務</p>
          </button>
        )}

        {currentUser && currentUser.rank_level >= 1 && (
          <button
            onClick={() => (window.location.href = "/tasks/showcase")}
            className="border border-purple-700 rounded-xl p-6 text-left hover:border-purple-400"
          >
            <h2 className="text-xl font-bold mb-2">🏛 公開成果展</h2>
            <p className="text-zinc-400">觀看公開任務成果照片與影片</p>
          </button>
        )}

        {currentUser && currentUser.rank_level >= 1 && (
          <button
            onClick={() => (window.location.href = "/tasks/showcase-ranking")}
            className="border border-yellow-700 rounded-xl p-6 text-left hover:border-yellow-400"
          >
            <h2 className="text-xl font-bold mb-2">🏆 公開成果排行榜</h2>
            <p className="text-zinc-400">查看最受歡迎的公開成果</p>
          </button>
        )}

        {currentUser && (
          <button
            onClick={() => (window.location.href = "/tasks/achievements")}
            className="border border-green-700 rounded-xl p-6 text-left hover:border-green-400"
          >
            <h2 className="text-xl font-bold mb-2">🏅 我的勳章</h2>
            <p className="text-zinc-400">查看已獲得的成就與勳章</p>
          </button>
        )}

        {currentUser && currentUser.rank_level >= 3 && (
          <button
            onClick={() => (window.location.href = "/tasks/public-review")}
            className="border border-orange-700 rounded-xl p-6 text-left hover:border-orange-400"
          >
            <h2 className="text-xl font-bold mb-2">🧾 公開任務審核</h2>
            <p className="text-zinc-400">審核公開任務成果</p>
          </button>
        )}

        {currentUser && currentUser.rank_level >= 1 && (
          <button
            onClick={() => (window.location.href = "/tasks/public-profile")}
            className="border border-green-700 rounded-xl p-6 text-left hover:border-green-400"
          >
            <h2 className="text-xl font-bold mb-2">👤 公開任務履歷</h2>
            <p className="text-zinc-400">查看自己的公開成果與人氣紀錄</p>
          </button>
        )}
      </div>
    </main>
  );
}