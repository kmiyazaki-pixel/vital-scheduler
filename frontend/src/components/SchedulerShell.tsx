"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useEffect, useState } from "react";

type SchedulerShellProps = {
  title?: string;
  children: React.ReactNode;
};

const TUNAG_APP_URL =
  process.env.NEXT_PUBLIC_TUNAG_APP_URL || "https://tunag.vercel.app";

export default function SchedulerShell({
  title = "VitalArea Scheduler",
  children,
}: SchedulerShellProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { userInfo } = useAuthUser();

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
    } catch {
      //
    } finally {
      window.location.replace(`${TUNAG_APP_URL}/login`);
    }
  };

  return (
    <div
      style={{
        ...page,
        display: isMobile ? "block" : "grid",
        gridTemplateColumns: isMobile ? undefined : "260px 1fr",
      }}
    >
      <div style={bgCircle1} />
      <div style={bgCircle2} />
      <div style={bgCircle3} />

      <aside
        style={{
          ...sidebar,
          width: isMobile ? "100%" : "260px",
          minWidth: isMobile ? "100%" : "260px",
          minHeight: isMobile ? "auto" : "100vh",
          borderRight: isMobile ? "none" : "1px solid rgba(0,0,0,0.06)",
          borderBottom: isMobile ? "1px solid rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div>
          <div style={kicker}>SCHEDULER</div>
          <div style={brand}>VitalArea Scheduler</div>
          <div style={userChip}>
            ログイン中: {userInfo?.name || userInfo?.email || "ユーザー"}
          </div>
        </div>

        <nav
          style={{
            ...nav,
            gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr",
          }}
        >
          <Link href="/calendar/month" style={navLinkBlue}>
            月表示
          </Link>
          <Link href="/calendar/week" style={navLinkPink}>
            週表示
          </Link>
          <Link href="/admin/audit-logs" style={navLinkGreen}>
            監査ログ
          </Link>
          <button
            type="button"
            onClick={() => {
              window.location.href =
                process.env.NEXT_PUBLIC_TUNAG_APP_URL || "https://tunag.vercel.app";
            }}
            style={backButton}
          >
            Tunagへ戻る
          </button>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          style={loggingOut ? disabledLogoutButton : logoutButton}
        >
          {loggingOut ? "ログアウト中..." : "ログアウト"}
        </button>
      </aside>

      <main
        style={{
          ...main,
          padding: isMobile ? 16 : 24,
        }}
      >
        <header style={header}>
          <h1
            style={{
              ...titleStyle,
              fontSize: isMobile ? 24 : 32,
            }}
          >
            {title}
          </h1>
        </header>

        <section
          style={{
            ...content,
            minHeight: isMobile ? "auto" : "calc(100vh - 120px)",
            overflowX: "auto",
          }}
        >
          {children}
        </section>
      </main>
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8f7ff 0%, #eef4ff 100%)",
  position: "relative",
  overflow: "hidden",
};

const bgCircle1: React.CSSProperties = {
  position: "absolute",
  top: "-60px",
  left: "-40px",
  width: "220px",
  height: "220px",
  borderRadius: "999px",
  background: "rgba(236, 72, 153, 0.12)",
};

const bgCircle2: React.CSSProperties = {
  position: "absolute",
  top: "120px",
  right: "-70px",
  width: "240px",
  height: "240px",
  borderRadius: "999px",
  background: "rgba(59, 130, 246, 0.12)",
};

const bgCircle3: React.CSSProperties = {
  position: "absolute",
  bottom: "-80px",
  left: "35%",
  width: "260px",
  height: "260px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.12)",
};

const sidebar: React.CSSProperties = {
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(10px)",
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 20,
  position: "relative",
  zIndex: 1,
};

const kicker: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  marginBottom: "12px",
};

const brand: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: "#1f2340",
  marginBottom: 12,
};

const userChip: React.CSSProperties = {
  background: "linear-gradient(135deg, #ecfdf3 0%, #d1fae5 100%)",
  color: "#166534",
  padding: "10px 14px",
  borderRadius: "12px",
  fontWeight: 800,
  boxShadow: "0 8px 18px rgba(16, 185, 129, 0.12)",
};

const nav: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const baseNavLink: React.CSSProperties = {
  display: "block",
  padding: "12px 14px",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 800,
  boxShadow: "0 8px 18px rgba(91, 98, 133, 0.08)",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  width: "100%",
};

const navLinkBlue: React.CSSProperties = {
  ...baseNavLink,
  color: "#1d4ed8",
  background: "linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%)",
};

const navLinkPink: React.CSSProperties = {
  ...baseNavLink,
  color: "#be185d",
  background: "linear-gradient(135deg, #fff0f5 0%, #ffe4ef 100%)",
};

const navLinkGreen: React.CSSProperties = {
  ...baseNavLink,
  color: "#166534",
  background: "linear-gradient(135deg, #ecfdf3 0%, #d1fae5 100%)",
};

const backButton: React.CSSProperties = {
  ...baseNavLink,
  color: "#9a3412",
  background: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
};

const logoutButton: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
  color: "#fff",
  padding: "12px 14px",
  cursor: "pointer",
  fontWeight: 800,
  boxShadow: "0 8px 18px rgba(99, 102, 241, 0.22)",
};

const disabledLogoutButton: React.CSSProperties = {
  ...logoutButton,
  opacity: 0.6,
  cursor: "not-allowed",
};

const main: React.CSSProperties = {
  minWidth: 0,
  position: "relative",
  zIndex: 1,
};

const header: React.CSSProperties = {
  marginBottom: 20,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#1f2340",
};

const content: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #fffafb 100%)",
  border: "1px solid rgba(255,255,255,0.8)",
  borderRadius: 24,
  padding: 20,
  boxShadow: "0 14px 30px rgba(91, 98, 133, 0.10)",
};
