"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminNotificationsPage() {
  const [proofs, setProofs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from("task_proofs")
      .select(`
        id,
        created_at,
        status,
        users:user_id(
          nickname
        ),
        missions:task_id(
          title
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setProofs(data || []);
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
        🔔 王族通知中心
      </h1>

      {proofs.length === 0 ? (
        <p className="text-zinc-500">
          目前沒有待處理通知
        </p>
      ) : (
        <div className="space-y-4">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="border border-yellow-700 rounded-xl p-5"
            >
              <p className="font-bold text-lg">
                🟡 有新的任務成果等待審核
              </p>

              <p className="text-zinc-300 mt-2">
                使用者：
                {proof.users?.nickname || "未知"}
              </p>

              <p className="text-zinc-300">
                任務：
                {proof.missions?.title || "未知任務"}
              </p>

              <p className="text-zinc-500 text-sm mt-2">
                {new Date(proof.created_at).toLocaleString("zh-TW", {
                  timeZone: "Asia/Taipei",
                })}
              </p>

              <button
                onClick={() =>
                  (window.location.href = "/tasks/review")
                }
                className="mt-4 rounded bg-yellow-600 px-4 py-2"
              >
                前往審核
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}