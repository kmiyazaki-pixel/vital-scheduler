"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useState } from "react";

const TUNAG_APP_URL =
  process.env.NEXT_PUBLIC_TUNAG_APP_URL || "https://tunag.vercel.app";

const SIDEBAR_WIDTH = 240;
const SIDEBAR_ITEM_WIDTH = 220;

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
      <style jsx>{`
        @media (max-width: 959px) {
          .scheduler-sidebar-mobile {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            width: 82vw !important;
            min-width: 82vw !important;
            max-width: 82vw !important;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            z-index: 40;
          }

          .scheduler-main-mobile {
            padding: 16px !important;
          }

          .scheduler-menu-button {
            display: inline-flex !important;
          }
        }

        @media (min-width: 960px) {
          .scheduler-menu-button {
            display: none !important;
          }
        }
      `}</style>

      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />
      <div style={styles.bgCircle3} />

      {menuOpen && (
        <div style={styles.overlay} onClick={() => setMenuOpen(false)} />
      )}

      <div
        className="scheduler-sidebar-mobile"
        style={{
          ...styles.sidebarWrap,
          ...(menuOpen ? styles.sidebarWrapOpen : {}),
        }}
      >
        <aside style={styles.sidebar}>
          <div>
            <div style={styles.kicker}>SCHEDULER</div>
            <div style={styles.brand}>VitalArea Scheduler</div>

            <div style={styles.userChip}>
              ログイン中: {userInfo?.name || userInfo?.email || "ユーザー"}
            </div>

            <nav style={styles.nav}>
              <Link
                href="/calendar/month"
                style={styles.navLinkBlue}
                onClick={() => setMenuOpen(false)}
              >
                月表示
              </Link>

              <Link
                href="/calendar/week"
                style={styles.navLinkPink}
                onClick={() => setMenuOpen(false)}
              >
                週表示
              </Link>

              <Link
                href="/admin/audit-logs"
                style={styles.navLinkGreen}
                onClick={() => setMenuOpen(false)}
              >
                監査ログ
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  location.href = TUNAG_APP_URL;
                }}
                style={styles.navLinkOrange}
              >
                Tunagへ戻る
              </button>
            </nav>
          </div>

          <button onClick={logout} style={styles.logout}>
            ログアウト
          </button>
        </aside>
      </div>

      <main className="scheduler-main-mobile" style={styles.main}>
        <div style={styles.header}>
          <button
            onClick={() => setMenuOpen(true)}
            className="scheduler-menu-button"
            style={styles.menuBtn}
          >
            ☰
          </button>
          <h1 style={styles.headerTitle}>{title}</h1>
        </div>

        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const baseNavButton: React.CSSProperties = {
  display: "block",
  width: SIDEBAR_ITEM_WIDTH,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "left",
  textDecoration: "none",
  border: "none",
  padding: "12px 14px",
  borderRadius: 12,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(91, 98, 133, 0.08)",
  fontSize: "15px",
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "linear-gradient(180deg, #f8f7ff 0%, #eef4ff 100%)",
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
  bgCircle3: {
    position: "absolute",
    bottom: "-80px",
    left: "35%",
    width: "260px",
    height: "260px",
    borderRadius: "999px",
    background: "rgba(34, 197, 94, 0.12)",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 20,
  },
  sidebarWrap: {
    position: "relative",
    zIndex: 30,
  },
  sidebarWrapOpen: {
    transform: "translateX(0)",
  },
  sidebar: {
  width: SIDEBAR_WIDTH,
  minWidth: SIDEBAR_WIDTH,
  minHeight: "100vh",
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(10px)",
  borderRight: "1px solid rgba(0,0,0,0.06)",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 20,
},
  main: {
    flex: 1,
    minWidth: 0,
    padding: 24,
    width: "100%",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: "#1f2340",
  },
  menuBtn: {
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(99,102,241,0.16)",
    borderRadius: "12px",
    background: "#fff",
    width: "44px",
    height: "44px",
    cursor: "pointer",
    fontSize: "22px",
    fontWeight: 800,
  },
  content: {
    background: "linear-gradient(180deg, #ffffff 0%, #fffafb 100%)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 14px 30px rgba(91, 98, 133, 0.10)",
    minHeight: "calc(100vh - 120px)",
    overflow: "hidden",
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
  brand: {
    fontSize: 20,
    fontWeight: 800,
    color: "#1f2340",
    marginBottom: 12,
  },
  userChip: {
    width: SIDEBAR_ITEM_WIDTH,
    maxWidth: "100%",
    boxSizing: "border-box",
    background: "linear-gradient(135deg, #ecfdf3 0%, #d1fae5 100%)",
    color: "#166534",
    padding: "10px 14px",
    borderRadius: "12px",
    fontWeight: 800,
    boxShadow: "0 8px 18px rgba(16, 185, 129, 0.12)",
    marginBottom: 18,
  },
  nav: {
    display: "grid",
    gap: 10,
    width: "100%",
  },
  navLinkBlue: {
    ...baseNavButton,
    color: "#1d4ed8",
    background: "linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%)",
  },
  navLinkPink: {
    ...baseNavButton,
    color: "#be185d",
    background: "linear-gradient(135deg, #fff0f5 0%, #ffe4ef 100%)",
  },
  navLinkGreen: {
    ...baseNavButton,
    color: "#166534",
    background: "linear-gradient(135deg, #ecfdf3 0%, #d1fae5 100%)",
  },
  navLinkOrange: {
    ...baseNavButton,
    color: "#9a3412",
    background: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
  },
  logout: {
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    color: "#fff",
    padding: "12px 14px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 8px 18px rgba(99, 102, 241, 0.22)",
  },
};
