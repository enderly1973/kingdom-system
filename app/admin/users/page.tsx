"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

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
    setCurrentUser(user);

    if (user.rank_level < 6) {
      alert("只有王族可以進入使用者管理");
      window.location.href = "/";
      return;
    }

    loadUsers();
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("id, nickname, rank_level, points, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      alert("讀取使用者失敗：" + error.message);
      return;
    }

    setUsers(data || []);
  }

  async function updateUser(
    userId: string,
    changes: { points?: number; rank_level?: number }
  ) {
    const { error } = await supabase
      .from("users")
      .update(changes)
      .eq("id", userId);

    if (error) {
      alert("更新失敗：" + error.message);
      return;
    }

    loadUsers();
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/admin")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回管理後台
      </button>

      <h1 className="text-4xl font-bold mb-3">使用者管理</h1>

      <p className="text-zinc-400 mb-8">
        王族可查看使用者資料，並調整積分與階級。
      </p>

      <div className="space-y-4">
        {users.map((user) => {
          const points = user.points || 0;
          const rank = user.rank_level || 0;

          return (
            <div
              key={user.id}
              className="border border-zinc-800 rounded-xl p-5 bg-zinc-950"
            >
              <p className="text-xl font-bold mb-1">{user.nickname}</p>

              <p className="text-xs text-zinc-500 mb-2 break-all">
                ID：{user.id}
              </p>

              <p className="text-zinc-400 mb-1">
                階級：{rank}｜積分：{points}
              </p>

              <p className="text-xs text-zinc-500 mb-4">
                建立時間：
                {user.created_at
                  ? new Date(user.created_at).toLocaleString("zh-TW", {
                      timeZone: "Asia/Taipei",
                    })
                  : "無"}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    updateUser(user.id, {
                      points: points + 100,
                    })
                  }
                  className="rounded bg-green-600 px-3 py-2 text-sm"
                >
                  +100 分
                </button>

                <button
                  onClick={() =>
                    updateUser(user.id, {
                      points: Math.max(0, points - 100),
                    })
                  }
                  className="rounded bg-red-600 px-3 py-2 text-sm"
                >
                  -100 分
                </button>

                <button
                  onClick={() =>
                    updateUser(user.id, {
                      rank_level: rank + 1,
                    })
                  }
                  className="rounded bg-yellow-600 px-3 py-2 text-sm"
                >
                  升一級
                </button>

                <button
                  onClick={() =>
                    updateUser(user.id, {
                      rank_level: Math.max(0, rank - 1),
                    })
                  }
                  className="rounded bg-zinc-700 px-3 py-2 text-sm"
                >
                  降一級
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}