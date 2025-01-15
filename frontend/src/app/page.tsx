"use client";

import { useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "@/context/UserContext";

export default function Page() {
  const router = useRouter();
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user) {
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [user, router]);

  return null;
}
