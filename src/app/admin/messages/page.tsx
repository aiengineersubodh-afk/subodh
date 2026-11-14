"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminMessagesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?section=messages");
  }, [router]);
  return <div className="p-16 text-center text-sm text-[#666666]">Opening Contact Messages...</div>;
}

