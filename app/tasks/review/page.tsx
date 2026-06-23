"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
};

export default function ReviewPage() {
  const [items, setItems] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");

    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      loadData(user.id);
    }
  }, []);

  async function loadData(userId: string) {
    const { data: submissions } = await supabase
      .from("task_submissions")
      .select("*")
      .eq("status", "pending");

    if (!submissions || submissions.length === 0) {
      setItems([]);
      return;
    }

    const missionIds = submissions.map((s) => s.mission_id);

    const { data: missions } = await supabase
      .from("missions")
      .select("*")
      .in("id", missionIds)
      .eq("creator_id", userId);

    if (!missions || missions.length === 0) {
      setItems([]);
      return;
    }

    const result = submissions
      .map((submission) => {
        const mission = missions.find(
          (m) => m.id === submission.mission_id
        );

        if (!mission) return null;

        return {
          ...submission,
          mission,
        };
      })
      .filter(Boolean);

    setItems(result);
  }

  async function approve(item: any) {
    if (!currentUser) return;

    const mission = item.mission;

    if (mission.creator_id !== currentUser.id) {
      alert("只有發布任務的人可以審核");
      return;
    }

    await supabase
      .from("task_submissions")
      .update({
        status: "approved",
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    await supabase
      .from("missions")
      .update({
        status: "completed",
      })
      .eq("id", mission.id);

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", item.user_id)
      .single();

    if (user) {
      const reward = mission.points_reward || 0;
      const reputationReward = mission.reputation_reward || 0;

if (user.mentor_id) {
  const childReward = Math.floor(reward / 2);
  const masterReward = reward - childReward;

  await supabase
    .from("users")
    .update({
      points: (user.points || 0) + childReward,
      reputation:
        (user.reputation || 0) + reputationReward,
    })
    .eq("id", user.id);

  const { data: master } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.mentor_id)
    .single();

  if (master) {
    await supabase
      .from("users")
      .update({
        points: (master.points || 0) + masterReward,
      })
      .eq("id", master.id);
  }
} else {
  await supabase
    .from("users")
    .update({
      points: (user.points || 0) + reward,
      reputation:
        (user.reputation || 0) + reputationReward,
    })
    .eq("id", user.id);
}
    }

    alert("審核完成");
    loadData(currentUser.id);
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/tasks")}
        className="border border-zinc-700 rounded-xl px-4 py-2 mb-8"
      >
        ← 返回任務區
      </button>

      <h1 className="text-4xl font-bold mb-10">審核任務</h1>

      {items.length === 0 ? (
        <p className="text-zinc-500">目前沒有可審核的任務</p>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-zinc-700 rounded-xl p-6"
            >
              <h2 className="text-xl font-bold mb-2">
                {item.mission.title}
              </h2>

              <p className="text-zinc-400 mb-4">
                {item.mission.description}
              </p>

              <p>回報內容：</p>

              <div className="mt-2 text-zinc-300">
                {item.content}
              </div>

              <button
                onClick={() => approve(item)}
                className="mt-4 bg-green-600 px-4 py-2 rounded"
              >
                通過
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}