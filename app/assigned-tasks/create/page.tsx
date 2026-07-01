"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function CreateAssignedTaskPage() {
  const searchParams = useSearchParams();
  const subordinateId = searchParams.get("user");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [subordinate, setSubordinate] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointsReward, setPointsReward] = useState(0);
  const [dueAt, setDueAt] = useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const user = JSON.parse(saved);
    setCurrentUser(user);

    if (!subordinateId) {
      alert("找不到附屬");
      window.location.href = "/";
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, nickname, mentor_id")
      .eq("id", subordinateId)
      .single();

    if (error || !data) {
      alert("找不到附屬資料");
      window.location.href = "/";
      return;
    }

    if (data.mentor_id !== user.id) {
      alert("你只能派任務給自己的附屬");
      window.location.href = "/";
      return;
    }

    setSubordinate(data);
  }

  async function createTask() {
    if (!currentUser || !subordinate) return;

    if (!title.trim()) {
      alert("請輸入任務標題");
      return;
    }

    if (!description.trim()) {
      alert("請輸入任務內容");
      return;
    }
const { error } = await supabase.from("assigned_tasks").insert({
  master_id: currentUser.id,
  subordinate_id: subordinate.id,
  title: title.trim(),
  description: description.trim(),
  points_reward: pointsReward || 0,
  due_at: dueAt || null,
  status: "assigned",
});

if (error) {
  alert(error.message);
  return;
}

await supabase.from("notifications").insert({
  user_id: subordinate.id,
  title: "主人指派新任務",
  content: `${currentUser.nickname} 指派了任務：「${title.trim()}」`,
  type: "assigned_task",
  related_id: currentUser.id,
});
    alert("任務已派發");
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => window.history.back()}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回
      </button>

      <h1 className="text-3xl font-bold mb-2">派任務</h1>

      <p className="text-zinc-400 mb-6">
        指派對象：{subordinate ? subordinate.nickname : "讀取中..."}
      </p>

      <div className="max-w-xl space-y-4">
        <div>
          <label className="block mb-2">任務標題</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
            placeholder="例如：今日回報"
          />
        </div>

        <div>
          <label className="block mb-2">任務內容</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-40 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
            placeholder="輸入任務要求..."
          />
        </div>

        <div>
          <label className="block mb-2">獎勵積分</label>
          <input
            type="number"
            value={pointsReward}
            onChange={(e) => setPointsReward(Number(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
          />
        </div>
        <div>
  <label className="block mb-2">任務期限</label>
  <input
    type="datetime-local"
    value={dueAt}
    onChange={(e) => setDueAt(e.target.value)}
    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
  />
</div>

        <button
          onClick={createTask}
          className="w-full bg-green-600 hover:bg-green-700 rounded-lg px-4 py-3 font-bold"
        >
          送出任務
        </button>
      </div>
    </main>
  );
}