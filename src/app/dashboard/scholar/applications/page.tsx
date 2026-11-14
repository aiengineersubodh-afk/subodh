"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScholarApplicationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/scholar?tab=applications");
  }, [router]);
  return (
    <div className="p-16 text-center text-sm text-[#666666]">
      Opening Scholar Applications...
    </div>
  );
}

