
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Announcement = {
  id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
};

type Noble = {
  id: string;
  nickname: string;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [nobles, setNobles] = useState<Noble[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPinned, setEditPinned] = useState(false);

  useEffect(() => {
  loadAnnouncements();
  loadNobles();

  const saved = localStorage.getItem("currentUser");

  if (saved) {
    setCurrentUser(JSON.parse(saved));
  }
}, []);

  async function loadAnnouncements() {
    const { data } = await supabase
  .from("announcements")
  .select("*")
  .order("is_pinned", { ascending: false })
  .order("created_at", { ascending: false });

    if (data) {
      setAnnouncements(data);
    }
  }
async function updateAnnouncement() {
  if (!editingAnnouncement) return;

  const { error } = await supabase
    .from("announcements")
    .update({
      title: editTitle,
      content: editContent,
      is_pinned: editPinned,
    })
    .eq("id", editingAnnouncement.id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("公告已更新");

  setEditingAnnouncement(null);
  loadAnnouncements();
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
      {currentUser?.rank_level === 6 && (
  <button
    onClick={() => window.location.href = "/announcements/admin"}
    className="mb-6 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
  >
    ＋發布公告
  </button>
)}
      

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
  {item.is_pinned && (
    <span className="text-yellow-400 mr-2">
      📌
    </span>
  )}

  {item.title}
</div>

              <div className="text-zinc-400 text-sm mb-2">
                {item.category}
              </div>

              <div>
                {item.content}
              </div>
{currentUser?.rank_level === 6 && (
  <div className="flex gap-2 mt-3">
    <button
      onClick={async () => {
        if (!confirm("確定刪除公告？")) return;

        await supabase
          .from("announcements")
          .delete()
          .eq("id", item.id);

        loadAnnouncements();
      }}
      className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded"
    >
      刪除公告
    </button>

    <button
      onClick={() => {
        setEditingAnnouncement(item);
        setEditTitle(item.title);
        setEditContent(item.content);
        setEditPinned(item.is_pinned ?? false);
      }}
      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
    >
      編輯公告
    </button>
  </div>
)}
            </div>
          ))}
        </div>
      )}
          {editingAnnouncement && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-xl">
            <h2 className="text-2xl font-bold mb-4">編輯公告</h2>

            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full p-3 mb-4 bg-zinc-800 border border-zinc-700 rounded"
            />

            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 mb-4 bg-zinc-800 border border-zinc-700 rounded min-h-[160px]"
            />

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={editPinned}
                onChange={(e) => setEditPinned(e.target.checked)}
              />
              <span>📌 置頂公告</span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={updateAnnouncement}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded"
              >
                儲存修改
              </button>

              <button
                onClick={() => setEditingAnnouncement(null)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}