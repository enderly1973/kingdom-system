"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type ReviewTask = {
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
  submitted_at: string | null;
  subordinate?: {
    nickname: string;
    points: number;
  };
};

export default function ReviewAssignedTasksPage() {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
      .eq("master_id", user.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    const subordinateIds = (data || []).map((task) => task.subordinate_id);

    const { data: users } = await supabase
      .from("users")
      .select("id, nickname, points")
      .in("id", subordinateIds);

    const merged = (data || []).map((task) => ({
      ...task,
      subordinate: users?.find((u) => u.id === task.subordinate_id),
    }));

    setTasks(merged);
  }

  async function approveTask(task: ReviewTask) {
    const ok = confirm(
      `確定通過「${task.title}」？\n\n將發放 ${task.points_reward} 點給附屬。`
    );

    if (!ok) return;

    const newPoints = (task.subordinate?.points || 0) + task.points_reward;

    const { error: userError } = await supabase
      .from("users")
      .update({ points: newPoints })
      .eq("id", task.subordinate_id);

    if (userError) {
      alert(userError.message);
      return;
    }

    const { error: taskError } = await supabase
      .from("assigned_tasks")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (taskError) {
      alert(taskError.message);
      return;
    }
    await supabase.from("notifications").insert({
  user_id: task.subordinate_id,
  title: "任務已通過",
  content: `你的任務「${task.title}」已通過，獲得 ${task.points_reward} 點。`,
  type: "assigned_task_approved",
  related_id: task.id,
});

    alert("任務已通過，積分已發放");
    loadTasks();
  }

  async function rejectTask(task: ReviewTask) {
    const ok = confirm(`確定退回「${task.title}」？`);

    if (!ok) return;

    const { error } = await supabase
      .from("assigned_tasks")
      .update({
        status: "assigned",
        proof_text: null,
        proof_file_url: null,
        proof_file_name: null,
        proof_file_type: null,
        submitted_at: null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      alert(error.message);
      return;
    }
    await supabase.from("notifications").insert({
  user_id: task.subordinate_id,
  title: "任務被退回",
  content: `你的任務「${task.title}」被退回，請重新回報。`,
  type: "assigned_task_rejected",
  related_id: task.id,
});

    alert("任務已退回，附屬可重新回報");
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

      <h1 className="text-3xl font-bold mb-6">📋 附屬任務審核</h1>

      {tasks.length === 0 ? (
        <p className="text-zinc-500">目前沒有待審核的附屬任務。</p>
      ) : (
        <section className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border border-zinc-800 rounded-xl p-5 bg-zinc-950"
            >
              <h2 className="text-xl font-bold mb-2">{task.title}</h2>

              <p className="text-sm text-zinc-400 mb-2">
                附屬：{task.subordinate?.nickname || "未知"}
              </p>

              <p className="text-zinc-300 whitespace-pre-wrap mb-3">
                {task.description}
              </p>

              <p className="text-sm text-yellow-400 mb-4">
                獎勵積分：{task.points_reward}
              </p>

              {task.due_at && (
  <p className="text-sm text-orange-400 mb-4">
    ⏰ 任務期限：
    {new Date(task.due_at).toLocaleString("zh-TW")}
  </p>
)}

              <div className="border-t border-zinc-800 pt-4 mt-4">
                <p className="font-bold mb-2">回報內容</p>

                {task.proof_text && (
                  <p className="text-zinc-300 whitespace-pre-wrap mb-3">
                    {task.proof_text}
                  </p>
                )}

                {task.proof_file_url &&
                  task.proof_file_type?.startsWith("image/") && (
                    <img
                      src={task.proof_file_url}
                      alt={task.proof_file_name || "任務圖片"}
                      className="max-w-xs rounded-lg border border-zinc-700"
                    />
                  )}

                {task.proof_file_url &&
                  task.proof_file_type?.startsWith("video/") && (
                    <video
                      src={task.proof_file_url}
                      controls
                      className="max-w-xs rounded-lg border border-zinc-700"
                    />
                  )}
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => approveTask(task)}
                  className="bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 font-bold"
                >
                  通過
                </button>

                <button
                  onClick={() => rejectTask(task)}
                  className="bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 font-bold"
                >
                  退回
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}