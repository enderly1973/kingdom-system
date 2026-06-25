"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
};

type UserBadge = {
  badge_id: string;
  earned_at: string;
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const user = JSON.parse(saved);
    setCurrentUser(user);

    checkAndAwardBadges(user.id);
  }, []);

  async function checkAndAwardBadges(userId: string) {
    const { data: freshUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (!freshUser) {
      loadBadges(userId);
      return;
    }

    const { data: badgeList } = await supabase
      .from("badges")
      .select("*");

    if (!badgeList) {
      loadBadges(userId);
      return;
    }

    async function awardByCode(code: string) {
      const badge = (badgeList || []).find((item: any) => item.code === code);
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

    if ((freshUser.completed_newbie_tasks || 0) >= 3) {
      await awardByCode("newbie");
    }

    if ((freshUser.checkin_streak || 0) >= 7) {
      await awardByCode("checkin7");
    }

    if ((freshUser.checkin_streak || 0) >= 30) {
      await awardByCode("checkin30");
    }

    if ((freshUser.points || 0) >= 1000) {
      await awardByCode("rich1000");
    }

    if ((freshUser.points || 0) >= 10000) {
      await awardByCode("rich10000");
    }

    if ((freshUser.rank_level || 0) >= 5) {
      await awardByCode("noble");
    }

    loadBadges(userId);
  }

  async function loadBadges(userId: string) {
    const { data: badgeData } = await supabase
      .from("badges")
      .select("*")
      .order("created_at", { ascending: true });

    const { data: earnedData } = await supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", userId);

    setBadges(badgeData || []);
    setUserBadges(earnedData || []);
  }

  function getEarnedBadge(badgeId: string) {
    return userBadges.find((item) => item.badge_id === badgeId);
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() => (window.location.href = "/")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-400"
      >
        ← 返回首頁
      </button>

      <h1 className="text-4xl font-bold mb-2">🏅 我的勳章</h1>

      <p className="text-zinc-400 mb-8">
        {currentUser?.nickname} 已取得的成就與尚未解鎖的目標。
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        {badges.map((badge) => {
          const earned = getEarnedBadge(badge.id);

          return (
            <div
              key={badge.id}
              className={
                earned
                  ? "border border-yellow-600 bg-zinc-900 rounded-xl p-5"
                  : "border border-zinc-800 bg-zinc-950 rounded-xl p-5 opacity-40"
              }
            >
              <div className="text-4xl mb-3">{badge.icon}</div>

              <h2 className="text-xl font-bold mb-2">
                {badge.name}
              </h2>

              <p className="text-zinc-400 text-sm mb-4">
                {badge.description}
              </p>

              {earned ? (
                <p className="text-yellow-400 text-sm">
                  已取得：
                  {new Date(earned.earned_at).toLocaleDateString("zh-TW")}
                </p>
              ) : (
                <p className="text-zinc-500 text-sm">
                  尚未取得
                </p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}