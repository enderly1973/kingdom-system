"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Proof = {
  id: string;
  user_id: string;
  task_id: string;
  file_url: string;
  file_type: string;
  status: string;
  created_at: string;
  missions?: {
    title: string;
    description: string;
    points_reward: number;
    is_public: boolean;
  };
  users?: {
    nickname: string;
  };
};

type Badge = {
  code: string;
  name: string;
};

export default function PublicReviewPage() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

    if (user.rank_level < 3) {
      alert("平民以上才能審核公開任務");
      window.location.href = "/tasks";
      return;
    }

    loadProofs();
  }

  async function loadProofs() {
    const { data, error } = await supabase
      .from("task_proofs")
      .select(`
        *,
        missions (
          title,
          description,
          points_reward,
          is_public
        ),
        users:user_id (
          nickname
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      console.log(error);
      return;
    }

    const publicProofs =
      data?.filter((proof) => proof.missions?.is_public === true) || [];

    setProofs(publicProofs);
  }

  async function giveBadge(userId: string, badge: Badge) {
    const { data: existing } = await supabase
      .from("achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_code", badge.code)
      .maybeSingle();

    if (existing) return;

    const { error } = await supabase.from("achievements").insert({
      user_id: userId,
      badge_code: badge.code,
      badge_name: badge.name,
    });

    if (error) {
      console.log(`發放勳章失敗：${badge.name}`, error);
    }
  }

  async function checkAndGiveBadges(userId: string) {
    const { data: proofsData, error: proofsError } = await supabase
      .from("task_proofs")
      .select(`
        id,
        missions (
          is_public
        )
      `)
      .eq("user_id", userId)
      .eq("status", "approved");

    if (proofsError) {
      console.log("讀取公開成果數失敗", proofsError);
      return;
    }

    const publicProofs =
      proofsData?.filter((proof: any) => proof.missions?.is_public === true) ||
      [];

    const publicCount = publicProofs.length;

    if (publicCount >= 1) {
      await giveBadge(userId, {
        code: "first_showcase",
        name: "公開新秀",
      });
    }

    if (publicCount >= 10) {
      await giveBadge(userId, {
        code: "showcase_10",
        name: "公開達人",
      });
    }

    if (publicCount >= 50) {
      await giveBadge(userId, {
        code: "showcase_50",
        name: "公開宗師",
      });
    }

    if (publicCount >= 100) {
      await giveBadge(userId, {
        code: "showcase_100",
        name: "公開傳奇",
      });
    }

    const proofIds = publicProofs.map((proof: any) => proof.id);

    if (proofIds.length === 0) return;

    const { data: likesData, error: likesError } = await supabase
      .from("showcase_likes")
      .select("*")
      .in("proof_id", proofIds);

    if (likesError) {
      console.log("讀取公開讚數失敗", likesError);
      return;
    }

    const totalLikes = likesData?.length || 0;

    if (totalLikes >= 10) {
      await giveBadge(userId, {
        code: "likes_10",
        name: "人氣新星",
      });
    }

    if (totalLikes >= 50) {
      await giveBadge(userId, {
        code: "likes_50",
        name: "人氣明星",
      });
    }

    if (totalLikes >= 100) {
      await giveBadge(userId, {
        code: "likes_100",
        name: "人氣傳奇",
      });
    }
  }

async function approveProof(proof: Proof) {


const { error: proofError } = await supabase
  .from("task_proofs")
  .update({ status: "approved" })
  .eq("id", proof.id);

if (proofError) {
  alert("審核失敗");
  console.log(proofError);
  return;
}
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("points")
    .eq("id", proof.user_id)
    .single();

  if (userError) {
    alert("讀取使用者積分失敗");
    console.log(userError);
    return;
  }

  const currentPoints = userData?.points || 0;
  const reward = proof.missions?.points_reward || 0;

  const { error: pointError } = await supabase
    .from("users")
    .update({
      points: currentPoints + reward,
    })
    .eq("id", proof.user_id);

  if (pointError) {
    alert("加分失敗");
    console.log(pointError);
    return;
  }

  await supabase
    .from("task_submissions")
    .update({ status: "approved" })
    .eq("mission_id", proof.task_id)
    .eq("user_id", proof.user_id);

  await checkAndGiveBadges(proof.user_id);

  alert("已通過，完成加分，並檢查勳章升級");
  loadProofs();
}
  async function rejectProof(proof: Proof) {
    const { error } = await supabase
      .from("task_proofs")
      .update({ status: "rejected" })
      .eq("id", proof.id);

    if (error) {
      alert("退回失敗");
      console.log(error);
      return;
    }

    await supabase
      .from("task_submissions")
      .update({ status: "rejected" })
      .eq("mission_id", proof.task_id)
      .eq("user_id", proof.user_id);

    alert("已退回");
    loadProofs();
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/tasks")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回任務區
      </button>

      <h1 className="text-4xl font-bold mb-8">公開任務審核</h1>

      {proofs.length === 0 ? (
        <p className="text-zinc-500">目前沒有待審核的公開任務</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="border border-zinc-700 rounded-xl p-4"
            >
              <h2 className="text-2xl font-bold">
                {proof.missions?.title || "公開任務"}
              </h2>

              <p className="text-zinc-400 mt-2">
                {proof.missions?.description}
              </p>

              <p className="text-yellow-400 mt-3">
                獎勵：{proof.missions?.points_reward || 0} 分
              </p>

              <p className="text-sm text-zinc-400 mt-2">
                上傳者：{proof.users?.nickname || "未知"}
              </p>

              <p className="text-sm text-zinc-500 mb-4">
                {new Date(proof.created_at).toLocaleString("zh-TW", {
                  timeZone: "Asia/Taipei",
                })}
              </p>

              {proof.file_type === "video" ? (
                <video
                  src={proof.file_url}
                  controls
                  className="w-full rounded-lg mb-4"
                />
              ) : (
                <img
                  src={proof.file_url}
                  className="w-full rounded-lg mb-4"
                />
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => approveProof(proof)}
                  className="bg-green-600 px-4 py-2 rounded-lg"
                >
                  通過
                </button>

                <button
                  onClick={() => rejectProof(proof)}
                  className="bg-red-600 px-4 py-2 rounded-lg"
                >
                  退回
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}