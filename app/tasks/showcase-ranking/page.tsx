"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type RankingMode = "week" | "month" | "all";

type RankingItem = {
  proof: any;
  likeCount: number;
};

export default function ShowcaseRankingPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mode, setMode] = useState<RankingMode>("week");

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadRanking(mode);
    }
  }, [mode]);

  async function checkUser() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const user = JSON.parse(saved);
    setCurrentUser(user);

    if (user.rank_level === 0) {
      alert("新手無法查看公開成果排行榜");
      window.location.href = "/tasks";
      return;
    }

    loadRanking("week");
  }

  function getStartDate(targetMode: RankingMode) {
    const now = new Date();

    if (targetMode === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return start.toISOString();
    }

    if (targetMode === "month") {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      return start.toISOString();
    }

    return null;
  }

  async function loadRanking(targetMode: RankingMode) {
    const startDate = getStartDate(targetMode);

    let proofsQuery = supabase
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

    if (startDate) {
      proofsQuery = proofsQuery.gte("created_at", startDate);
    }

    const { data: proofsData, error: proofsError } = await proofsQuery;

    if (proofsError) {
      alert(proofsError.message);
      console.log(proofsError);
      return;
    }

    const publicProofs =
      proofsData?.filter((proof) => proof.missions?.is_public === true) || [];

    const proofIds = publicProofs.map((proof) => proof.id);

    if (proofIds.length === 0) {
      setRanking([]);
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

    const sorted = publicProofs
      .map((proof) => ({
        proof,
        likeCount: likeMap[proof.id] || 0,
      }))
      .sort((a, b) => {
        if (b.likeCount !== a.likeCount) {
          return b.likeCount - a.likeCount;
        }

        return (
          new Date(b.proof.created_at).getTime() -
          new Date(a.proof.created_at).getTime()
        );
      });

    setRanking(sorted);
  }

  async function giveBadge(userId: string, badgeCode: string, badgeName: string) {
    const { data: existing } = await supabase
      .from("achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_code", badgeCode)
      .maybeSingle();

    if (existing) {
      alert("此使用者已經有這個勳章");
      return;
    }

    const { error } = await supabase.from("achievements").insert({
      user_id: userId,
      badge_code: badgeCode,
      badge_name: badgeName,
    });

    if (error) {
      alert("發放勳章失敗");
      console.log(error);
      return;
    }

    alert(`已發放勳章：${badgeName}`);
  }

  async function settleWeeklyChampion() {
    if (!currentUser) return;

    if (currentUser.rank_level < 3) {
      alert("平民以上才能結算週冠軍");
      return;
    }

    if (mode !== "week") {
      alert("請先切換到本週熱門");
      return;
    }

    if (ranking.length === 0) {
      alert("目前沒有本週排行資料");
      return;
    }

    const champion = ranking[0];

    if (!champion?.proof?.user_id) {
      alert("找不到冠軍上傳者");
      return;
    }

    if (champion.likeCount <= 0) {
      alert("本週第一名目前沒有讚，不發放週冠軍");
      return;
    }

    const ok = confirm(
      `確定將本週冠軍發給：${
        champion.proof.users?.nickname || champion.proof.user_id
      }？\n\n作品：${
        champion.proof.missions?.title || "公開任務"
      }\n讚數：${champion.likeCount}`
    );

    if (!ok) return;

    await giveBadge(
      champion.proof.user_id,
      "showcase_week_top1",
      "本週冠軍"
    );
  }

  function getTitle() {
    if (mode === "week") return "🏆 本週熱門成果";
    if (mode === "month") return "🏆 本月熱門成果";
    return "🏆 歷史熱門成果";
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/tasks")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回任務區
      </button>

      <h1 className="text-4xl font-bold mb-3">🏆 公開成果排行榜</h1>

      <p className="text-zinc-400 mb-6">
        可切換本週、本月與歷史熱門成果。
      </p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setMode("week")}
          className={
            mode === "week"
              ? "bg-yellow-600 px-4 py-2 rounded-lg"
              : "border border-zinc-700 px-4 py-2 rounded-lg"
          }
        >
          本週熱門
        </button>

        <button
          onClick={() => setMode("month")}
          className={
            mode === "month"
              ? "bg-yellow-600 px-4 py-2 rounded-lg"
              : "border border-zinc-700 px-4 py-2 rounded-lg"
          }
        >
          本月熱門
        </button>

        <button
          onClick={() => setMode("all")}
          className={
            mode === "all"
              ? "bg-yellow-600 px-4 py-2 rounded-lg"
              : "border border-zinc-700 px-4 py-2 rounded-lg"
          }
        >
          歷史熱門
        </button>
      </div>

      {currentUser && currentUser.rank_level >= 3 && mode === "week" && (
        <button
          onClick={settleWeeklyChampion}
          className="mb-8 bg-orange-600 px-4 py-2 rounded-lg"
        >
          🏆 結算本週冠軍
        </button>
      )}

      <h2 className="text-2xl font-bold mb-4">{getTitle()}</h2>

      {ranking.length === 0 ? (
        <p className="text-zinc-500">目前沒有公開成果排行資料</p>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {ranking.map((item, index) => (
            <div
              key={item.proof.id}
              className="border border-zinc-700 rounded-xl p-4 flex gap-4"
            >
              <div className="text-3xl font-bold w-12">
                {index === 0
                  ? "🥇"
                  : index === 1
                  ? "🥈"
                  : index === 2
                  ? "🥉"
                  : index + 1}
              </div>

              <div className="w-40">
                {item.proof.file_type === "video" ? (
                  <video
                    src={item.proof.file_url}
                    controls
                    className="w-full rounded-lg"
                  />
                ) : (
                  <img
                    src={item.proof.file_url}
                    className="w-full rounded-lg"
                  />
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {item.proof.missions?.title || "公開任務"}
                </h2>

                <p className="text-yellow-400 mt-2">
                  👍 {item.likeCount}
                </p>

                <p className="text-sm text-zinc-400 mt-2">
                  上傳者：{item.proof.users?.nickname || "未知"}
                </p>

                <p className="text-sm text-zinc-500">
                  獎勵：{item.proof.missions?.points_reward || 0} 分
                </p>

                <p className="text-sm text-zinc-500">
                  {new Date(item.proof.created_at).toLocaleString("zh-TW", {
                    timeZone: "Asia/Taipei",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}