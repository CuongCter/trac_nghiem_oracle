"use client";

import * as React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { ExamDoing } from "@/components/exam/ExamDoing";
import { ROLES } from "@/lib/constants";

export default function ExamDoingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <AuthGuard allowedRoles={[ROLES.STUDENT]}>
      <AppShellWrapper role={ROLES.STUDENT}>
        <ExamDoing examId={id} />
      </AppShellWrapper>
    </AuthGuard>
  );
}
