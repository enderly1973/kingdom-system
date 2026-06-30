"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  nickname: string;
  rank_level: number;
  mentor_id?: string | null;
  self_release_cooldown_until?: string | null;
};

type RecruitPost = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  min_rank: number;
  max_rank: number;
  max_members: number;
  status: string;
  created_at: string;
  owner?: {
  id: string;
  nickname: string;
  rank_level: number;
};
};

type RecruitApplication = {
  id: string;
  post_id: string;
  user_id: string;
  status: string;
  created_at: string;
  applicant?: {
    nickname: string;
    rank_level: number;
    mentor_id?: string | null;
  };
};

export default function RecruitPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<RecruitPost[]>([]);
  const [applications, setApplications] = useState<
    Record<string, RecruitApplication[]>
  >({});
  const [myApplications, setMyApplications] = useState<Record<string, boolean>>(
    {}
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(1);

  useEffect(() => {
    initUser();
  }, []);

  async function initUser() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const localUser = JSON.parse(saved);

    const { data: freshUser, error } = await supabase
      .from("users")
      .select("id, nickname, rank_level, mentor_id, self_release_cooldown_until")
      .eq("id", localUser.id)
      .single();

    if (error || !freshUser) {
      alert(error?.message || "找不到使用者");
      window.location.href = "/";
      return;
    }

    setCurrentUser(freshUser);
    loadPosts(freshUser.id);
    loadMyApplications(freshUser.id);
  }

  async function loadPosts(userId?: string) {
    const { data, error } = await supabase
      .from("recruit_posts")
      .select(`
        *,
        owner:users!recruit_posts_owner_id_fkey (
  id,
  nickname,
  rank_level
)
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setPosts(data || []);

    if (userId) {
      loadApplicationsForOwner(userId);
    }
  }

  async function loadMyApplications(userId: string) {
    const { data, error } = await supabase
      .from("recruit_applications")
      .select("post_id")
      .eq("user_id", userId)
      .eq("status", "pending");

    if (error) {
      alert(error.message);
      return;
    }

    const map: Record<string, boolean> = {};

    for (const item of data || []) {
      map[item.post_id] = true;
    }

    setMyApplications(map);
  }

  async function loadApplicationsForOwner(ownerId: string) {
    const { data: ownerPosts } = await supabase
      .from("recruit_posts")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("status", "open");

    const postIds = (ownerPosts || []).map((p) => p.id);

    if (postIds.length === 0) {
      setApplications({});
      return;
    }

    const { data, error } = await supabase
      .from("recruit_applications")
      .select(`
        *,
        applicant:users!recruit_applications_user_id_fkey (
          nickname,
          rank_level,
          mentor_id
        )
      `)
      .in("post_id", postIds)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    const map: Record<string, RecruitApplication[]> = {};

    for (const app of data || []) {
      if (!map[app.post_id]) map[app.post_id] = [];
      map[app.post_id].push(app);
    }

    setApplications(map);
  }

  async function createPost() {
    if (!currentUser) return;

    if (currentUser.rank_level < 3) {
      alert("平民以上才可以刊登徵求附屬者");
      return;
    }

    if (!title.trim()) {
      alert("請輸入標題");
      return;
    }

    const { data: existing } = await supabase
      .from("recruit_posts")
      .select("id")
      .eq("owner_id", currentUser.id)
      .eq("status", "open")
      .maybeSingle();

    if (existing) {
      alert("你目前已經有一篇徵求文，請先關閉舊的再刊登新的");
      return;
    }

    const { error } = await supabase.from("recruit_posts").insert({
      owner_id: currentUser.id,
      title,
      description,
      min_rank: 0,
      max_rank: 2,
      max_members: maxMembers,
      status: "open",
    });

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    setDescription("");
    setMaxMembers(1);
    loadPosts(currentUser.id);
  }

  async function applyPost(postId: string, ownerId: string) {
    if (!currentUser) return;

    if (currentUser.id === ownerId) {
      alert("不能申請自己的徵求文");
      return;
    }

    if (currentUser.mentor_id) {
      alert("你目前已有主人，不能申請新的主人");
      return;
    }

    if (
      currentUser.self_release_cooldown_until &&
      new Date(currentUser.self_release_cooldown_until) > new Date()
    ) {
      alert("你目前還在24小時冷卻期內，不能申請新的主人");
      return;
    }

    const { data: existing } = await supabase
      .from("recruit_applications")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", currentUser.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      alert("你已經申請過這篇徵求文了");
      return;
    }

    const { error } = await supabase.from("recruit_applications").insert({
      post_id: postId,
      user_id: currentUser.id,
      status: "pending",
    });

    if (error) {
      alert(error.message);
      return;
    }
    await supabase.from("notifications").insert({
  user_id: ownerId,
  title: "新的附屬申請",
  message: `${currentUser.nickname} 申請成為你的附屬者。`,
  type: "recruit_apply",
});
    alert("申請成功，等待對方審核");

    setMyApplications((prev) => ({
      ...prev,
      [postId]: true,
    }));
  }

  async function acceptApplication(app: RecruitApplication, post: RecruitPost) {
    if (!currentUser) return;

    const ok = confirm(
      `確定接受 ${app.applicant?.nickname || "此使用者"} 成為附屬者嗎？`
    );
    if (!ok) return;

    if (app.applicant?.mentor_id) {
      alert("對方目前已有主人，不能接受");
      return;
    }

    const { error: userError } = await supabase
      .from("users")
      .update({
        mentor_id: currentUser.id,
      })
      .eq("id", app.user_id);

    if (userError) {
      alert(userError.message);
      return;
    }

    const { error: appError } = await supabase
      .from("recruit_applications")
      .update({
        status: "accepted",
      })
      .eq("id", app.id);

    if (appError) {
      alert(appError.message);
      return;
    }

    await supabase
      .from("recruit_applications")
      .update({
        status: "rejected",
      })
      .eq("user_id", app.user_id)
      .eq("status", "pending");

    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("mentor_id", currentUser.id);

    if ((count || 0) >= post.max_members) {
      await supabase
        .from("recruit_posts")
        .update({
          status: "closed",
        })
        .eq("id", post.id);
    }
    await supabase.from("notifications").insert({
  user_id: app.user_id,
  title: "申請已通過",
  message: `${currentUser.nickname} 已接受你的附屬申請。`,
  type: "recruit_accept",
});
    alert("已接受申請，附屬關係成立");
    loadPosts(currentUser.id);
  }

  async function rejectApplication(app: RecruitApplication) {
    if (!currentUser) return;

    const ok = confirm("確定拒絕這個申請嗎？");
    if (!ok) return;

    const { error } = await supabase
      .from("recruit_applications")
      .update({
        status: "rejected",
      })
      .eq("id", app.id);

    if (error) {
      alert(error.message);
      return;
    }
    await supabase.from("notifications").insert({
  user_id: app.user_id,
  title: "申請未通過",
  message: `${currentUser.nickname} 拒絕了你的附屬申請。`,
  type: "recruit_reject",
});
    loadApplicationsForOwner(currentUser.id);
  }

  async function closePost(postId: string) {
    const { error } = await supabase
      .from("recruit_posts")
      .update({ status: "closed" })
      .eq("id", postId);

    if (error) {
      alert(error.message);
      return;
    }

    if (currentUser) {
      loadPosts(currentUser.id);
    }
  }

  const canCreate = currentUser && currentUser.rank_level >= 3;

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => (window.location.href = "/")}
        className="mb-6 border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-400"
      >
        ← 返回首頁
      </button>

      <h1 className="text-2xl font-bold mb-6">徵求附屬</h1>

      {canCreate ? (
        <section className="mb-8 border border-zinc-800 rounded-xl p-5 bg-zinc-950">
          <h2 className="text-lg font-bold mb-4">刊登徵求附屬者</h2>

          <input
            className="w-full mb-3 p-3 rounded bg-zinc-900 border border-zinc-700"
            placeholder="標題，例如：徵求穩定每日打卡附屬"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full mb-3 p-3 rounded bg-zinc-900 border border-zinc-700"
            placeholder="介紹你的規則、獎勵、要求"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="number"
            min={1}
            className="w-full mb-4 p-3 rounded bg-zinc-900 border border-zinc-700"
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value))}
          />

          <button
            onClick={createPost}
            className="bg-white text-black px-5 py-2 rounded-lg font-bold"
          >
            刊登
          </button>
        </section>
      ) : (
        <p className="mb-8 text-zinc-400">平民以上才可以刊登徵求附屬者。</p>
      )}

      <section className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-zinc-500">目前沒有徵求文。</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="border border-zinc-800 rounded-xl p-5 bg-zinc-950"
            >
              <h2 className="text-xl font-bold mb-2">{post.title}</h2>

              <p className="text-sm text-zinc-400 mb-2">
  發布者：
  <button
    onClick={() =>
      (window.location.href = `/public-profile/${post.owner?.id}`)
    }
    className="text-blue-400 hover:underline ml-1"
  >
    {post.owner?.nickname || "未知"}
  </button>
  {" ｜ 最多收 "}
  {post.max_members} 人
</p>

              <p className="whitespace-pre-wrap text-zinc-300 mb-4">
                {post.description || "沒有填寫介紹"}
              </p>

              <div className="flex gap-3 mb-4">
                {currentUser?.id !== post.owner_id && (
                  <>
                    {myApplications[post.id] ? (
                      <button
                        disabled
                        className="bg-zinc-700 text-zinc-300 rounded-lg px-4 py-2"
                      >
                        已申請
                      </button>
                    ) : (
                      <button
                        onClick={() => applyPost(post.id, post.owner_id)}
                        className="bg-white text-black rounded-lg px-4 py-2"
                      >
                        我要申請
                      </button>
                    )}
                  </>
                )}

                {currentUser?.id === post.owner_id && (
                  <button
                    onClick={() => closePost(post.id)}
                    className="border border-red-700 text-red-400 rounded-lg px-4 py-2 hover:bg-red-950"
                  >
                    關閉徵求
                  </button>
                )}
              </div>

              {currentUser?.id === post.owner_id && (
                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <h3 className="font-bold mb-3">申請名單</h3>

                  {!applications[post.id] ||
                  applications[post.id].length === 0 ? (
                    <p className="text-zinc-500 text-sm">目前沒有申請。</p>
                  ) : (
                    <div className="space-y-3">
                      {applications[post.id].map((app) => (
                        <div
                          key={app.id}
                          className="border border-zinc-800 rounded-lg p-3 bg-black"
                        >
                          <p className="mb-2">
                            {app.applicant?.nickname || "未知使用者"} ｜ 階級{" "}
                            {app.applicant?.rank_level}
                          </p>

                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptApplication(app, post)}
                              className="bg-white text-black rounded-lg px-4 py-2"
                            >
                              接受
                            </button>

                            <button
                              onClick={() => rejectApplication(app)}
                              className="border border-red-700 text-red-400 rounded-lg px-4 py-2 hover:bg-red-950"
                            >
                              拒絕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}