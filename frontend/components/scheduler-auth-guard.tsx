"use client";

import { useEffect } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";

const TUNAG_APP_URL =
  process.env.NEXT_PUBLIC_TUNAG_APP_URL || "https://tunag.vercel.app";

type Props = {
  children: React.ReactNode;
};

export default function SchedulerAuthGuard({ children }: Props) {
  const { userInfo, loadingUser } = useAuthUser();

  useEffect(() => {
    if (loadingUser) return;
    if (userInfo) return;

    const nextUrl =
      typeof window !== "undefined"
        ? `${TUNAG_APP_URL}/login?next=${encodeURIComponent(window.location.href)}`
        : `${TUNAG_APP_URL}/login`;

    window.location.href = nextUrl;
  }, [loadingUser, userInfo]);

  if (loadingUser) {
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
          ログイン状態を確認中...
        </div>
      </main>
    );
  }

  if (!userInfo) return null;

  return <>{children}</>;
}
