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

        {currentUser && currentUser.rank_level >= 1 && (
          <button
            onClick={() => (window.location.href = "/tasks/public")}
            className="border border-blue-700 rounded-xl p-6 text-left hover:border-blue-400"
          >
            <h2 className="text-xl font-bold mb-2">
              🌍 公開任務廣場
            </h2>
            <p className="text-zinc-400">
              所有人皆可完成的公開任務
            </p>
          </button>
        )}

        {currentUser && currentUser.rank_level >= 1 && (
          <button
            onClick={() => (window.location.href = "/tasks/showcase")}
            className="border border-purple-700 rounded-xl p-6 text-left hover:border-purple-400"
          >
            <h2 className="text-xl font-bold mb-2">
              🏛 公開成果展
            </h2>
            <p className="text-zinc-400">
              觀看公開任務成果照片與影片
            </p>
          </button>
        )}

        {currentUser && currentUser.rank_level >= 1 && (
          <button
            onClick={() => (window.location.href = "/tasks/showcase-ranking")}
            className="border border-yellow-700 rounded-xl p-6 text-left hover:border-yellow-400"
          >
            <h2 className="text-xl font-bold mb-2">
              🏆 公開成果排行榜
            </h2>
            <p className="text-zinc-400">
              查看最受歡迎的公開成果
            </p>
          </button>
        )}

        {currentUser && (
          <button
            onClick={() => (window.location.href = "/tasks/achievements")}
            className="border border-green-700 rounded-xl p-6 text-left hover:border-green-400"
          >
            <h2 className="text-xl font-bold mb-2">
              🏅 我的勳章
            </h2>
            <p className="text-zinc-400">
              查看已獲得的成就與勳章
            </p>
          </button>
        )}

        {currentUser && currentUser.rank_level >= 3 && (
          <button
            onClick={() => (window.location.href = "/tasks/public-review")}
            className="border border-orange-700 rounded-xl p-6 text-left hover:border-orange-400"
          >
            <h2 className="text-xl font-bold mb-2">
              🧾 公開任務審核
            </h2>
            <p className="text-zinc-400">
              審核公開任務成果
            </p>
          </button>
        )}
        {currentUser && currentUser.rank_level >= 1 && (
  <button
    onClick={() => (window.location.href = "/tasks/public-profile")}
    className="border border-green-700 rounded-xl p-6 text-left hover:border-green-400"
  >
    <h2 className="text-xl font-bold mb-2">
      👤 公開任務履歷
    </h2>

    <p className="text-zinc-400">
      查看自己的公開成果與人氣紀錄
    </p>
  </button>
)}

      </div>
    </main>
  );
}