"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function HouseChatRoomPage() {
  const params = useParams();
  const masterId = params.masterId as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [readReceipts, setReadReceipts] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string>("");
  const [editingText, setEditingText] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!masterId) return;

    loadMessages(masterId);
loadMembers(masterId);
loadReadReceipts(masterId);

    const channel = supabase
      .channel(`house-chat-${masterId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "house_chats",
          filter: `master_id=eq.${masterId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "house_chats",
          filter: `master_id=eq.${masterId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
          );
        }
      )
      .subscribe();

    const timer = setInterval(() => {
      loadMessages(masterId);
    }, 3000);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [masterId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function checkUser() {
    const saved = localStorage.getItem("currentUser");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    const user = JSON.parse(saved);

    const { data: freshUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    const realUser = freshUser || user;
    setCurrentUser(realUser);

    await markRoomAsRead(realUser.id, masterId);
loadReadReceipts(masterId);
  }

  async function markRoomAsRead(userId: string, targetMasterId: string) {
    if (currentUser?.rank_level >= 6) {
  return;
}
    await supabase.from("house_chat_reads").upsert(
      {
        user_id: userId,
        master_id: targetMasterId,
        last_read_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,master_id",
      }
    );
  }

  async function loadMembers(targetMasterId: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .or(`id.eq.${targetMasterId},mentor_id.eq.${targetMasterId}`);

    if (error) {
      console.log(error);
      return;
    }

    setMembers(data || []);
  }

async function loadReadReceipts(targetMasterId: string) {
  const { data, error } = await supabase
    .from("house_chat_reads")
    .select("*")
    .eq("master_id", targetMasterId);

  if (error) {
    console.log(error);
    return;
  }

  setReadReceipts(data || []);
}

function getReadStatus(msg: any) {
  if (!currentUser) return "";
  if (msg.sender_id !== currentUser.id) return "";
  if (msg.is_deleted) return "";

  const otherMembers = members.filter((m) => m.id !== currentUser.id);

  if (otherMembers.length === 0) return "未讀";

  const readCount = otherMembers.filter((member) => {
    const receipt = readReceipts.find((r) => r.user_id === member.id);

    if (!receipt?.last_read_at) return false;

    return new Date(receipt.last_read_at) >= new Date(msg.created_at);
  }).length;

  if (readCount === otherMembers.length) {
    return "已讀";
  }

  return `已讀 ${readCount}/${otherMembers.length}`;
}
function showReadDetail(msg: any) {
  if (!currentUser) return;
  if (msg.sender_id !== currentUser.id) return;

  const otherMembers = members.filter((m) => m.id !== currentUser.id);

  const readMembers = otherMembers.filter((member) => {
    const receipt = readReceipts.find((r) => r.user_id === member.id);

    if (!receipt?.last_read_at) return false;

    return new Date(receipt.last_read_at) >= new Date(msg.created_at);
  });

  const unreadMembers = otherMembers.filter(
    (member) => !readMembers.some((r) => r.id === member.id)
  );

  alert(
    `已讀：\n${
      readMembers.length > 0
        ? readMembers.map((m) => m.nickname).join("\n")
        : "無"
    }\n\n未讀：\n${
      unreadMembers.length > 0
        ? unreadMembers.map((m) => m.nickname).join("\n")
        : "無"
    }`
  );
}
  async function loadMessages(targetMasterId: string) {
    const { data, error } = await supabase
      .from("house_chats")
      .select("*")
      .eq("master_id", targetMasterId)
      .order("created_at", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }

    setMessages(data || []);
  }

  async function markAsRead() {
    if (!currentUser) return;

    await markRoomAsRead(currentUser.id, masterId);
  }

  function getSender(senderId: string) {
    return members.find((m) => m.id === senderId);
  }
  function canRecallMessage(msg: any) {
  if (!currentUser) return false;
  if (msg.is_deleted) return false;
  if (msg.sender_id !== currentUser.id) return false;

  const createdAt = new Date(msg.created_at).getTime();
  const now = Date.now();
  const twoMinutes = 2 * 60 * 1000;

  return now - createdAt <= twoMinutes;
} 
  function canDeleteMessage(msg: any) {
    if (!currentUser) return false;
    if (msg.is_deleted) return false;

    const isMaster = currentUser.id === masterId;
    const isSender = msg.sender_id === currentUser.id;

    return isMaster || isSender;
  }

  function canEditMessage(msg: any) {
    if (!currentUser) return false;
    if (msg.is_deleted) return false;
    if (msg.sender_id !== currentUser.id) return false;

    const createdAt = new Date(msg.created_at).getTime();
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;

    return now - createdAt <= twoMinutes;
  }

  function startEditing(msg: any) {
    setEditingId(msg.id);
    setEditingText(msg.message || "");
  }

  function cancelEditing() {
    setEditingId("");
    setEditingText("");
  }

  async function saveEdit(msg: any) {
    if (!currentUser) return;

    const text = editingText.trim();

    if (!text) {
      alert("訊息不能是空白");
      return;
    }

    if (!canEditMessage(msg)) {
      alert("只能在送出後 2 分鐘內編輯自己的訊息");
      cancelEditing();
      return;
    }

    const { data, error } = await supabase
      .from("house_chats")
      .update({
        message: text,
        edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", msg.id)
      .select()
      .single();

    if (error) {
      alert("編輯失敗：" + error.message);
      return;
    }

    if (data) {
      setMessages((prev) =>
        prev.map((item) => (item.id === data.id ? data : item))
      );
    }

    cancelEditing();
  }
  async function recallMessage(msg: any) {
  if (!currentUser) return;

  if (!canRecallMessage(msg)) {
    alert("只能在送出後 2 分鐘內收回自己的訊息");
    return;
  }

  const { data, error } = await supabase
    .from("house_chats")
    .update({
      is_deleted: true,
      message: "此訊息已收回",
    })
    .eq("id", msg.id)
    .select()
    .single();

  if (error) {
    alert("收回失敗：" + error.message);
    return;
  }

  if (data) {
    setMessages((prev) =>
      prev.map((item) => (item.id === data.id ? data : item))
    );
  }
}
  async function deleteMessage(msg: any) {
    if (!currentUser) return;

    if (!canDeleteMessage(msg)) {
      alert("你沒有權限刪除這則訊息");
      return;
    }

    if (!confirm("確定要刪除這則訊息嗎？")) return;

    const { data, error } = await supabase
      .from("house_chats")
      .update({
        is_deleted: true,
        message: "此訊息已刪除",
      })
      .eq("id", msg.id)
      .select()
      .single();

    if (error) {
      alert("刪除失敗：" + error.message);
      return;
    }

    if (data) {
      setMessages((prev) =>
        prev.map((item) => (item.id === data.id ? data : item))
      );
    }
  }
  async function sendChatNotifications(chatMessage: any) {
  if (!currentUser) return;

  const receivers = members.filter((m) => m.id !== currentUser.id);

  if (receivers.length === 0) return;

  const preview =
    chatMessage.message_type === "image"
      ? "傳送了一張圖片"
      : chatMessage.message || "傳送了一則訊息";

const inserts = receivers.map((receiver) => ({
  user_id: receiver.id,
  title: "新的聊天室訊息",
  content: `${currentUser.nickname}：${preview}`,
  type: "chat",
  is_read: false,
  related_id: masterId,
}));
      const { error } = await supabase.from("notifications").insert(inserts);

  if (error) {
    console.log("通知建立失敗", error.message);
  }
}
  async function sendMessage() {
    if (!currentUser || !masterId) return;

    const text = message.trim();

    if (!text && !selectedFile) return;

    let messageType = "text";
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${masterId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(filePath, selectedFile);

      if (uploadError) {
        alert("圖片上傳失敗：" + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("chat-files")
        .getPublicUrl(filePath);

      messageType = "image";
      fileUrl = publicUrlData.publicUrl;
      fileName = selectedFile.name;
    }

    const { data, error } = await supabase
      .from("house_chats")
      .insert({
        master_id: masterId,
        sender_id: currentUser.id,
        message: text || "",
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        is_deleted: false,
        edited: false,
      })
      .select()
      .single();

    if (error) {
      alert("送出失敗：" + error.message);
      return;
    }

    setMessage("");
    setSelectedFile(null);
    await markAsRead();

    if (data) {
  await sendChatNotifications(data);

  setMessages((prev) => {
    const exists = prev.some((msg) => msg.id === data.id);
    if (exists) return prev;
    return [...prev, data];
  });
}
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      sendMessage();
    }
  }

  function handleEditKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    msg: any
  ) {
    if (e.key === "Enter") {
      saveEdit(msg);
    }

    if (e.key === "Escape") {
      cancelEditing();
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => (window.location.href = "/house-chat")}
        className="mb-4 border border-zinc-700 rounded-lg px-4 py-2"
      >
        ← 返回聊天室列表
      </button>

      <h1 className="text-4xl font-bold mb-2">家族聊天室</h1>

      <p className="text-zinc-400 mb-4">主人與附屬者共用的群聊天室。</p>

      <div className="mb-4 border border-zinc-800 rounded-xl p-4">
        <p className="font-bold mb-2">家族成員</p>

        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <span
              key={member.id}
              className="rounded-full bg-zinc-800 px-3 py-1 text-sm"
            >
              {member.nickname}
              {member.id === masterId ? "（主人）" : "（附屬）"}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[55vh] overflow-y-auto border border-zinc-800 rounded-xl p-4 mb-4 bg-zinc-950">
        {messages.length === 0 ? (
          <p className="text-zinc-500">目前沒有訊息</p>
        ) : (
          messages.map((msg) => {
            const sender = getSender(msg.sender_id);
            const isMe = msg.sender_id === currentUser?.id;
            const isEditing = editingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`mb-4 flex ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-xl px-4 py-3 ${
                    msg.is_deleted
                      ? "bg-zinc-700 text-zinc-400 italic"
                      : isMe
                      ? "bg-blue-600"
                      : "bg-zinc-800"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-300">
                      {sender?.nickname || "未知使用者"}
                      {sender?.id === masterId ? "｜主人" : "｜附屬"}
                    </p>

                    <div className="flex gap-2">
                      {canEditMessage(msg) && !isEditing && (
                        <button
                          onClick={() => startEditing(msg)}
                          className="text-xs text-yellow-200 hover:text-yellow-100"
                        >
                          編輯
                        </button>
                      )}

                      {canRecallMessage(msg) && (
  <button
    onClick={() => recallMessage(msg)}
    className="text-xs text-orange-200 hover:text-orange-100"
  >
    收回
  </button>
)}
                      {canDeleteMessage(msg) && (
                        <button
                          onClick={() => deleteMessage(msg)}
                          className="text-xs text-red-300 hover:text-red-100"
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-2">
                      <input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, msg)}
                        className="w-full rounded bg-zinc-900 border border-zinc-600 p-2 text-white"
                        autoFocus
                      />

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => saveEdit(msg)}
                          className="rounded bg-green-600 px-3 py-1 text-sm"
                        >
                          儲存
                        </button>

                        <button
                          onClick={cancelEditing}
                          className="rounded bg-zinc-600 px-3 py-1 text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : msg.is_deleted ? (
                    <p className="whitespace-pre-wrap italic text-zinc-400">
                      此訊息已刪除
                    </p>
                  ) : msg.message_type === "image" ? (
                    <div className="space-y-2">
                      <img
                        src={msg.file_url}
                        alt={msg.file_name}
                        className="max-w-xs rounded-lg border border-zinc-700"
                      />
                      {msg.message && (
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  )}

                  <p className="text-xs text-zinc-400 mt-2">
  {new Date(msg.created_at).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
  })}
  {msg.edited && !msg.is_deleted ? "（已編輯）" : ""}
  {isMe && !msg.is_deleted ? (
  <button
    onClick={() => showReadDetail(msg)}
    className="ml-1 underline hover:text-white"
  >
    ｜ {getReadStatus(msg)}
  </button>
) : null}
</p>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="輸入訊息，按 Enter 送出"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-3"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.length) {
              setSelectedFile(e.target.files[0]);
            }
          }}
        />

        <button
          onClick={sendMessage}
          className="rounded-lg bg-green-600 px-6 py-3 font-bold"
        >
          送出
        </button>
      </div>
    </main>
  );
}