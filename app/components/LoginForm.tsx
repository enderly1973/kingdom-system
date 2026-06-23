"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim())
      .eq("password", password.trim())
      .single();

    if (error || !data) {
      alert("登入失敗，帳號或密碼錯誤");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(data));
    alert("登入成功");
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-4 max-w-md mt-10">
      <h2 className="text-2xl font-bold">登入</h2>

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

      <button onClick={login} className="bg-zinc-700 p-3 rounded">
        登入
      </button>
    </div>
  );
}