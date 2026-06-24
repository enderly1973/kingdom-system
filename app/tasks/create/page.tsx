"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const ranks = [
  { level: 1, name: "C級奴隸" },
  { level: 2, name: "B級奴隸" },
  { level: 3, name: "平民" },
  { level: 4, name: "騎士" },
  { level: 5, name: "貴族" },
  { level: 6, name: "王族" },
];

export default function CreateTaskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(10);
  const [isPublic, setIsPublic] = useState(false);
  const [minRank, setMinRank] = useState(1);
  const [maxRank, setMaxRank] = useState(1);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");

    if (!savedUser) {
      window.location.href = "/";
      return;
    }

    const user = JSON.parse(savedUser);
    setCurrentUser(user);

    const allowed = ranks.filter(
      (r) => r.level < user.rank_level
    );

    if (allowed.length > 0) {
      setMinRank(allowed[0].level);
      setMaxRank(
        allowed[allowed.length - 1].level
      );
    }
  }, []);

  const allowedRanks = currentUser
    ? ranks.filter(
        (r) => r.level < currentUser.rank_level
      )
    : [];

  async function createTask() {
    if (!currentUser) {
      alert("請先登入");
      return;
    }

    if (!title.trim()) {
      alert("請輸入任務名稱");
      return;
    }

    if (!description.trim()) {
      alert("請輸入任務內容");
      return;
    }

    if (minRank > maxRank) {
      alert("最低階級不能高於最高階級");
      return;
    }

    // 公開任務限制
    if (isPublic && currentUser.rank_level < 2) {
      alert("B級奴隸以上才能發布公開任務");
      return;
    }

    if (isPublic && points < 30) {
      alert("公開任務最低30分");
      return;
    }

    const { error } = await supabase
      .from("missions")
      .insert({
        title,
        description,
        creator_id: currentUser.id,
        points_reward: points,
        min_rank_level: minRank,
        max_rank_level: maxRank,
        is_public: isPublic,
        status: "open",
      });

    if (error) {
      alert("建立失敗");
      console.log(error);
      return;
    }

    alert("任務發布成功");

    setTitle("");
    setDescription("");
    setPoints(10);

    if (allowedRanks.length > 0) {
      setMinRank(allowedRanks[0].level);
      setMaxRank(
        allowedRanks[
          allowedRanks.length - 1
        ].level
      );
    }

    setIsPublic(false);
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <button
        onClick={() =>
          (window.location.href = "/tasks")
        }
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回任務區
      </button>

      <h1 className="text-4xl font-bold mb-8">
        發布任務
      </h1>

      <div className="max-w-xl space-y-4">
        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="任務名稱"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3"
        />

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="任務內容"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 h-40"
        />

        <input
          type="number"
          min={1}
          value={points}
          onChange={(e) =>
            setPoints(Number(e.target.value))
          }
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3"
        />

        {isPublic && (
          <p className="text-yellow-400">
            公開任務最低獎勵 30 分
          </p>
        )}

        <select
          value={minRank}
          onChange={(e) =>
            setMinRank(
              Number(e.target.value)
            )
          }
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3"
        >
          {allowedRanks.map((rank) => (
            <option
              key={rank.level}
              value={rank.level}
            >
              最低階級：{rank.name}
            </option>
          ))}
        </select>

        <select
          value={maxRank}
          onChange={(e) =>
            setMaxRank(
              Number(e.target.value)
            )
          }
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3"
        >
          {allowedRanks.map((rank) => (
            <option
              key={rank.level}
              value={rank.level}
            >
              最高階級：{rank.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) =>
              setIsPublic(
                e.target.checked
              )
            }
          />

          <span>
            公開任務（所有符合資格者可接取）
          </span>
        </div>

        <button
          onClick={createTask}
          className="w-full bg-green-600 rounded-lg py-3 font-bold"
        >
          發布任務
        </button>
      </div>
    </main>
  );
}