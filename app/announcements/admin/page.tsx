"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AnnouncementAdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const user = JSON.parse(saved);
    setCurrentUser(user);

    if (user.rank_level !== 6) {
      alert("只有王族可以發布公告");
      window.location.href = "/announcements";
    }
  }, []);

  async function createAnnouncement() {
    if (!title || !content) {
      alert("請輸入標題與內容");
      return;
    }

    const { error } = await supabase
      .from("announcements")
      .insert({
        title,
        content,
        category: "系統",
        created_by: currentUser.id,
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("公告發布成功");
    setTitle("");
    setContent("");
    window.location.href = "/announcements";
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => window.location.href = "/announcements"}
        className="mb-6 border border-zinc-600 px-4 py-2 rounded"
      >
        ← 返回公告欄
      </button>

      <h1 className="text-4xl font-bold mb-8">王族公告發布</h1>

      <div className="max-w-xl border border-zinc-700 rounded-xl p-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="公告標題"
          className="w-full p-3 mb-4 bg-zinc-900 border border-zinc-700 rounded"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="公告內容"
          className="w-full p-3 mb-4 bg-zinc-900 border border-zinc-700 rounded min-h-[180px]"
        />

        <button
          onClick={createAnnouncement}
          className="w-full bg-blue-600 py-3 rounded font-bold"
        >
          發布公告
        </button>
      </div>
    </main>
  );
}