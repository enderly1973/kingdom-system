"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Achievement = {
  id: string;
  user_id: string;
  badge_code: string;
  badge_name: string;
  created_at: string;
};

export default function AchievementsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

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

    loadAchievements(user.id);
  }

  async function loadAchievements(userId: string) {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      console.log(error);
      return;
    }

    setAchievements(data || []);
  }

  function getBadgeIcon(code: string) {
    if (code === "first_showcase") return "🏅";

    if (code === "showcase_10") return "🌟";
    if (code === "showcase_50") return "🔥";
    if (code === "showcase_100") return "👑";

    if (code === "likes_10") return "⭐";
    if (code === "likes_50") return "💎";
    if (code === "likes_100") return "👑";

    if (code === "showcase_top1") return "🏆";
    if (code === "showcase_week_top1") return "🏆";

    return "🎖";
  }

  function getBadgeDescription(code: string) {
    if (code === "first_showcase") {
      return "第一次公開成果通過審核";
    }

    if (code === "showcase_10") {
      return "累積 10 次公開成果通過審核";
    }

    if (code === "showcase_50") {
      return "累積 50 次公開成果通過審核";
    }

    if (code === "showcase_100") {
      return "累積 100 次公開成果通過審核";
    }

    if (code === "likes_10") {
      return "公開成果累積獲得 10 個讚";
    }

    if (code === "likes_50") {
      return "公開成果累積獲得 50 個讚";
    }

    if (code === "likes_100") {
      return "公開成果累積獲得 100 個讚";
    }

    if (code === "showcase_top1") {
      return "公開成果排行榜第一名";
    }

    if (code === "showcase_week_top1") {
      return "公開成果本週排行榜第一名";
    }

    return "特殊成就";
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/tasks")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回任務區
      </button>

      <h1 className="text-4xl font-bold mb-3">🏅 我的勳章</h1>

      <p className="text-zinc-400 mb-8">
        查看你目前已獲得的任務成就。
      </p>

      {currentUser && (
        <div className="border border-zinc-700 rounded-xl p-4 mb-8 max-w-xl">
          <p className="text-xl font-bold">{currentUser.nickname}</p>
          <p className="text-zinc-400">
            已獲得勳章：{achievements.length} 個
          </p>
        </div>
      )}

      {achievements.length === 0 ? (
        <p className="text-zinc-500">目前尚未獲得任何勳章</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="border border-yellow-700 rounded-xl p-5 bg-zinc-950"
            >
              <div className="text-5xl mb-4">
                {getBadgeIcon(achievement.badge_code)}
              </div>

              <h2 className="text-xl font-bold text-yellow-400">
                {achievement.badge_name}
              </h2>

              <p className="text-zinc-400 mt-2">
                {getBadgeDescription(achievement.badge_code)}
              </p>

              <p className="text-sm text-zinc-500 mt-4">
                獲得時間：
                {new Date(achievement.created_at).toLocaleString("zh-TW", {
                  timeZone: "Asia/Taipei",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}