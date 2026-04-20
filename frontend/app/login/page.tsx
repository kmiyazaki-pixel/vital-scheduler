"use client";

import { useEffect } from "react";

const TUNAG_APP_URL =
  process.env.NEXT_PUBLIC_TUNAG_APP_URL || "https://tunag.vercel.app";

export default function SchedulerLoginPage() {
  useEffect(() => {
    const nextUrl =
      typeof window !== "undefined"
        ? `${TUNAG_APP_URL}/login?next=${encodeURIComponent(
            process.env.NEXT_PUBLIC_SCHEDULER_APP_URL || window.location.origin
          )}`
        : `${TUNAG_APP_URL}/login`;

    window.location.href = nextUrl;
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
        Tunag のログイン画面へ移動しています...
      </div>
    </main>
  );
}
