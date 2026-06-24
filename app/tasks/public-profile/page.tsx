"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function PublicProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [proofs, setProofs] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [topProof, setTopProof] = useState<any>(null);
  const [topProofLikes, setTopProofLikes] = useState(0);

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

    loadProfile(user.id);
  }

  async function loadProfile(userId: string) {
    const { data: proofsData, error: proofsError } = await supabase
      .from("task_proofs")
      .select(`
        *,
        missions (
          title,
          points_reward,
          is_public
        )
      `)
      .eq("user_id", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (proofsError) {
      alert(proofsError.message);
      console.log(proofsError);
      return;
    }

    const publicProofs =
      proofsData?.filter((proof) => proof.missions?.is_public === true) || [];

    setProofs(publicProofs);

    const { data: achievementsData, error: achievementsError } =
      await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (achievementsError) {
      alert(achievementsError.message);
      console.log(achievementsError);
      return;
    }

    setAchievements(achievementsData || []);

    const proofIds = publicProofs.map((proof) => proof.id);

    if (proofIds.length === 0) {
      setTotalLikes(0);
      setTopProof(null);
      setTopProofLikes(0);
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

    const likeMap: Record<string, number> = {};

    proofIds.forEach((id) => {
      likeMap[id] = 0;
    });

    likesData?.forEach((like) => {
      likeMap[like.proof_id] = (likeMap[like.proof_id] || 0) + 1;
    });

    const total = Object.values(likeMap).reduce((sum, count) => sum + count, 0);

    setTotalLikes(total);

    let bestProof = null;
    let bestLikes = 0;

    publicProofs.forEach((proof) => {
      const count = likeMap[proof.id] || 0;

      if (count >= bestLikes) {
        bestProof = proof;
        bestLikes = count;
      }
    });

    setTopProof(bestProof);
    setTopProofLikes(bestLikes);
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/tasks")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回任務區
      </button>

      <h1 className="text-4xl font-bold mb-3">公開任務個人履歷</h1>

      <p className="text-zinc-400 mb-8">
        查看你在公開任務中的成果、人氣與勳章紀錄。
      </p>

      {currentUser && (
        <div className="border border-zinc-700 rounded-xl p-5 mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold">{currentUser.nickname}</h2>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="border border-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400">公開成果數</p>
              <p className="text-3xl font-bold text-yellow-400">
                {proofs.length}
              </p>
            </div>

            <div className="border border-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400">累積獲讚數</p>
              <p className="text-3xl font-bold text-yellow-400">
                {totalLikes}
              </p>
            </div>

            <div className="border border-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400">已獲得勳章</p>
              <p className="text-3xl font-bold text-yellow-400">
                {achievements.length}
              </p>
            </div>

            <div className="border border-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400">最高人氣</p>
              <p className="text-3xl font-bold text-yellow-400">
                👍 {topProofLikes}
              </p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">最高人氣成果</h2>

      {!topProof ? (
        <p className="text-zinc-500">目前尚無公開成果</p>
      ) : (
        <div className="border border-yellow-700 rounded-xl p-5 max-w-xl">
          {topProof.file_type === "video" ? (
            <video
              src={topProof.file_url}
              controls
              className="w-full rounded-lg mb-4"
            />
          ) : (
            <img
              src={topProof.file_url}
              className="w-full rounded-lg mb-4"
            />
          )}

          <h3 className="text-xl font-bold">
            {topProof.missions?.title || "公開任務"}
          </h3>

          <p className="text-yellow-400 mt-2">
            👍 {topProofLikes}
          </p>

          <p className="text-sm text-zinc-500 mt-2">
            {new Date(topProof.created_at).toLocaleString("zh-TW", {
              timeZone: "Asia/Taipei",
            })}
          </p>
        </div>
      )}
    </main>
  );
}