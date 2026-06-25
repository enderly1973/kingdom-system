"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ReviewSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    const { data } = await supabase
      .from("task_submissions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!data) return;

    const userIds = data.map((item) => item.user_id);

    const { data: users } = await supabase
      .from("users")
      .select("id, nickname")
      .in("id", userIds);

    const merged = data.map((item) => ({
      ...item,
      user: users?.find((u) => u.id === item.user_id),
    }));

    setSubmissions(merged);
  }

  async function awardBadge(userId: string, badgeCode: string) {
    const { data: badge } = await supabase
      .from("badges")
      .select("id")
      .eq("code", badgeCode)
      .single();

    if (!badge) return;

    await supabase
      .from("user_badges")
      .upsert(
        {
          user_id: userId,
          badge_id: badge.id,
        },
        {
          onConflict: "user_id,badge_id",
        }
      );
  }

  async function approve(id: number) {
    const submission = submissions.find((s) => s.id === id);
    if (!submission) return;

    await supabase
      .from("task_submissions")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", submission.user_id)
      .single();

    if (user) {
      if (submission.submission_type === "newbie_task_2") {
        await supabase
          .from("users")
          .update({
            points: (user.points || 0) + 50,
            reputation: (user.reputation || 0) + 1,
            completed_newbie_tasks: Math.max(
              user.completed_newbie_tasks || 0,
              2
            ),
          })
          .eq("id", user.id);
      }

      if (submission.submission_type === "newbie_task_3") {
        await supabase
          .from("users")
          .update({
            points: (user.points || 0) + 100,
            reputation: (user.reputation || 0) + 2,
            completed_newbie_tasks: Math.max(
              user.completed_newbie_tasks || 0,
              3
            ),
          })
          .eq("id", user.id);

        await awardBadge(user.id, "newbie");
      }

      if (!submission.submission_type) {
        await supabase
          .from("users")
          .update({
            points: (user.points || 0) + 100,
            reputation: (user.reputation || 0) + 2,
          })
          .eq("id", user.id);
      }
    }

    loadSubmissions();
  }

  async function reject(id: number) {
    await supabase
      .from("task_submissions")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    loadSubmissions();
  }

  function getSubmissionTitle(item: any) {
    if (item.submission_type === "newbie_task_2") {
      return "新人任務2：基本資料審核";
    }

    if (item.submission_type === "newbie_task_3") {
      return "新人任務3：鞋照審核";
    }

    return "一般任務審核";
  }

  return (
    <div className="border border-zinc-700 rounded-xl p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">
        王族任務審核
      </h2>

      {submissions.length === 0 && (
        <p>目前沒有待審核任務</p>
      )}

      {submissions.map((item) => (
        <div
          key={item.id}
          className="border border-zinc-700 rounded p-4 mb-4"
        >
          <p className="font-bold mb-2">
            {getSubmissionTitle(item)}
          </p>

          <p className="text-sm text-zinc-400 mb-2">
            提交者：{item.user?.nickname || "未知成員"}
          </p>

          <p className="text-zinc-400 text-sm mt-1">
            提交時間：
            {new Date(item.created_at).toLocaleString("zh-TW", {
              timeZone: "Asia/Taipei",
            })}
          </p>

          {item.content && (
            <pre className="bg-zinc-900 p-3 rounded my-3 whitespace-pre-wrap text-sm">
              {item.content}
            </pre>
          )}

          {item.image_url && (
            <img
              src={item.image_url}
              alt=""
              className="max-w-md rounded mb-4"
            />
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => approve(item.id)}
              className="bg-green-600 px-4 py-2 rounded"
            >
              通過
            </button>

            <button
              onClick={() => reject(item.id)}
              className="bg-red-600 px-4 py-2 rounded"
            >
              退回
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}