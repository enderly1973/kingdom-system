"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
  points?: number;
};

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

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
    loadUsers();
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("id, nickname, rank_level, points")
      .order("rank_level", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setUsers(data || []);
  }

  function getRankName(rank: number) {
    if (rank === 0) return "新成員";
    if (rank === 1) return "C級奴隸";
    if (rank === 2) return "B級奴隸";
    if (rank === 3) return "平民";
    if (rank === 4) return "騎士";
    if (rank === 5) return "貴族";
    if (rank === 6) return "王族";
    return `階級 ${rank}`;
  }

  function canPrivateChat(target: User) {
    if (!currentUser) return false;
    if (currentUser.id === target.id) return false;

    const myRank = currentUser.rank_level;
    const targetRank = target.rank_level;

    if (myRank === 0 || targetRank === 0) return false;
    if (myRank === 6 || targetRank === 6) return false;

    if (myRank === 1 || myRank === 2) {
      return targetRank >= 3 && targetRank <= 5;
    }

    if (myRank >= 3 && myRank <= 5) {
      return targetRank >= 1 && targetRank <= 5;
    }

    return false;
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => (window.location.href = "/")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-400"
      >
        ← 返回首頁
      </button>

      <h1 className="text-2xl font-bold mb-6">👥 成員名錄</h1>

      <section className="space-y-4">
        {users.length === 0 ? (
          <p className="text-zinc-500">目前沒有成員。</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="border border-zinc-800 rounded-xl p-5 bg-zinc-950"
            >
              <h2 className="text-xl font-bold mb-2">{user.nickname}</h2>

              <p className="text-sm text-zinc-400 mb-4">
                {getRankName(user.rank_level)} ｜ 積分 {user.points || 0}
              </p>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() =>
                    (window.location.href = `/public-profile/${user.id}`)
                  }
                  className="border border-zinc-600 rounded-lg px-4 py-2 hover:border-zinc-300"
                >
                  查看個人頁
                </button>

                {canPrivateChat(user) && (
                  <button
                    onClick={() =>
                      (window.location.href = `/private-chat/${user.id}`)
                    }
                    className="bg-white text-black rounded-lg px-4 py-2 font-bold"
                  >
                    💬 私訊
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}