"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const { data } = await supabase
      .from("missions")
      .select("*")
      .order("created_at", { ascending: false });

    setTasks(data || []);
  }

  async function deleteTask(id: string) {
    if (!confirm("確定刪除這個任務？")) return;

    const { error } = await supabase
      .from("missions")
      .delete()
      .eq("id", id);

    if (error) {
      alert("刪除失敗");
      return;
    }

    loadTasks();
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/admin")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回管理後台
      </button>

      <h1 className="text-4xl font-bold mb-8">
        任務管理
      </h1>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="border border-zinc-800 rounded-xl p-5"
          >
            <h2 className="text-xl font-bold">
              {task.title}
            </h2>

            <p className="text-zinc-400 mt-2">
              {task.description}
            </p>

            <div className="mt-4 text-sm text-zinc-500 space-y-1">
              <p>積分：{task.points_reward}</p>
              <p>狀態：{task.status}</p>
              <p>
                公開任務：
                {task.is_public ? "✅ 是" : "❌ 否"}
              </p>
            </div>

            <button
              onClick={() => deleteTask(task.id)}
              className="mt-5 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              刪除任務
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}