"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({
    users: 0,
    missions: 0,
    pendingProofs: 0,
    approvedProofs: 0,
  });
  const [latestUsers, setLatestUsers] = useState<any[]>([]);
  const [latestProofs, setLatestProofs] = useState<any[]>([]);

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
      alert("只有王族可以進入管理後台");
      window.location.href = "/";
      return;
    }

    loadAdminData();
  }

  async function loadAdminData() {
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: missionCount } = await supabase
      .from("missions")
      .select("*", { count: "exact", head: true });

    const { count: pendingProofCount } = await supabase
      .from("task_proofs")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: approvedProofCount } = await supabase
      .from("task_proofs")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    setStats({
      users: userCount || 0,
      missions: missionCount || 0,
      pendingProofs: pendingProofCount || 0,
      approvedProofs: approvedProofCount || 0,
    });

    const { data: usersData } = await supabase
      .from("users")
      .select("id, nickname, rank_level, points, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    setLatestUsers(usersData || []);

    const { data: proofsData } = await supabase
      .from("task_proofs")
      .select(`
        id,
        status,
        created_at,
        users:user_id (
          nickname
        ),
        missions (
          title,
          points_reward
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    setLatestProofs(proofsData || []);
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回首頁
      </button>

      <h1 className="text-4xl font-bold mb-3">管理後台</h1>

      <p className="text-zinc-400 mb-8">
        王族專用管理總覽，可查看系統數據與最新動態。
      </p>

      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <StatCard title="使用者總數" value={stats.users} />
        <StatCard title="任務總數" value={stats.missions} />
        <StatCard title="待審核成果" value={stats.pendingProofs} />
        <StatCard title="公開成果總數" value={stats.approvedProofs} />
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
  <button
    onClick={() => (window.location.href = "/admin/users")}
    className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-left hover:border-yellow-400"
  >
    <p className="text-2xl font-bold mb-2">👥 使用者管理</p>
    <p className="text-zinc-400">查看使用者，調整積分與階級。</p>
  </button>

  <button
    onClick={() => (window.location.href = "/admin/showcase")}
    className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-left hover:border-yellow-400"
  >
    <p className="text-2xl font-bold mb-2">🖼 公開成果管理</p>
    <p className="text-zinc-400">查看、搜尋與刪除公開成果。</p>
  </button>
</div>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="border border-zinc-800 rounded-xl p-5">
          <h2 className="text-2xl font-bold mb-4">最新使用者</h2>

          {latestUsers.length === 0 ? (
            <p className="text-zinc-500">目前沒有使用者資料</p>
          ) : (
            <div className="space-y-3">
              {latestUsers.map((user) => (
                <div
                  key={user.id}
                  className="border border-zinc-800 rounded-lg p-3"
                >
                  <p className="font-bold">{user.nickname}</p>
                  <p className="text-sm text-zinc-400">
                    階級：{user.rank_level}｜積分：{user.points || 0}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleString("zh-TW", {
                          timeZone: "Asia/Taipei",
                        })
                      : "無建立時間"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-zinc-800 rounded-xl p-5">
          <h2 className="text-2xl font-bold mb-4">最新公開成果</h2>

          {latestProofs.length === 0 ? (
            <p className="text-zinc-500">目前沒有成果資料</p>
          ) : (
            <div className="space-y-3">
              {latestProofs.map((proof) => (
                <div
                  key={proof.id}
                  className="border border-zinc-800 rounded-lg p-3"
                >
                  <p className="font-bold">
                    {proof.missions?.title || "未知任務"}
                  </p>
                  <p className="text-sm text-zinc-400">
                    上傳者：{proof.users?.nickname || "未知"}｜狀態：
                    {proof.status}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(proof.created_at).toLocaleString("zh-TW", {
                      timeZone: "Asia/Taipei",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-950">
      <p className="text-zinc-400 mb-2">{title}</p>
      <p className="text-3xl font-bold text-yellow-400">{value}</p>
    </div>
  );
}