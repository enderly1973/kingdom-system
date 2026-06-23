"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Mission = {
  id: string;
  title: string;
  description: string;
  points_reward: number;
  status: string;
};

type User = {
  id: string;
  nickname: string;
  rank_level: number;
};

export default function ReportTaskPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [contents, setContents] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");

    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      loadMissions(user.id);
    }
  }, []);

  async function loadMissions(userId: string) {
    const { data } = await supabase
      .from("missions")
      .select("*")
      .eq("accepted_by", userId)
      .eq("status", "accepted")
      .order("accepted_at", { ascending: false });

    if (data) {
      setMissions(data);
    }
  }

  async function submitReport(missionId: string) {
    if (!currentUser) {
      alert("請先登入");
      return;
    }

    const content = contents[missionId];

    if (!content || content.trim() === "") {
      alert("請輸入回報內容");
      return;
    }

    const { error } = await supabase.from("task_submissions").insert({
      user_id: currentUser.id,
      mission_id: missionId,
      content,
      status: "pending",
    });

    if (error) {
      alert("回報失敗");
      console.log(error);
      return;
    }

    await supabase
      .from("missions")
      .update({
        status: "submitted",
        completed_at: new Date().toISOString(),
      })
      .eq("id", missionId);

    alert("回報成功");

    setContents({
      ...contents,
      [missionId]: "",
    });

    loadMissions(currentUser.id);
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/tasks")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回任務區
      </button>

      <h1 className="text-4xl font-bold mb-8">回報任務</h1>

      {missions.length === 0 ? (
        <p className="text-zinc-500">目前沒有可回報的任務</p>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="border border-zinc-700 rounded-xl p-4"
            >
              <h2 className="text-xl font-bold">{mission.title}</h2>

              <p className="text-zinc-400 mt-2">{mission.description}</p>

              <p className="mt-3">獎勵：{mission.points_reward} 分</p>

              <textarea
                value={contents[mission.id] || ""}
                onChange={(e) =>
                  setContents({
                    ...contents,
                    [mission.id]: e.target.value,
                  })
                }
                placeholder="輸入回報內容"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 h-32 mt-4"
              />

              <button
                onClick={() => submitReport(mission.id)}
                className="mt-4 bg-green-600 px-4 py-2 rounded-lg"
              >
                送出回報
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}