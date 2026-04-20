"use client";

import Link from "next/link";
import SchedulerAuthGuard from "@/components/scheduler-auth-guard";
import { useAuthUser } from "@/hooks/use-auth-user";
import { supabase } from "@/lib/supabase";

const TUNAG_APP_URL =
  process.env.NEXT_PUBLIC_TUNAG_APP_URL || "https://tunag.vercel.app";

export default function SchedulerHomePage() {
  return (
    <SchedulerAuthGuard>
      <SchedulerHomeContent />
    </SchedulerAuthGuard>
  );
}

function SchedulerHomeContent() {
  const { userInfo } = useAuthUser();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = `${TUNAG_APP_URL}/login`;
  }

  return (
    <main style={styles.main}>
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.kicker}>SCHEDULER</div>
            <h1 style={styles.title}>スケジュール</h1>
            <p style={styles.subtitle}>
              ログインは Tunag と共通です。ログイン中: {userInfo?.name}
            </p>
          </div>

          <div style={styles.headerActions}>
            <Link href={TUNAG_APP_URL} style={styles.secondaryButton}>
              Tunagへ戻る
            </Link>
            <button type="button" onClick={handleLogout} style={styles.primaryButton}>
              ログアウト
            </button>
          </div>
        </header>

        <section style={styles.card}>
          <p style={styles.text}>
            ここに今の scheduler のトップ画面コンテンツを入れてください。
          </p>
          <p style={styles.subText}>
            まずは独自ログインをやめて、Tunag 経由で入る形にそろえています。
          </p>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8f7ff 0%, #eef4ff 100%)",
    padding: "32px 16px",
    position: "relative",
    overflow: "hidden",
  },
  bgCircle1: {
    position: "absolute",
    top: "-60px",
    left: "-40px",
    width: "220px",
    height: "220px",
    borderRadius: "999px",
    background: "rgba(236, 72, 153, 0.12)",
  },
  bgCircle2: {
    position: "absolute",
    top: "120px",
    right: "-70px",
    width: "240px",
    height: "240px",
    borderRadius: "999px",
    background: "rgba(59, 130, 246, 0.12)",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  kicker: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    marginBottom: "12px",
  },
  title: {
    fontSize: "36px",
    fontWeight: 800,
    margin: 0,
    color: "#1f2340",
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#5b6285",
    fontSize: "15px",
    fontWeight: 700,
  },
  card: {
    background: "linear-gradient(180deg, #ffffff 0%, #fffafb 100%)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 14px 30px rgba(91, 98, 133, 0.10)",
  },
  text: {
    margin: 0,
    color: "#1f2340",
    fontWeight: 700,
    fontSize: "18px",
  },
  subText: {
    margin: "12px 0 0",
    color: "#5b6285",
  },
  primaryButton: {
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(99, 102, 241, 0.24)",
  },
  secondaryButton: {
    display: "inline-block",
    background: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
    color: "#9a3412",
    textDecoration: "none",
    padding: "12px 16px",
    borderRadius: "12px",
    fontWeight: 800,
    boxShadow: "0 8px 18px rgba(251, 146, 60, 0.18)",
  },
};
