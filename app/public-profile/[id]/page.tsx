"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
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

  if (!user) {
    return (
      <div className="p-6 text-white">
        載入中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto border border-zinc-700 rounded-xl p-5">

        <h1 className="text-3xl font-bold mb-4">
          {user.nickname}
        </h1>

        <p>階級：{user.rank_level}</p>
        <p>積分：{user.points}</p>
        <p>聲望：{user.reputation}</p>

        <div className="mt-4">
          <p>身高：{user.height || "未公開"}</p>
          <p>體重：{user.weight || "未公開"}</p>
          <p>城市：{user.city || "未公開"}</p>
          <p>興趣：{user.hobbies || "未公開"}</p>
        </div>

        <div className="mt-4">
          <p>新人任務：</p>
          <p>
            {user.completed_newbie_tasks || 0} / 3
          </p>
        </div>

        <div className="mt-4">
          <p>個人介紹：</p>
          <p>{user.bio || "尚未填寫"}</p>
        </div>

      </div>
    </div>
  );
}