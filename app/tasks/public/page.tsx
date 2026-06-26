"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
};

type Mission = {
  id: string;
  title: string;
  description: string;
  points_reward: number;
  min_rank_level: number;
  max_rank_level: number;
  is_public: boolean;
  created_at?: string;
  users?: {
    nickname: string;
  };
};

export default function PublicTasksPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);

  const isRoyal = currentUser && currentUser.rank_level >= 6;

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const user = JSON.parse(saved);
    setCurrentUser(user);

    if (user.rank_level === 0) {
      alert("新手無法查看公開任務廣場");
      window.location.href = "/tasks";
      return;
    }

    loadPublicMissions();
  }, []);

  async function loadPublicMissions() {
    const { data, error } = await supabase
      .from("missions")
      .select(`
        *,
        users:creator_id (
          nickname
        )
      `)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      console.log(error);
      return;
    }

    setMissions(data || []);
  }

  async function acceptPublicMission(mission: Mission) {
    if (!currentUser) return;

    localStorage.setItem(
      "publicMission",
      JSON.stringify({
        id: mission.id,
        title: mission.title,
        description: mission.description,
        points_reward: mission.points_reward,
      })
    );

    window.location.href = "/tasks/report";
  }

  async function deletePublicMission(mission: Mission) {
    if (!currentUser) return;

    if (!isRoyal) {
      alert("只有王族可以刪除公開任務");
      return;
    }

    if (
      !confirm(
        `確定要刪除公開任務「${mission.title}」嗎？\n\n這會一起刪除：\n1. 任務本體\n2. 所有公開成果\n3. 所有成果按讚`
      )
    ) {
      return;
    }

    const { data: proofs, error: proofFindError } = await supabase
      .from("task_proofs")
      .select("id")
      .eq("task_id", mission.id);

    if (proofFindError) {
      alert("查詢成果失敗：" + proofFindError.message);
      return;
    }

    const proofIds = proofs?.map((proof) => proof.id) || [];

    if (proofIds.length > 0) {
      const { error: likeDeleteError } = await supabase
        .from("showcase_likes")
        .delete()
        .in("proof_id", proofIds);

      if (likeDeleteError) {
        alert("刪除成果按讚失敗：" + likeDeleteError.message);
        return;
      }

      const { error: proofDeleteError } = await supabase
        .from("task_proofs")
        .delete()
        .eq("task_id", mission.id);

      if (proofDeleteError) {
        alert("刪除公開成果失敗：" + proofDeleteError.message);
        return;
      }
    }

    const { error: missionDeleteError } = await supabase
      .from("missions")
      .delete()
      .eq("id", mission.id);

    if (missionDeleteError) {
      alert("刪除公開任務失敗：" + missionDeleteError.message);
      return;
    }

    setMissions((prev) => prev.filter((item) => item.id !== mission.id));
    alert("已刪除公開任務與相關成果");
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/tasks")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回任務區
      </button>

      <h1 className="text-4xl font-bold mb-3">公開任務廣場</h1>

      <p className="text-zinc-400 mb-8">
        公開任務不會被單人接走，所有符合資格者都可以完成。
      </p>

      {missions.length === 0 ? (
        <p className="text-zinc-500">目前沒有公開任務</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="border border-zinc-700 rounded-xl p-5"
            >
              <h2 className="text-2xl font-bold">{mission.title}</h2>

              <p className="text-zinc-400 mt-3">
                {mission.description}
              </p>

              <p className="mt-4 text-yellow-400">
                獎勵：{mission.points_reward} 分
              </p>

              <p className="text-sm text-zinc-400 mt-2">
                發布者：{mission.users?.nickname || "未知"}
              </p>

              <p className="text-sm text-zinc-500 mt-1">
                可接階級：LV{mission.min_rank_level} ～ LV
                {mission.max_rank_level}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {currentUser &&
                currentUser.rank_level >= mission.min_rank_level &&
                currentUser.rank_level <= mission.max_rank_level ? (
                  <button
                    onClick={() => acceptPublicMission(mission)}
                    className="bg-green-600 px-4 py-2 rounded-lg"
                  >
                    前往完成任務
                  </button>
                ) : (
                  <p className="text-red-400">
                    你的階級不可接取此任務
                  </p>
                )}

                {isRoyal && (
                  <button
                    onClick={() => deletePublicMission(mission)}
                    className="bg-red-600 px-4 py-2 rounded-lg"
                  >
                    👑 王族刪除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}