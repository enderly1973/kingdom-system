"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    setAnnouncements(data || []);
  }

  async function createAnnouncement() {
    if (!title.trim() || !content.trim()) {
      alert("請輸入標題與內容");
      return;
    }

    const { error } = await supabase
      .from("announcements")
      .insert({
        title,
        content,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    setContent("");
    loadAnnouncements();
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm("確定刪除此公告？")) return;

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadAnnouncements();
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/admin")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回管理後台
      </button>

      <h1 className="text-4xl font-bold mb-8">
        公告管理
      </h1>

      <div className="border border-zinc-800 rounded-xl p-5 mb-10">
        <input
          className="w-full mb-4 rounded bg-zinc-900 border border-zinc-700 p-3"
          placeholder="公告標題"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full h-40 rounded bg-zinc-900 border border-zinc-700 p-3"
          placeholder="公告內容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          onClick={createAnnouncement}
          className="mt-4 rounded bg-green-600 px-5 py-2"
        >
          發布公告
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((item) => (
          <div
            key={item.id}
            className="border border-zinc-800 rounded-xl p-5"
          >
            <h2 className="text-xl font-bold">
              {item.title}
            </h2>

            <p className="mt-3 whitespace-pre-wrap">
              {item.content}
            </p>

            <button
              onClick={() => deleteAnnouncement(item.id)}
              className="mt-5 rounded bg-red-600 px-4 py-2"
            >
              刪除公告
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}