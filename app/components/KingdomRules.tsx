"use client";

import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  points: number;
  reputation: number;
  completed_newbie_tasks: number;
};

export default function KingdomRules({
  currentUser,
  onUpdated,
}: {
  currentUser: User;
  onUpdated: () => void;
}) {
  async function agreeRules() {
    const { error } = await supabase
      .from("users")
      .update({
  points: currentUser.points + 50,
  reputation: currentUser.reputation + 1,
  completed_newbie_tasks: 1,
})
      .eq("id", currentUser.id);

    if (error) {
      alert(error.message);
      return;
    }

    const updatedUser = {
  ...currentUser,
  points: currentUser.points + 50,
  reputation: currentUser.reputation + 1,
  completed_newbie_tasks: 1,
};

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    alert("新人任務1完成：已閱讀王國規則");
    onUpdated();
  }

  return (
    <div className="border border-zinc-700 rounded-xl p-6 max-w-3xl mt-6">
      <h2 className="text-3xl font-bold mb-4">
        新人任務1：閱讀王國規則
      </h2>

      <div className="space-y-3 text-zinc-300 leading-7">
        <p>1. 所有成員進入王國後，預設階級為「新成員」。</p>
        <p>2. 新成員需完成三項新人任務，才可選擇轉職為：C級奴隸、平民、騎士。</p>
        <p>3. 王國採階級制度：王族 &gt; 貴族 &gt; 騎士 &gt; 平民 &gt; B級奴隸 &gt; C級奴隸 &gt; 新成員。</p>
        <p>4. 階級高者可發布任務給階級低者；階級低者可接取任務，完成後取得積分與聲望。</p>
        <p>5. 任務需依發布者要求提交文字、照片、影片或聲音檔案。</p>
        <p>6. 任務完成後需經審核，審核通過才會獲得積分與聲望。</p>
        <p>7. 積分可用於升階、兌換獎勵或參與特殊活動。</p>
        <p>8. 聲望代表成員在王國中的信用與地位，將影響升階資格。</p>
        <p>9. 騎士與貴族相關升階需提出申請，並由王族審核。</p>
        <p>10. 王族擁有最終管理權，可處理升階、降階、公告、任務爭議與違規懲處。</p>
        <p>11. 成員不得偽造任務成果、冒用他人資料、惡意騷擾或破壞王國秩序。</p>
        <p>12. 若違反規則，可能受到警告、扣除積分、降低聲望、降階或停權處分。</p>
        <p>13. 完成閱讀後，代表你理解並同意遵守王國制度。</p>
        <p>14. 所有契約、專屬關係、任務關係與階級關係，皆以雙方自願為前提。</p>
        <p>15. 王國僅提供任務、階級、聲望與社群管理功能，所有現實行為與決定皆由當事人自行負責。</p>
      </div>
      <div className="mt-4 border border-red-600 rounded p-4">
  <h3 className="font-bold text-red-500 mb-2">
    🚔 王國稅收與監獄制度
  </h3>

  <ul className="list-disc pl-5 space-y-2 text-sm">
    <li>所有成員每日需繳納 10 積分作為王國稅收。</li>

    <li>
      若扣稅後積分小於等於 0，
      將立即被送入監獄服刑。
    </li>

    <li>
      服刑期間不得接取任務、發布任務、
      參與拍賣、收編附屬、成為附屬或轉職。
    </li>

    <li>
      監獄服刑期間僅能進行監獄打卡。
    </li>

    <li>
      需完成 3 次監獄打卡方可出獄。
    </li>

    <li>
      出獄後恢復為新成員階級，
      積分重置為 0。
    </li>
  </ul>
</div>

      {currentUser.completed_newbie_tasks === 0 ? (
        <button
          onClick={agreeRules}
          className="mt-6 bg-blue-600 p-3 rounded w-full"
        >
          我已閱讀並同意遵守王國規則
        </button>
      ) : (
        <p className="mt-6 text-green-400">
          已完成新人任務1
        </p>
      )}
    </div>
  );
}