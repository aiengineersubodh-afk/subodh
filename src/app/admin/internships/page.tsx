"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminInternshipsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?section=internships");
  }, [router]);
  return <div className="p-16 text-center text-sm text-[#666666]">Opening Internships...</div>;
}

