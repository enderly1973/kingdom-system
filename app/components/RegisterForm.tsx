"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  async function register() {
    const { error } = await supabase
      .from("users")
      .insert([
{
  email,
  password,
  nickname,
  rank_level: 0,
  points: 0,
  reputation: 0,
  completed_newbie_tasks: 0,
  is_prisoner: false,
  prison_checkin_streak: 0,
  last_prison_checkin_date: null,
},
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("註冊成功");
  }

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <input
        className="p-3 rounded bg-white text-black"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="p-3 rounded bg-white text-black"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        className="p-3 rounded bg-white text-black"
        placeholder="Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <button
        onClick={register}
        className="bg-blue-600 p-3 rounded"
      >
        註冊
      </button>
    </div>
  );
}