"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Mission = {
  id: string;
  title: string;
  description: string;
  points_reward: number;
  status?: string;
  is_public?: boolean;
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
  const [files, setFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");

    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      loadMissions(user.id);
    }
  }, []);

  async function loadMissions(userId: string) {
    const normalResult = await supabase
      .from("missions")
      .select("*")
      .eq("accepted_by", userId)
      .eq("status", "accepted")
      .order("accepted_at", { ascending: false });

    const publicMissionSaved = localStorage.getItem("publicMission");
    let publicMission: Mission | null = null;

    if (publicMissionSaved) {
      publicMission = JSON.parse(publicMissionSaved);
    }

    const normalMissions = normalResult.data || [];

    if (publicMission) {
      setMissions([
        {
          ...publicMission,
          is_public: true,
        },
        ...normalMissions,
      ]);
    } else {
      setMissions(normalMissions);
    }
  }

  async function submitReport(mission: Mission) {
    if (!currentUser) {
      alert("請先登入");
      return;
    }

    const missionId = mission.id;
    const content = contents[missionId];
    const file = files[missionId];

    if (!content || content.trim() === "") {
      alert("請輸入回報內容");
      return;
    }

    if (!file) {
      alert("請上傳照片或影片作為任務證明");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("只能上傳照片或影片");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${currentUser.id}/${missionId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("task-proofs")
      .upload(filePath, file);

    if (uploadError) {
      alert("檔案上傳失敗");
      console.log(uploadError);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("task-proofs")
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    const { error: proofError } = await supabase.from("task_proofs").insert({
      task_type: "mission",
      task_id: missionId,
      user_id: currentUser.id,
      file_url: fileUrl,
      file_type: isImage ? "image" : "video",
      status: "pending",
    });

    if (proofError) {
      alert("任務證明儲存失敗");
      console.log(proofError);
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

    if (mission.is_public) {
      localStorage.removeItem("publicMission");
    } else {
      await supabase
        .from("missions")
        .update({
          status: "submitted",
          completed_at: new Date().toISOString(),
        })
        .eq("id", missionId);
    }

    alert("回報成功，已送出照片/影片證明");

    setContents({
      ...contents,
      [missionId]: "",
    });

    setFiles({
      ...files,
      [missionId]: null,
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
              {mission.is_public && (
                <p className="text-blue-400 mb-2 font-bold">
                  🌍 公開任務
                </p>
              )}

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

              <div className="mt-4">
                <p className="mb-2 text-zinc-300">
                  上傳任務證明（照片或影片）
                </p>

                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) =>
                    setFiles({
                      ...files,
                      [mission.id]: e.target.files?.[0] || null,
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3"
                />
              </div>

              <button
                onClick={() => submitReport(mission)}
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