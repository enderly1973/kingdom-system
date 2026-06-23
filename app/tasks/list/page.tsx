"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Mission = {
  id: string;
  title: string;
  description: string;
  points_reward: number;
  status: string;
  accepted_by: string | null;
  min_rank_level: number;
  max_rank_level: number;
};

type User = {
  id: string;
  nickname: string;
  rank_level: number;
};

export default function TaskListPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");

    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      loadMissions(user);
    }
  }, []);

  async function loadMissions(user: User) {
    const { data } = await supabase
      .from("missions")
      .select("*")
      .eq("status", "open")
      .lte("min_rank_level", user.rank_level)
      .gte("max_rank_level", user.rank_level)
      .order("created_at", { ascending: false });

    setMissions(data || []);
  }

  async function acceptMission(missionId: string) {
    if (!currentUser) {
      alert("請先登入");
      return;
    }

    const { error } = await supabase
      .from("missions")
      .update({
        accepted_by: currentUser.id,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", missionId);

    if (error) {
      alert("接取任務失敗");
      console.log(error);
      return;
    }

    alert("接取任務成功");
    loadMissions(currentUser);
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/tasks")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回任務區
      </button>

      <h1 className="text-4xl font-bold mb-8">任務中心</h1>

      <div className="space-y-4">
        {missions.length === 0 && (
          <p className="text-zinc-500">目前沒有可接取的任務</p>
        )}

        {missions.map((mission) => (
          <div
            key={mission.id}
            className="border border-zinc-700 rounded-xl p-4"
          >
            <div className="text-xl font-bold">{mission.title}</div>

            <div className="text-zinc-400 mt-2">
              {mission.description}
            </div>

            <div className="mt-3">
              獎勵：{mission.points_reward} 分
            </div>

            <div className="text-sm text-zinc-500 mt-1">
              狀態：{mission.status}
            </div>

            {currentUser &&
              currentUser.rank_level >= mission.min_rank_level &&
              currentUser.rank_level <= mission.max_rank_level && (
                <button
                  onClick={() => acceptMission(mission.id)}
                  className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
                >
                  接取任務
                </button>
              )}
          </div>
        ))}
      </div>
    </main>
  );
}