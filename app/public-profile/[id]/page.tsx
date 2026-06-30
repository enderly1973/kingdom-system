"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) setCurrentUser(JSON.parse(saved));

    loadUser();
  }, []);

  async function loadUser() {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    setUser(data);
  }

  function canPrivateChat() {
    if (!currentUser || !user) return false;
    if (currentUser.id === user.id) return false;

    const myRank = currentUser.rank_level;
    const targetRank = user.rank_level;

    if (myRank === 0 || targetRank === 0) return false;
    if (myRank === 6 || targetRank === 6) return false;

    if (myRank === 1 || myRank === 2) {
      return targetRank >= 3 && targetRank <= 5;
    }

    if (myRank >= 3 && myRank <= 5) {
      return targetRank >= 1 && targetRank <= 5;
    }

    return false;
  }

  if (!user) {
    return <div className="p-6 text-white">載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto border border-zinc-700 rounded-xl p-5">
        <h1 className="text-3xl font-bold mb-4">{user.nickname}</h1>

        <p>階級：{user.rank_level}</p>
        <p>積分：{user.points}</p>
        <p>聲望：{user.reputation}</p>

        {canPrivateChat() && (
          <button
            onClick={() => {
              window.location.href = `/private-chat/${user.id}`;
            }}
            className="mt-4 w-full bg-white text-black rounded-lg px-4 py-2 font-bold"
          >
            💬 私訊
          </button>
        )}

        <div className="mt-4">
          <p>身高：{user.height || "未公開"}</p>
          <p>體重：{user.weight || "未公開"}</p>
          <p>城市：{user.city || "未公開"}</p>
          <p>興趣：{user.hobbies || "未公開"}</p>
        </div>

        <div className="mt-4">
          <p>新人任務：</p>
          <p>{user.completed_newbie_tasks || 0} / 3</p>
        </div>

        <div className="mt-4">
          <p>個人介紹：</p>
          <p>{user.bio || "尚未填寫"}</p>
        </div>
      </div>
    </div>
  );
}