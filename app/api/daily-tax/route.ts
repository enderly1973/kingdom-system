import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const { data: users, error } = await supabase
    .from("users")
    .select("*");

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }

  for (const user of users || []) {
    if (user.last_tax_date === today) continue;

    const newPoints = (user.points || 0) - 10;

    if (newPoints <= 0) {
      await supabase
        .from("users")
        .update({
          points: 0,
          is_prisoner: true,
          prison_checkin_streak: 0,
          last_tax_date: today,
        })
        .eq("id", user.id);
    } else {
      await supabase
        .from("users")
        .update({
          points: newPoints,
          last_tax_date: today,
        })
        .eq("id", user.id);
    }
  }

  return NextResponse.json({
    success: true,
    message: "每日稅收完成",
  });
}