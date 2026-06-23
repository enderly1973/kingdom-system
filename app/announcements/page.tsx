
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Announcement = {
  id: string;
  title: string;
  content: string;
  category: string;
};

type Noble = {
  id: string;
  nickname: string;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [nobles, setNobles] = useState<Noble[]>([]);

  useEffect(() => {
    loadAnnouncements();
    loadNobles();
  }, []);

  async function loadAnnouncements() {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setAnnouncements(data);
    }
  }

  async function loadNobles() {
    const { data } = await supabase
      .from("users")
      .select("id, nickname")
      .eq("rank_level", 5);

    if (data) {
      setNobles(data);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
  onClick={() => (window.location.href = "/")}
  className="mb-6 border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-400"
>
  ← 返回首頁
</button>
      <h1 className="text-4xl font-bold mb-8">公告欄</h1>

      <div className="border border-yellow-700 rounded-xl p-4 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          👑 貴族名單
        </h2>

        {nobles.length === 0 ? (
          <p className="text-zinc-500">
            目前沒有貴族
          </p>
        ) : (
          <div className="space-y-2">
            {nobles.map((user) => (
              <div key={user.id}>
                {user.nickname}
              </div>
            ))}
          </div>
        )}
      </div>

      {announcements.length === 0 ? (
        <p className="text-zinc-500">
          目前沒有公告
        </p>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="border border-zinc-700 rounded-xl p-4"
            >
              <div className="text-lg font-bold">
                {item.title}
              </div>

              <div className="text-zinc-400 text-sm mb-2">
                {item.category}
              </div>

              <div>
                {item.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}