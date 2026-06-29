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

      <div className="flex items-center justify-between mb-3">
  <h1 className="text-4xl font-bold">管理後台</h1>

  <button
    onClick={() => (window.location.href = "/notifications")}
    className="relative rounded-lg border border-zinc-700 px-4 py-2 hover:border-yellow-400"
  >
    🔔

    {stats.pendingProofs > 0 && (
      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold">
        {stats.pendingProofs}
      </span>
    )}
  </button>
</div>

      <p className="text-zinc-400 mb-8">
        王族專用管理總覽，可查看系統數據與最新動態。
      </p>

      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <StatCard
  title="使用者總數"
  value={stats.users}
  href="/admin/users"
/>

<StatCard
  title="任務總數"
  value={stats.missions}
  href="/admin/tasks"
/>

<StatCard
  title="待審核成果"
  value={stats.pendingProofs}
  href="/tasks/public-review"
/>

<StatCard
  title="公開成果總數"
  value={stats.approvedProofs}
  href="/admin/showcase"
/>
      </div>
      <section className="border border-yellow-700 rounded-xl p-5 mb-10 bg-zinc-950">
  <h2 className="text-2xl font-bold mb-4">🔔 待處理事項</h2>

  <div className="grid md:grid-cols-3 gap-4">
    <button
  onClick={() => (window.location.href = "/tasks/public-review")}
  className="rounded-lg border border-zinc-700 p-4 text-left hover:border-yellow-400 transition"
>
  <div className="flex items-start justify-between">
    <p className="text-xl font-bold">🟡 公開成果審核</p>

    {stats.pendingProofs > 0 ? (
      <span className="mt-1 flex h-3 w-3">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 animate-pulse"></span>
      </span>
    ) : (
      <span className="inline-block h-3 w-3 rounded-full bg-green-500"></span>
    )}
  </div>

  <p className="text-3xl font-bold text-yellow-400 mt-3">
    {stats.pendingProofs}
  </p>

  <p className="text-sm mt-2">
    {stats.pendingProofs > 0 ? (
      <span className="text-red-400">
        有 {stats.pendingProofs} 件待審核
      </span>
    ) : (
      <span className="text-green-400">
        目前沒有待審核
      </span>
    )}
  </p>
</button>

    <button
      onClick={() => (window.location.href = "/admin/tasks")}
      className="rounded-lg border border-zinc-700 p-4 text-left hover:border-yellow-400"
    >
      <p className="text-xl font-bold">📋 任務管理</p>
      <p className="text-3xl font-bold text-yellow-400 mt-2">
        {stats.missions}
      </p>
      <p className="text-zinc-400 text-sm mt-1">目前任務數</p>
    </button>

    <button
      onClick={() => (window.location.href = "/admin/showcase")}
      className="rounded-lg border border-zinc-700 p-4 text-left hover:border-yellow-400"
    >
      <p className="text-xl font-bold">🖼 公開成果</p>
      <p className="text-3xl font-bold text-yellow-400 mt-2">
        {stats.approvedProofs}
      </p>
      <p className="text-zinc-400 text-sm mt-1">已公開成果</p>
    </button>
  </div>
</section>
      <div className="grid md:grid-cols-4 gap-4 mb-10">
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
  <button
  onClick={() => (window.location.href = "/admin/tasks")}
  className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-left hover:border-yellow-400"
>
  <p className="text-2xl font-bold mb-2">📋 任務管理</p>
  <p className="text-zinc-400">查看與刪除任務。</p>
</button>
<button
  onClick={() => (window.location.href = "/admin/announcements")}
  className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-left hover:border-yellow-400"
>
  <p className="text-2xl font-bold mb-2">📢 公告管理</p>
  <p className="text-zinc-400">發布、刪除系統公告。</p>
</button>
</div>

<section className="border border-zinc-800 rounded-xl p-5 mb-10 bg-zinc-950">
  <h2 className="text-2xl font-bold mb-4">📈 最近動態</h2>

  {latestProofs.length === 0 ? (
    <p className="text-zinc-500">目前沒有最近動態</p>
  ) : (
    <div className="space-y-3">
      {latestProofs.map((proof) => (
        <div
          key={proof.id}
          className="border border-zinc-800 rounded-lg p-3"
        >
          <p className="font-bold">
            {proof.users?.nickname || "未知使用者"} 上傳了成果
          </p>

          <p className="text-sm text-zinc-400">
            任務：{proof.missions?.title || "未知任務"}｜狀態：{proof.status}
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

function StatCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <button
      onClick={() => (window.location.href = href)}
      className="w-full text-left border border-zinc-800 rounded-xl p-5 bg-zinc-950 hover:border-yellow-400 transition"
    >
      <p className="text-zinc-400 mb-2">{title}</p>

      <p className="text-3xl font-bold text-yellow-400">
        {value}
      </p>
    </button>
  );
}