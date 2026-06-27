"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminShowcasePage() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [search, setSearch] = useState("");

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

    if (user.rank_level < 6) {
      alert("只有王族可以進入");
      window.location.href = "/";
      return;
    }

    loadProofs();
  }

  async function loadProofs() {
    const { data, error } = await supabase
      .from("task_proofs")
      .select(`
        *,
        users:user_id(nickname),
        missions(title)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setProofs(data || []);
  }

  async function deleteProof(id: string) {
    if (!confirm("確定刪除此成果？")) return;

    await supabase
      .from("showcase_likes")
      .delete()
      .eq("proof_id", id);

    const { error } = await supabase
      .from("task_proofs")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadProofs();
  }

  const list = proofs.filter((p) => {
    if (!search) return true;

    const key = search.toLowerCase();

    return (
      p.users?.nickname?.toLowerCase().includes(key) ||
      p.missions?.title?.toLowerCase().includes(key)
    );
  });

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/admin")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回管理後台
      </button>

      <h1 className="text-4xl font-bold mb-6">
        公開成果管理
      </h1>

      <input
        className="w-full max-w-lg rounded-lg bg-zinc-900 border border-zinc-700 p-3 mb-8"
        placeholder="搜尋任務或使用者"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-5">
        {list.map((proof) => (
          <div
            key={proof.id}
            className="border border-zinc-800 rounded-xl p-5"
          >
            {proof.file_type === "video" ? (
              <video
                controls
                src={proof.file_url}
                className="w-64 rounded-lg mb-4"
              />
            ) : (
              <img
                src={proof.file_url}
                className="w-64 rounded-lg mb-4"
              />
            )}

            <p>
              任務：
              <span className="text-yellow-400">
                {proof.missions?.title}
              </span>
            </p>

            <p>上傳者：{proof.users?.nickname}</p>

            <p>狀態：{proof.status}</p>

            <p className="text-zinc-500">
              {new Date(proof.created_at).toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
              })}
            </p>

            <button
              onClick={() => deleteProof(proof.id)}
              className="mt-4 rounded bg-red-600 px-4 py-2"
            >
              刪除成果
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}