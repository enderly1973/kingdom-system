"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type AssignedTask = {
  id: string;
  master_id: string;
  subordinate_id: string;
  title: string;
  description: string;
  points_reward: number;
  status: string;
  due_at: string | null;
  proof_text: string | null;
  proof_file_url: string | null;
  proof_file_name: string | null;
  proof_file_type: string | null;
  created_at: string;
};

export default function AssignedTasksPage() {
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [proofTexts, setProofTexts] = useState<Record<string, string>>({});
  const [proofFiles, setProofFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const user = JSON.parse(saved);
    setCurrentUser(user);

    const { data, error } = await supabase
      .from("assigned_tasks")
      .select("*")
      .eq("subordinate_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setTasks(data || []);
  }

  async function submitTask(task: AssignedTask) {
    const proofText = proofTexts[task.id] || "";
    const file = proofFiles[task.id] || null;

    if (!proofText.trim() && !file) {
      alert("請輸入回報文字或上傳照片／影片");
      return;
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;

    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${task.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("assigned-task-files")
        .upload(filePath, file);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("assigned-task-files")
        .getPublicUrl(filePath);

      fileUrl = data.publicUrl;
      fileName = file.name;
      fileType = file.type;
    }

    const { error } = await supabase
      .from("assigned_tasks")
      .update({
        status: "submitted",
        proof_text: proofText.trim() || null,
        proof_file_url: fileUrl,
        proof_file_name: fileName,
        proof_file_type: fileType,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      alert(error.message);
      return;
    }
    await supabase.from("notifications").insert({
  user_id: task.master_id,
  title: "附屬已回報任務",
  content: `${currentUser?.nickname || "附屬"} 已回報任務：「${task.title}」`,
  type: "assigned_task_review",
  related_id: task.id,
});

    alert("任務已回報，等待主人審核");
    loadTasks();
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => (window.location.href = "/")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回
      </button>

      <h1 className="text-3xl font-bold mb-6">📋 主人任務</h1>

      {tasks.length === 0 ? (
        <p className="text-zinc-500">目前沒有主人指派任務。</p>
      ) : (
        <section className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border border-zinc-800 rounded-xl p-5 bg-zinc-950"
            >
              <h2 className="text-xl font-bold mb-2">{task.title}</h2>

              <p className="text-zinc-300 whitespace-pre-wrap mb-3">
                {task.description}
              </p>

              <p className="text-sm text-yellow-400">
                獎勵積分：{task.points_reward}
              </p>

              {task.due_at && (
  <p className="text-sm text-orange-400 mt-1">
    任務期限：
    {new Date(task.due_at).toLocaleString("zh-TW")}
  </p>
)}

              <p className="text-sm text-zinc-500 mt-1 mb-4">
                狀態：{task.status}
              </p>

              {task.status === "assigned" && (
                <div className="space-y-3">
                  <textarea
                    value={proofTexts[task.id] || ""}
                    onChange={(e) =>
                      setProofTexts({
                        ...proofTexts,
                        [task.id]: e.target.value,
                      })
                    }
                    placeholder="輸入任務回報文字..."
                    className="w-full h-28 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
                  />

                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) =>
                      setProofFiles({
                        ...proofFiles,
                        [task.id]: e.target.files?.[0] || null,
                      })
                    }
                    className="block text-sm text-zinc-300"
                  />

                  <button
                    onClick={() => submitTask(task)}
                    className="bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 font-bold"
                  >
                    送出回報
                  </button>
                </div>
              )}

              {task.status !== "assigned" && (
                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <p className="font-bold mb-2">已回報內容</p>

                  {task.proof_text && (
                    <p className="text-zinc-300 whitespace-pre-wrap mb-3">
                      {task.proof_text}
                    </p>
                  )}

                  {task.proof_file_url && task.proof_file_type?.startsWith("image/") && (
                    <img
                      src={task.proof_file_url}
                      alt={task.proof_file_name || "任務圖片"}
                      className="max-w-xs rounded-lg border border-zinc-700"
                    />
                  )}

                  {task.proof_file_url && task.proof_file_type?.startsWith("video/") && (
                    <video
                      src={task.proof_file_url}
                      controls
                      className="max-w-xs rounded-lg border border-zinc-700"
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}