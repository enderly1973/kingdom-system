"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type AuctionItem = {
  id: string;
  title: string | null;
  description: string | null;
  note: string | null;
  start_price: number;
  current_price: number;
  fixed_price: number | null;
  status: string;
  seller_id: string | null;
  seller_rank_level: number | null;
  seller_rank_name: string | null;
  buyer_id: string | null;
  highest_bidder_id: string | null;
  highest_bidder_name: string | null;
  created_at: string;
};

type User = {
  id: string;
  nickname: string;
  rank_level: number;
  rank_name?: string;
  rankName?: string;
  points?: number;
  self_release_cooldown_until?: string | null;
};

export default function AuctionPage() {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");

    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }

    loadItems();
  }, []);

  async function loadItems() {
    const { data, error } = await supabase
      .from("auction_items")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setItems(data || []);
  }

  function getFixedPrice(rankLevel: number) {
    switch (rankLevel) {
      case 1:
        return 30;
      case 2:
        return 50;
      case 3:
        return 100;
      case 4:
        return 200;
      default:
        return 0;
    }
  }

  function canBuy(buyerRank: number, sellerRank: number) {
    return buyerRank > sellerRank;
  }

  function getRankName(rankLevel: number) {
    switch (rankLevel) {
      case 0:
        return "新成員";
      case 1:
        return "C級奴隸";
      case 2:
        return "B級奴隸";
      case 3:
        return "平民";
      case 4:
        return "騎士";
      case 5:
        return "貴族";
      case 6:
        return "王族";
      default:
        return "未知階級";
    }
  }

  async function createItem() {
    if (!currentUser) {
      alert("請先登入");
      return;
    }
    if (
  currentUser.self_release_cooldown_until &&
  new Date(currentUser.self_release_cooldown_until) > new Date()
) {
  alert("解除附屬冷卻期中，24小時內不能拍賣自己");
  return;
}

    if ((currentUser.points || 0) < 150) {
      alert("至少需要150點才能參與拍賣或被拍賣");
      return;
    }

    if (currentUser.rank_level === 0) {
      alert("新成員不能拍賣自己");
      return;
    }

    if (currentUser.rank_level >= 5) {
      alert("貴族與王族不能拍賣自己");
      return;
    }

    const price = getFixedPrice(currentUser.rank_level);

    if (!price) {
      alert("此階級不可拍賣");
      return;
    }

    const rankName =
      currentUser.rank_name ||
      currentUser.rankName ||
      getRankName(currentUser.rank_level);

    const { error } = await supabase.from("auction_items").insert({
      title: `${currentUser.nickname} 拍賣自己`,
      description: note,
      note,
      start_price: price,
      current_price: price,
      fixed_price: price,
      status: "open",
      seller_id: currentUser.id,
      seller_rank_level: currentUser.rank_level,
      seller_rank_name: rankName,
      buyer_id: null,
      highest_bidder_id: null,
      highest_bidder_name: null,
    });

    if (error) {
      console.error(error);
      alert("建立失敗");
      return;
    }

    setNote("");
    loadItems();
  }

async function buyAuction(item: AuctionItem) {
  if (!currentUser) {
    alert("請先登入");
    return;
  }

  if (!item.seller_id) {
    alert("賣方資料不完整");
    return;
  }

  if (item.seller_id === currentUser.id) {
    alert("不能收自己為附屬");
    return;
  }

  const price = item.fixed_price || item.current_price;

  const { data: buyer, error: buyerFetchError } = await supabase
    .from("users")
    .select("id, nickname, points, rank_level")
    .eq("id", currentUser.id)
    .single();



  if (buyerFetchError || !buyer) {
    console.error(buyerFetchError);
    alert("讀取買家資料失敗");
    return;
  }

  const { data: seller, error: sellerFetchError } = await supabase
    .from("users")
    .select("id, nickname, points, rank_level, self_release_cooldown_until")
    .eq("id", item.seller_id)
    .single();

  if (sellerFetchError || !seller) {
    console.error(sellerFetchError);
    alert("讀取賣方資料失敗");
    return;
  }
  if (
  seller.self_release_cooldown_until &&
  new Date(seller.self_release_cooldown_until) > new Date()
) {
  alert("對方剛解除附屬，24小時內禁止再次收編");
  return;
}

  if ((buyer.points || 0) < 150) {
    alert("至少需要150點才能收附屬");
    return;
  }

  if ((seller.points || 0) < 150) {
    alert("被拍賣者至少需要150點才能被收為附屬");
    return;
  }

  if ((buyer.points || 0) < price) {
    alert("點數不足，無法收為附屬");
    return;
  }

  if (!canBuy(buyer.rank_level, seller.rank_level)) {
    alert("只能收比自己低階的人為附屬");
    return;
  }

  const tribute = Math.floor((seller.points || 0) / 2);

  const newBuyerPoints = (buyer.points || 0) - price + tribute;
  const newSellerPoints = (seller.points || 0) - tribute;

  const { error: buyerUpdateError } = await supabase
    .from("users")
    .update({
      points: newBuyerPoints,
    })
    .eq("id", buyer.id);

  if (buyerUpdateError) {
    console.error(buyerUpdateError);
    alert("扣除買家點數失敗");
    return;
  }

  const { error: sellerUpdateError } = await supabase
    .from("users")
    .update({
      mentor_id: buyer.id,
      points: newSellerPoints,
    })
    .eq("id", seller.id);

  if (sellerUpdateError) {
    console.error(sellerUpdateError);
    alert("綁定附屬失敗");
    return;
  }

  const { error: auctionError } = await supabase
    .from("auction_items")
    .update({
      status: "closed",
      buyer_id: buyer.id,
      highest_bidder_id: buyer.id,
      highest_bidder_name: buyer.nickname,
      current_price: price,
    })
    .eq("id", item.id);

  if (auctionError) {
    console.error(auctionError);
    alert("更新拍賣狀態失敗");
    return;
  }
  const { data: firstSubBadge } = await supabase
  .from("badges")
  .select("id")
  .eq("code", "first_slave")
  .single();

if (firstSubBadge) {
  await supabase.from("user_badges").upsert({
    user_id: buyer.id,
    badge_id: firstSubBadge.id,
  });
}

  const updatedCurrentUser = {
    ...currentUser,
    points: newBuyerPoints,
  };

  localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser));
  setCurrentUser(updatedCurrentUser);

  alert(`已成功收為附屬，對方上繳 ${tribute} 點`);
  loadItems();
}
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <button
        onClick={() => history.back()}
        className="mb-6 rounded-xl border border-zinc-700 px-4 py-2 text-sm"
      >
        ← 返回首頁
      </button>

      <h1 className="text-3xl font-bold mb-2">拍賣區</h1>

      <p className="text-zinc-400 mb-8">
        C級奴隸30點、B級奴隸50點、平民100點、騎士200點。雙方需擁有150點以上才能參與。
      </p>

      <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 max-w-xl">
        <h2 className="text-xl font-bold mb-4">拍賣自己</h2>

        <textarea
          className="w-full mb-4 rounded-xl bg-black border border-zinc-700 px-4 py-2"
          placeholder="請介紹自己、可接受的附屬內容、擅長事項"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button
          onClick={createItem}
          className="rounded-xl bg-white text-black px-5 py-2 font-bold"
        >
          開始拍賣自己
        </button>
      </section>

      <section className="grid gap-4 max-w-3xl">
        {items.length === 0 ? (
          <p className="text-zinc-500">目前沒有拍賣中的成員。</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
            >
              <h3 className="text-xl font-bold">
                {item.title || "成員拍賣自己"}
              </h3>

              <p className="text-sm text-zinc-500 mt-1">
                階級：{item.seller_rank_name || "未知階級"}
              </p>

              <p className="text-zinc-300 mt-4 whitespace-pre-wrap">
                {item.note || item.description || "沒有填寫介紹"}
              </p>

              <p className="mt-4 text-lg font-bold">
                綁定價格：{item.fixed_price || item.current_price} 點
              </p>

              <button
                onClick={() => buyAuction(item)}
                className="mt-4 rounded-xl bg-white text-black px-5 py-2 font-bold"
              >
                收為附屬
              </button>
            </div>
          ))
        )}
      </section>
    </main>
  );
}