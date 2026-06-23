"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function BasicProfileTask({
  currentUser,
  onUpdated,
}: {
  currentUser: any;
  onUpdated: () => void;
}) {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [bio, setBio] = useState("");

  const isComplete =
    height &&
    weight &&
    birthYear &&
    gender &&
    city &&
    hobbies &&
    bio;

  async function submitProfile() {
    if (!isComplete) {
      alert("請完整填寫所有基本資料");
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({
        height: Number(height),
        weight: Number(weight),
        birth_year: Number(birthYear),

        gender,
        city,
        hobbies,
        bio,

        points: currentUser.points + 50,
        reputation: currentUser.reputation + 1,

        completed_newbie_tasks: 2,
      })
      .eq("id", currentUser.id);

    if (error) {
      alert(error.message);
      return;
    }

    const updatedUser = {
      ...currentUser,

      height: Number(height),
      weight: Number(weight),
      birth_year: Number(birthYear),

      gender,
      city,
      hobbies,
      bio,

      points: currentUser.points + 50,
      reputation: currentUser.reputation + 1,

      completed_newbie_tasks: 2,
    };

    localStorage.setItem(
      "currentUser",
      JSON.stringify(updatedUser)
    );

    alert("新人任務2完成：基本資料已建立");

    onUpdated();
  }

  if (currentUser.completed_newbie_tasks >= 2) {
    return (
      <div className="border border-zinc-700 rounded-xl p-6 mt-6 max-w-xl">
        <h2 className="text-2xl font-bold mb-4">
          新人任務2：完成基本資料
        </h2>

        <p className="text-green-400">
          已完成新人任務2
        </p>
      </div>
    );
  }

  return (
    <div className="border border-zinc-700 rounded-xl p-6 mt-6 max-w-xl">
      <h2 className="text-2xl font-bold mb-4">
        新人任務2：完成基本資料
      </h2>

      <input
        type="number"
        placeholder="身高 (cm)"
        value={height}
        onChange={(e) => setHeight(e.target.value)}
        className="w-full p-3 mb-3 bg-zinc-900 rounded"
      />

      <input
        type="number"
        placeholder="體重 (kg)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="w-full p-3 mb-3 bg-zinc-900 rounded"
      />

      <input
        type="number"
        placeholder="出生年次（民國）"
        value={birthYear}
        onChange={(e) => setBirthYear(e.target.value)}
        className="w-full p-3 mb-3 bg-zinc-900 rounded"
      />

      <input
        placeholder="性別"
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        className="w-full p-3 mb-3 bg-zinc-900 rounded"
      />

      <input
        placeholder="所在地區／縣市"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full p-3 mb-3 bg-zinc-900 rounded"
      />

      <input
        placeholder="興趣"
        value={hobbies}
        onChange={(e) => setHobbies(e.target.value)}
        className="w-full p-3 mb-3 bg-zinc-900 rounded"
      />

      <textarea
        placeholder="自我介紹"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        className="w-full p-3 mb-4 bg-zinc-900 rounded min-h-28"
      />

      <button
        onClick={submitProfile}
        disabled={!isComplete}
        className={`w-full p-3 rounded ${
          isComplete
            ? "bg-blue-600"
            : "bg-zinc-700 text-zinc-400"
        }`}
      >
        送出資料
      </button>
    </div>
  );
}