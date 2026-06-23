"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Submission = {
  id: number;
  image_url: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
};

export default function ShoeTask({
  currentUser,
  onUpdated,
}: {
  currentUser: any;
  onUpdated: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    async function loadSubmission() {
      const { data, error } = await supabase
        .from("task_submissions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        alert(error.message);
        return;
      }

      setSubmission(data);
    }

    loadSubmission();
  }, [currentUser.id]);

  async function submitTask() {
    if (!file) {
      alert("請先選擇照片");
      return;
    }

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("task-uploads")
      .upload(fileName, file);

    if (uploadError) {
      setUploading(false);
      alert(uploadError.message);
      return;
    }

    const { data } = supabase.storage
      .from("task-uploads")
      .getPublicUrl(fileName);

    const { data: insertedData, error } = await supabase
      .from("task_submissions")
      .insert({
  user_id: currentUser.id,
  image_url: data.publicUrl,
  status: "pending",
  created_at: new Date().toISOString(),
})
      .select("*")
      .single();

    setUploading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSubmission(insertedData);
    alert("新人任務3已提交，等待王族審核");
    onUpdated();
  }

  if (submission?.status === "pending") {
    return (
      <div className="border border-zinc-700 rounded-xl p-6 mt-6 max-w-xl">
        <h2 className="text-2xl font-bold mb-4">新人任務3：提交鞋子照片</h2>
        <p className="text-yellow-400">
  ⏳ 已提交，等待王族審核
</p>

<p className="text-zinc-500 text-sm mt-2">
  提交時間：
  {new Date(submission.created_at).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
  })}
</p>
        <img src={submission.image_url} className="mt-4 rounded max-w-full" />
      </div>
    );
  }

  if (submission?.status === "approved") {
    return (
      <div className="border border-zinc-700 rounded-xl p-6 mt-6 max-w-xl">
        <h2 className="text-2xl font-bold mb-4">新人任務3：提交鞋子照片</h2>
        <p className="text-green-400">
  ✅ 已完成新手任務3
</p>

<p className="text-zinc-500 text-sm mt-2">
  提交時間：
  {new Date(submission.created_at).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
  })}
</p>

{submission.reviewed_at && (
  <p className="text-zinc-500 text-sm">
    審核時間：
    {new Date(submission.reviewed_at).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    })}
  </p>
)}
      </div>
    );
  }
  if (submission?.status === "rejected") {
  return (
    <div className="border border-red-700 rounded-xl p-6 mt-6 max-w-xl">
      <h2 className="text-2xl font-bold mb-4">新人任務3：提交鞋子照片</h2>
      <p className="text-red-400 mb-4">
        ❌ 審核未通過，請重新提交照片。
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full p-3 mb-4 bg-zinc-900 rounded"
      />

      <button
        onClick={submitTask}
        disabled={uploading}
        className="bg-blue-600 w-full p-3 rounded disabled:bg-zinc-700"
      >
        {uploading ? "上傳中..." : "重新送出任務"}
      </button>
    </div>
  );
}
  return (
    <div className="border border-zinc-700 rounded-xl p-6 mt-6 max-w-xl">
      <h2 className="text-2xl font-bold mb-4">新人任務3：提交鞋子照片</h2>

      <p className="text-zinc-400 mb-4">
        請拍攝目前穿著的鞋子，選擇照片檔案後送出。
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full p-3 mb-4 bg-zinc-900 rounded"
      />

      <button
        onClick={submitTask}
        disabled={uploading}
        className="bg-blue-600 w-full p-3 rounded disabled:bg-zinc-700"
      >
        {uploading ? "上傳中..." : "送出任務"}
      </button>
    </div>
  );
}