"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
};

export default function TasksPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");

    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

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
      </div>
    </main>
  );
}