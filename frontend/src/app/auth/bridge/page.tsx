"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TUNAG_APP_URL =
  process.env.NEXT_PUBLIC_TUNAG_APP_URL || "https://tunag.vercel.app";

function parseHashParams(hash: string) {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);

  return {
    accessToken: params.get("access_token") || "",
    refreshToken: params.get("refresh_token") || "",
    next: params.get("next") || "/calendar/month",
  };
}

export default function SchedulerBridgePage() {
  const [message, setMessage] = useState("ログイン情報を引き継いでいます...");

  useEffect(() => {
    async function run() {
      try {
        const { accessToken, refreshToken, next } = parseHashParams(window.location.hash);

        if (!accessToken || !refreshToken) {
          setMessage("ログイン情報が見つかりません。Tunagへ戻ります...");
          window.location.href = `${TUNAG_APP_URL}/login`;
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setMessage("ログイン情報の引き継ぎに失敗しました。Tunagへ戻ります...");
          console.error(error);
          window.location.href = `${TUNAG_APP_URL}/login`;
          return;
        }

        // hash を消してから遷移
        window.history.replaceState(null, "", "/auth/bridge");
        window.location.href = next;
      } catch (error) {
        console.error(error);
        setMessage("ログイン情報の処理に失敗しました。Tunagへ戻ります...");
        window.location.href = `${TUNAG_APP_URL}/login`;
      }
    }

    run();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #f8f7ff 0%, #eef4ff 100%)",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "24px",
          fontWeight: 800,
          boxShadow: "0 12px 28px rgba(91, 98, 133, 0.10)",
        }}
      >
        {message}
      </div>
    </main>
  );
}
