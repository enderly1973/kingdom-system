"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  completed_newbie_tasks: number;
    rank_level: number;
};

type NewbieTask = {
  id: string;
  title: string;
  description: string;
  order_no: number;
  points_reward: number;
  reputation_reward: number;
};

export default function NewbieTasks({
  currentUser,
  onUpdated,
}: {
  currentUser: User;
  onUpdated: () => void;
}) {
  if (currentUser.rank_level > 0) {
  return null;
}
  
  const [tasks, setTasks] = useState<NewbieTask[]>([]);

  useEffect(() => {
    async function loadTasks() {
      const { data, error } = await supabase
        .from("newbie_tasks")
        .select("*")
        .order("order_no", { ascending: true });

      if (error) {
        alert(error.message);
        return;
      }

      setTasks(data || []);
    }

    loadTasks();
  }, []);

  async function completeTask() {
    const nextCount = currentUser.completed_newbie_tasks + 1;

    const { error } = await supabase
      .from("users")
      .update({
        completed_newbie_tasks: nextCount,
      })
      .eq("id", currentUser.id);

    if (error) {
      alert(error.message);
      return;
    }

    const updatedUser = {
      ...currentUser,
      completed_newbie_tasks: nextCount,
    };

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    alert("新手任務完成");
    onUpdated();
  }

  return (
    <div className="border border-zinc-700 rounded-xl p-6 max-w-md mt-6">
      <h2 className="text-2xl font-bold mb-4">
        新手任務
      </h2>

      <p className="mb-4">
        目前進度：{currentUser.completed_newbie_tasks} / 3
      </p>

      <div className="flex flex-col gap-3 mb-4">
        {tasks
  .filter((task) => task.order_no > currentUser.completed_newbie_tasks)
  .map((task, index) => {
    const done = false;

          return (
            <div
              key={task.id}
              className="border border-zinc-700 rounded p-3"
            >
              <p className="font-bold">
                {done ? "✅" : "⬜"} {task.title}
              </p>

              <p className="text-sm text-zinc-400">
                {task.description}
              </p>

              <p className="text-sm text-zinc-500">
                積分 +{task.points_reward}｜聲望 +{task.reputation_reward}
              </p>
            </div>
          );
        })}
      </div>

{currentUser.completed_newbie_tasks < 3 ? (
  <p className="text-zinc-400 text-sm">
    請完成下方任務提交，等待審核通過後才會完成新人任務3。
  </p>
) : (
        <p className="text-green-400">
          已完成全部新手任務，可進行轉職。
        </p>
      )}
    </div>
  );
}