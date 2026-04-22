"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useState } from "react";

const TUNAG_APP_URL =
  process.env.NEXT_PUBLIC_TUNAG_APP_URL || "https://tunag.vercel.app";

export default function SchedulerShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userInfo } = useAuthUser();

  const logout = async () => {
    await supabase.auth.signOut();
    location.href = `${TUNAG_APP_URL}/login`;
  };

  return (
    <div style={styles.page}>
      {/* 背景クリックで閉じる */}
      {menuOpen && (
        <div style={styles.overlay} onClick={() => setMenuOpen(false)} />
      )}

      {/* サイドバー */}
      <aside
        style={{
          ...styles.sidebar,
          ...(menuOpen ? styles.sidebarOpen : {}),
        }}
      >
        <div>
          <div style={styles.title}>Scheduler</div>

          <div style={styles.user}>
            ログイン中: {userInfo?.name || "ユーザー"}
          </div>

          <Link href="/calendar/month" style={styles.btn}>
            月表示
          </Link>

          <Link href="/calendar/week" style={styles.btn}>
            週表示
          </Link>

          <Link href="/admin/audit-logs" style={styles.btn}>
            監査ログ
          </Link>

          <button
            style={styles.btn}
            onClick={() => (location.href = TUNAG_APP_URL)}
          >
            Tunagへ戻る
          </button>
        </div>

        <button onClick={logout} style={styles.logout}>
          ログアウト
        </button>
      </aside>

      {/* メイン */}
      <main style={styles.main}>
        <div style={styles.header}>
          <button onClick={() => setMenuOpen(true)} style={styles.menuBtn}>
            ☰
          </button>
          <h1>{title}</h1>
        </div>

        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles: any = {
  page: {
    display: "flex",
    minHeight: "100vh",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 9,
  },

  sidebar: {
    width: 260,
    background: "#fff",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    zIndex: 10,

    /* 👇スマホ対応 */
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    transform: "translateX(-100%)",
    transition: "0.3s",
  },

  sidebarOpen: {
    transform: "translateX(0)",
  },

  main: {
    flex: 1,
    padding: 16,
    marginLeft: 0,
    width: "100%",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  menuBtn: {
    fontSize: 20,
    padding: "6px 10px",
  },

  content: {
    overflow: "hidden",
  },

  title: {
    fontWeight: "bold",
    marginBottom: 12,
  },

  user: {
    marginBottom: 20,
    fontWeight: "bold",
  },

  btn: {
    display: "block",
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    background: "#eee",
    textDecoration: "none",
  },

  logout: {
    background: "red",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
  },
};
