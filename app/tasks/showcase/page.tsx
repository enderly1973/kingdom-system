"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function ShowcasePage() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Record<string, boolean>>({});
  const [searchText, setSearchText] = useState("");

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

    if (user.rank_level === 0) {
      alert("新手無法查看公開成果展");
      window.location.href = "/tasks";
      return;
    }

    loadProofs(user.id);
  }

  async function loadProofs(userId: string) {
    const { data, error } = await supabase
      .from("task_proofs")
      .select(`
        *,
        missions (
          title,
          points_reward,
          is_public
        ),
        users:user_id (
          nickname
        )
      `)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      console.log(error);
      return;
    }

    const publicProofs =
      data?.filter((proof) => proof.missions?.is_public === true) || [];

    setProofs(publicProofs);

    const proofIds = publicProofs.map((proof) => proof.id);

    if (proofIds.length === 0) {
      setLikeCounts({});
      setMyLikes({});
      return;
    }

    const { data: likesData, error: likesError } = await supabase
      .from("showcase_likes")
      .select("*")
      .in("proof_id", proofIds);

    if (likesError) {
      alert(likesError.message);
      console.log(likesError);
      return;
    }

    const counts: Record<string, number> = {};
    const mine: Record<string, boolean> = {};

    proofIds.forEach((id) => {
      counts[id] = 0;
      mine[id] = false;
    });

    likesData?.forEach((like) => {
      counts[like.proof_id] = (counts[like.proof_id] || 0) + 1;

      if (like.user_id === userId) {
        mine[like.proof_id] = true;
      }
    });

    setLikeCounts(counts);
    setMyLikes(mine);
  }

  async function toggleLike(proofId: string) {
    if (!currentUser) {
      alert("請先登入");
      return;
    }

    if (myLikes[proofId]) {
      const { error } = await supabase
        .from("showcase_likes")
        .delete()
        .eq("proof_id", proofId)
        .eq("user_id", currentUser.id);

      if (error) {
        alert("取消按讚失敗");
        console.log(error);
        return;
      }
    } else {
      const { error } = await supabase.from("showcase_likes").insert({
        proof_id: proofId,
        user_id: currentUser.id,
      });

      if (error) {
        alert("按讚失敗");
        console.log(error);
        return;
      }
    }

    loadProofs(currentUser.id);
  }

  const filteredProofs = proofs.filter((proof) => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return true;

    const title = proof.missions?.title?.toLowerCase() || "";
    const nickname = proof.users?.nickname?.toLowerCase() || "";

    return title.includes(keyword) || nickname.includes(keyword);
  });

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/tasks")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回任務區
      </button>

      <h1 className="text-4xl font-bold mb-3">公開成果展</h1>

      <p className="text-zinc-400 mb-6">
        搜尋公開任務成果，可用任務名稱或上傳者暱稱搜尋。
      </p>

      <input
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="搜尋任務名稱或上傳者"
        className="w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-lg p-3 mb-8"
      />

      {proofs.length === 0 ? (
        <p className="text-zinc-500">目前沒有公開任務成果</p>
      ) : filteredProofs.length === 0 ? (
        <p className="text-zinc-500">找不到符合搜尋條件的成果</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {filteredProofs.map((proof) => (
            <div
              key={proof.id}
              className="border border-zinc-700 rounded-xl p-4"
            >
              {proof.file_type === "video" ? (
                <video
                  src={proof.file_url}
                  controls
                  className="w-full rounded-lg"
                />
              ) : (
                <img
                  src={proof.file_url}
                  className="w-full rounded-lg"
                />
              )}

              <p className="mt-3 font-bold">
                {proof.missions?.title || "公開任務"}
              </p>

              <p className="text-yellow-400">
                獎勵：{proof.missions?.points_reward || 0} 分
              </p>

              <p className="text-sm text-zinc-400">
                上傳者：{proof.users?.nickname || "未知"}
              </p>

              <p className="text-sm text-zinc-500">
                {new Date(proof.created_at).toLocaleString("zh-TW", {
                  timeZone: "Asia/Taipei",
                })}
              </p>

              <button
                onClick={() => toggleLike(proof.id)}
                className={`mt-4 px-4 py-2 rounded-lg border ${
                  myLikes[proof.id]
                    ? "border-yellow-400 text-yellow-400"
                    : "border-zinc-700 text-zinc-300"
                }`}
              >
                👍 {likeCounts[proof.id] || 0}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}