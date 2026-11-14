"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentApplicationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/student?tab=applications");
  }, [router]);
  return (
    <div className="p-16 text-center text-sm text-[#666666]">
      Opening My Applications...
    </div>
  );
}

