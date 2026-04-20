"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AuthUserInfo = {
  id: string;
  name: string;
  email: string | null;
};

export function useAuthUser() {
  const [userInfo, setUserInfo] = useState<AuthUserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      setLoadingUser(true);

      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !data.user) {
        setUserInfo(null);
        setLoadingUser(false);
        return;
      }

      const user = data.user;
      const displayName =
        (user.user_metadata?.name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "ユーザー";

      setUserInfo({
        id: user.id,
        name: displayName,
        email: user.email ?? null,
      });
      setLoadingUser(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { userInfo, loadingUser };
}
