"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  nickname: string;
};

type PointLog = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
};

export default function LogsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<PointLog[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (!savedUser) return;

    const user = JSON.parse(savedUser);
    setCurrentUser(user);

    async function loadLogs() {
      const { data, error } = await supabase
        .from("point_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
        return;
      }

      setLogs(data || []);
    }

    loadLogs();
  }, []);

  if (!currentUser) {
    return <main className="p-8">請先登入</main>;
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">積分紀錄</h1>

      <a href="/" className="text-blue-400 underline">
        返回首頁
      </a>

      <div className="mt-6 space-y-3">
        {logs.length === 0 && (
          <p className="text-zinc-400">目前沒有積分紀錄</p>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="border border-zinc-700 rounded p-4"
          >
            <p
              className={
                log.amount > 0
                  ? "text-green-400 font-bold"
                  : "text-red-400 font-bold"
              }
            >
              {log.amount > 0 ? "+" : ""}
              {log.amount} 點
            </p>

            <p>{log.reason}</p>

            <p className="text-sm text-zinc-400">
              {new Date(log.created_at).toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
              })}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}