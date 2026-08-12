"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { AlertCircle, Wifi, WifiOff, ShieldAlert } from "lucide-react";
import { formatTime } from "@/lib/format";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTeacherAlerts, type ViolationEvent } from "@/hooks/useTeacherAlerts";
import { ROLES } from "@/lib/constants";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TeacherAlertsPage() {
  const { connected, lastViolation } = useTeacherAlerts({});
  const [events, setEvents] = useState<ViolationEvent[]>([]);

  useEffect(() => {
    if (!lastViolation) return;
    setEvents((prev) => [lastViolation, ...prev].slice(0, 50));
  }, [lastViolation]);

  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN, ROLES.TEACHER]}>
      <AppShellWrapper role={ROLES.TEACHER}>
        <PageHeader
          eyebrow="Giám sát"
          title="Cảnh báo gian lận (Real-time)"
          description="Hiển thị các vi phạm được phát hiện trong quá trình thi."
          actions={
            <Badge
              variant={connected ? "success" : "gray"}
              leftIcon={connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            >
              {connected ? "Đang kết nối" : "Mất kết nối"}
            </Badge>
          }
        />

        <div className="mt-6">
          {!connected ? (
            <Card variant="default" padding="md">
              <div className="flex items-center gap-3">
                <Spinner size="sm" />
                <span>Đang kết nối tới máy chủ thời gian thực...</span>
              </div>
            </Card>
          ) : events.length === 0 ? (
            <EmptyState
              title="Chưa có cảnh báo"
              description="Hệ thống sẽ hiển thị tại đây khi học viên vi phạm quy chế."
            />
          ) : (
            <div className="space-y-3">
              {events.map((e, idx) => (
                <Card key={`${e.attemptId}-${e.ts}-${idx}`} variant="default" padding="md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-border-danger bg-danger-softer text-fg-danger">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-small font-medium text-heading">
                          {e.studentName ?? e.studentId}
                        </p>
                        <p className="text-tiny text-body-subtle">
                          Loại: <b>{e.type}</b>
                        </p>
                      </div>
                    </div>
                    <div className="text-small text-body-subtle">{formatTime(e.ts)}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AppShellWrapper>
    </AuthGuard>
  );
}
