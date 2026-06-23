"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import NewbieTasks from "./components/NewbieTasks";
import KingdomRules from "./components/KingdomRules";
import BasicProfileTask from "./components/BasicProfileTask";
import ShoeTask from "./components/ShoeTask";
import ReviewSubmissions from "./components/ReviewSubmissions";

type User = {
  id: string;
  email: string;
  nickname: string;
  rank_level: number;
  points: number;
  reputation: number;
  completed_newbie_tasks: number;
  mentor_id?: string | null;
  is_prisoner?: boolean;
  prison_checkin_streak?: number;
  last_prison_checkin_date?: string | null;
  last_checkin_date?: string | null;
};
type Subordinate = {
  id: string;
  nickname: string;
  rank_level: number;
  points: number;
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mentorName, setMentorName] = useState("");
  const [subordinates, setSubordinates] = useState<Subordinate[]>([]);

useEffect(() => {
  async function loadCurrentUser() {
    const savedUser = localStorage.getItem("currentUser");

    if (!savedUser) return;

    const parsedUser = JSON.parse(savedUser);

    const { data: freshUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", parsedUser.id)
      .single();

    if (!freshUser) {
      setCurrentUser(parsedUser);
      return;
    }

    setCurrentUser(freshUser);
    localStorage.setItem("currentUser", JSON.stringify(freshUser));
    const { data: subs } = await supabase
  .from("users")
  .select("id, nickname, rank_level, points")
  .eq("mentor_id", freshUser.id);

setSubordinates(subs || []);

    if (freshUser.mentor_id) {
      const { data: mentor } = await supabase
        .from("users")
        .select("nickname")
        .eq("id", freshUser.mentor_id)
        .single();

      if (mentor) {
        setMentorName(mentor.nickname);
      }
    }
  }

  loadCurrentUser();
}, []);
async function dailyCheckin() {
  if (!currentUser) return;

  const today = new Date().toISOString().split("T")[0];

  if (currentUser.last_checkin_date === today) {
    alert("今天已經打卡過了");
    return;
  }

  const newPoints = currentUser.points + 20;

  const { error } = await supabase
    .from("users")
    .update({
      points: newPoints,
      last_checkin_date: today,
    })
    .eq("id", currentUser.id);

  if (error) {
    alert(error.message);
    return;
  }

  const updatedUser = {
    ...currentUser,
    points: newPoints,
    last_checkin_date: today,
  };

  setCurrentUser(updatedUser);
  localStorage.setItem(
    "currentUser",
    JSON.stringify(updatedUser)
  );

  alert("打卡成功！獲得20點");
}
async function releaseSubordinate(sub: Subordinate) {
  if (!currentUser) return;

  const tribute = Math.floor((sub.points || 0) * 2 / 3);
  const remainingPoints = (sub.points || 0) - tribute;

  const ok = confirm(
    `確定解除 ${sub.nickname}？\n\n附屬扣除 ${tribute} 點\n你獲得 ${tribute} 點`
  );

  if (!ok) return;

  const { error: masterError } = await supabase
    .from("users")
    .update({
      points: currentUser.points + tribute,
    })
    .eq("id", currentUser.id);

  if (masterError) {
    alert(masterError.message);
    return;
  }

  const { error: subError } = await supabase
    .from("users")
    .update({
      mentor_id: null,
      points: remainingPoints,
    })
    .eq("id", sub.id);

  if (subError) {
    alert(subError.message);
    return;
  }

  const updatedUser = {
    ...currentUser,
    points: currentUser.points + tribute,
  };

  setCurrentUser(updatedUser);
  localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  setSubordinates(subordinates.filter((item) => item.id !== sub.id));

  alert("解除附屬完成");
}
async function selfRelease() {
  if (!currentUser?.mentor_id) return;

  const tribute = Math.floor((currentUser.points || 0) * 4 / 5);
  const remainingPoints = (currentUser.points || 0) - tribute;

  const ok = confirm(
    `確定申請解除附屬？\n\n需上供 ${tribute} 點給主人\n你剩下 ${remainingPoints} 點\n\n冷卻期 24 小時`
  );

  if (!ok) return;

  const cooldownUntil = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: master } = await supabase
    .from("users")
    .select("*")
    .eq("id", currentUser.mentor_id)
    .single();

  if (!master) {
    alert("找不到主人");
    return;
  }

  await supabase
    .from("users")
    .update({
      points: (master.points || 0) + tribute,
    })
    .eq("id", master.id);

  await supabase
    .from("users")
    .update({
      mentor_id: null,
      points: remainingPoints,
      self_release_cooldown_until: cooldownUntil,
    })
    .eq("id", currentUser.id);

  alert("已申請解除附屬，冷卻期24小時");

  location.reload();
}
async function transferSubordinate(sub: Subordinate) {
  if (!currentUser) return;

  const targetName = prompt("輸入要轉讓給誰（暱稱）");

  if (!targetName) return;

  const { data: newMaster } = await supabase
    .from("users")
    .select("*")
    .eq("nickname", targetName)
    .single();

  if (!newMaster) {
    alert("找不到該會員");
    return;
  }

  if (newMaster.id === currentUser.id) {
    alert("不能轉讓給自己");
    return;
  }

  const tribute = Math.floor((sub.points || 0) / 2);
  const remainingPoints = (sub.points || 0) - tribute;

  const ok = confirm(
    `確定轉讓 ${sub.nickname} 給 ${newMaster.nickname}？\n\n附屬扣除 ${tribute} 點\n你獲得 ${tribute} 點`
  );

  if (!ok) return;
  const { error: masterError } = await supabase
  .from("users")
  .update({
    points: currentUser.points + tribute,
  })
  .eq("id", currentUser.id);

if (masterError) {
  alert(masterError.message);
  return;
}

const { error: subError } = await supabase
  .from("users")
  .update({
    mentor_id: newMaster.id,
    points: remainingPoints,
  })
  .eq("id", sub.id);

if (subError) {
  alert(subError.message);
  return;
}
const updatedUser = {
  ...currentUser,
  points: currentUser.points + tribute,
};

setCurrentUser(updatedUser);
localStorage.setItem("currentUser", JSON.stringify(updatedUser));
setSubordinates(subordinates.filter((item) => item.id !== sub.id));

alert("轉讓附屬完成");
}
  async function changeJob(rankLevel: number, rankName: string) {
  if (!currentUser) return;

  const updatedUser = {
    ...currentUser,
    rank_level: rankLevel,
  };

  const { error } = await supabase
    .from("users")
    .update({ rank_level: rankLevel })
    .eq("id", currentUser.id);

  if (error) {
    alert(error.message);
    return;
  }

  localStorage.setItem(
    "currentUser",
    JSON.stringify(updatedUser)
  );

  setCurrentUser(updatedUser);

  alert(`已轉職為${rankName}`);
} 
async function prisonCheckIn() {
  if (!currentUser) return;

  const newStreak =
    (currentUser.prison_checkin_streak || 0) + 1;

  const { error } = await supabase
    .from("users")
    .update({
      prison_checkin_streak: newStreak,
    })
    .eq("id", currentUser.id);

  if (error) {
    alert(error.message);
    return;
  }

if (newStreak >= 3) {
  const releasedUser = {
    ...currentUser,
    is_prisoner: false,
    prison_checkin_streak: 0,
    last_prison_checkin_date: null,
    rank_level: 0,
    points: 0,
  };

  await supabase
    .from("users")
    .update({
      is_prisoner: false,
      prison_checkin_streak: 0,
      last_prison_checkin_date: null,
      rank_level: 0,
      points: 0,
    })
    .eq("id", currentUser.id);

  setCurrentUser(releasedUser);

  localStorage.setItem(
    "currentUser",
    JSON.stringify(releasedUser)
  );

  alert("恭喜服刑完成，已出獄並恢復新成員");
  return;
}

const updatedUser = {
  ...currentUser,
  prison_checkin_streak: newStreak,
};

setCurrentUser(updatedUser);

localStorage.setItem(
  "currentUser",
  JSON.stringify(updatedUser)
);

alert(`監獄打卡成功 (${newStreak}/3)`);
}
  function logout() {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  }

  if (currentUser) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-5xl font-bold mb-4">
          Kingdom System
        </h1>

        <p className="text-zinc-400 mb-10">
          會員中心
        </p>

        <div className="border border-zinc-700 rounded-xl p-6 max-w-md">
          <h2 className="text-3xl font-bold mb-4">
            {currentUser.nickname}
          </h2>

          <p>Email：{currentUser.email}</p>
          <p>
  階級：
  {
    currentUser.rank_level === 0 ? "新成員" :
    currentUser.rank_level === 1 ? "C級奴隸" :
    currentUser.rank_level === 2 ? "B級奴隸" :
    currentUser.rank_level === 3 ? "平民" :
    currentUser.rank_level === 4 ? "騎士" :
    currentUser.rank_level === 5 ? "貴族" :
    currentUser.rank_level === 6 ? "王族" :
    `LV${currentUser.rank_level}`
  }
</p>
          <p>積分：{currentUser.points}</p>
          <button
  onClick={dailyCheckin}
  className="bg-green-700 px-4 py-2 rounded mt-2"
>
  每日打卡 +20
</button>
          
          {currentUser.is_prisoner && (
  <div className="mt-2">
    <p className="text-red-500 font-bold">
      🚔 監獄服刑中
    </p>

    <button
  onClick={prisonCheckIn}
  className="bg-red-700 px-4 py-2 rounded mt-2"
>
  監獄打卡
</button>

    <p className="text-zinc-400 mt-2">
  服刑進度：{currentUser.prison_checkin_streak || 0}/3
</p>
  </div>
)}

          {currentUser.mentor_id && mentorName && (
  <p>主人：{mentorName}</p>
)}
{currentUser.mentor_id && (
  <button
    onClick={selfRelease}
    className="bg-yellow-600 text-white px-3 py-2 rounded mt-2"
  >
    自行解除附屬
  </button>
)}
          <p>聲望：{currentUser.reputation}</p>
          <p>新手任務：{currentUser.completed_newbie_tasks} / 3</p>
          {subordinates.length > 0 && (
  <div className="mt-3">
    <p className="font-bold">我的附屬：</p>
    {subordinates.map((sub) => (
  <div key={sub.id} className="mt-2">
    <p>
      {sub.nickname}｜LV{sub.rank_level}｜{sub.points}點
    </p>

    <button
  onClick={() => transferSubordinate(sub)}
  className="bg-blue-600 text-white px-2 py-1 rounded mr-2"
>
  轉讓附屬
</button>

<button
  onClick={() => releaseSubordinate(sub)}
  className="bg-red-600 text-white px-2 py-1 rounded"
>
  解除附屬
</button>
  </div>
))}
  </div>
)}
          {currentUser.completed_newbie_tasks >= 3 && currentUser.rank_level === 0 && (
  <div className="mt-4 border border-yellow-600 rounded p-4">
    <h3 className="font-bold mb-3">轉職系統</h3>

    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => changeJob(1, "C級奴隸")}
        className="bg-red-600 px-3 py-2 rounded"
      >
        C級奴隸
      </button>

      <button
        onClick={() => changeJob(3, "平民")}
        className="bg-blue-600 px-3 py-2 rounded"
      >
        平民
      </button>

      <button
        onClick={() => changeJob(4, "騎士")}
        className="bg-green-600 px-3 py-2 rounded"
      >
        騎士
      </button>
    </div>
  </div>
)}
          <button
  onClick={logout}
  className="mt-6 bg-red-600 p-3 rounded w-full"
>
  登出
</button>

</div>


<NewbieTasks
  currentUser={currentUser}
  onUpdated={() => {
    const saved = localStorage.getItem("currentUser");

    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }}
/>
{currentUser.rank_level > 0 && (
  <div className="mt-6 grid gap-4">
    <button
      onClick={() => window.location.href = "/announcements"}
      className="text-left border border-zinc-700 rounded-xl p-6 hover:border-zinc-400"
    >
      <h2 className="text-2xl font-bold mb-2">公告欄</h2>
      <p className="text-zinc-400">查看人員名單與公告事項。</p>
    </button>

    <button
      onClick={() => window.location.href = "/tasks"}
      className="text-left border border-zinc-700 rounded-xl p-6 hover:border-zinc-400"
    >
      <h2 className="text-2xl font-bold mb-2">任務區</h2>
      <p className="text-zinc-400">發布、接取與回報階級任務。</p>
    </button>

    <button
      onClick={() => window.location.href = "/auction"}
      className="text-left border border-zinc-700 rounded-xl p-6 hover:border-zinc-400"
    >
      <h2 className="text-2xl font-bold mb-2">拍賣區</h2>
      <p className="text-zinc-400">奴隸階級可拍賣自己，平民以上可出價。</p>
    </button>
  </div>
)}
{currentUser.completed_newbie_tasks < 1 && (
  <KingdomRules
    currentUser={currentUser}
    onUpdated={() => {
      const saved = localStorage.getItem("currentUser");

      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    }}
  />
)}

{currentUser.completed_newbie_tasks < 2 && (
  <BasicProfileTask
    currentUser={currentUser}
    onUpdated={() => {
      const saved = localStorage.getItem("currentUser");

      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    }}
  />
)}
{currentUser.completed_newbie_tasks < 3 && (
  <ShoeTask
    currentUser={currentUser}
    onUpdated={() => {
      const saved = localStorage.getItem("currentUser");

      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    }}
  />
)}
  {currentUser.rank_level === 6 && (
  <ReviewSubmissions />
)}

</main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-bold mb-4">
        Kingdom System
      </h1>

      <p className="text-zinc-400 mb-10">
        新成員註冊 / 登入
      </p>

      <div className="grid md:grid-cols-2 gap-10">
        <RegisterForm />
        <LoginForm />
      </div>
    </main>
  );
}