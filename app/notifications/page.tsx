"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string;
  related_table: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const user = JSON.parse(saved);
    setCurrentUser(user);
    loadNotifications(user.id);
  }

  async function loadNotifications(userId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setNotifications(data || []);
  }

  async function markAsRead(id: string) {
    if (!currentUser) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadNotifications(currentUser.id);
  }

  async function markAllAsRead() {
    if (!currentUser) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentUser.id)
      .eq("is_read", false);

    if (error) {
      alert(error.message);
      return;
    }

    loadNotifications(currentUser.id);
  }

  async function deleteNotification(id: string) {
    if (!currentUser) return;

    const ok = confirm("確定刪除這則通知嗎？");
    if (!ok) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadNotifications(currentUser.id);
  }

  function formatTime(time: string) {
    return new Date(time).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });
  }

async function openNotification(n: Notification) {
  if (!n.is_read) {
    await markAsRead(n.id);
  }

  if (n.type === "chat") {
    if (n.related_id) {
      window.location.href = `/house-chat/${n.related_id}`;
    } else {
      window.location.href = "/house-chat";
    }
    return;
  }

  if (n.type === "recruit_apply" || n.type === "recruit_reject") {
    window.location.href = "/recruit";
    return;
  }

  if (n.type === "recruit_accept") {
    window.location.href = "/tasks";
    return;
  }
}



function getTypeLabel(type: string) {
  if (type === "recruit_apply") return "徵求申請";
  if (type === "recruit_accept") return "申請通過";
  if (type === "recruit_reject") return "申請拒絕";
  if (type === "chat") return "聊天室";
  if (type === "task") return "任務";
  if (type === "auction") return "拍賣";
  if (type === "badge") return "勳章";
  if (type === "relationship") return "附屬關係";

  return "一般";
}
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const shownNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => (window.location.href = "/")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-400"
      >
        ← 返回首頁
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">🔔 通知中心</h1>
          <p className="text-zinc-400 mt-2">
            未讀通知：{unreadCount}
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          className="bg-white text-black px-4 py-2 rounded-lg font-bold"
        >
          全部已讀
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={
            filter === "all"
              ? "bg-white text-black px-4 py-2 rounded-lg"
              : "border border-zinc-700 px-4 py-2 rounded-lg"
          }
        >
          全部
        </button>

        <button
          onClick={() => setFilter("unread")}
          className={
            filter === "unread"
              ? "bg-white text-black px-4 py-2 rounded-lg"
              : "border border-zinc-700 px-4 py-2 rounded-lg"
          }
        >
          未讀
        </button>
      </div>

      <section className="space-y-4">
        {shownNotifications.length === 0 ? (
          <p className="text-zinc-500">目前沒有通知。</p>
        ) : (
          shownNotifications.map((n) => (
            <div
  key={n.id}
  onClick={() => openNotification(n)}
  className={
                n.is_read
                  ? "border border-zinc-800 rounded-xl p-5 bg-zinc-950 cursor-pointer hover:border-zinc-500"
: "border border-blue-600 rounded-xl p-5 bg-zinc-900 cursor-pointer hover:border-blue-400"
              }
            >
              <div className="flex justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-red-600 rounded-full" />
                    )}

                    <span className="text-xs bg-zinc-800 text-zinc-300 rounded-full px-2 py-1">
                      {getTypeLabel(n.type)}
                    </span>

                    <span className="text-xs text-zinc-500">
                      {formatTime(n.created_at)}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold mb-2">{n.title}</h2>

                  {n.message && (
                    <p className="text-zinc-300 whitespace-pre-wrap">
                      {n.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg"
                    >
                      已讀
                    </button>
                  )}

                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="border border-red-700 text-red-400 px-3 py-2 rounded-lg hover:bg-red-950"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}