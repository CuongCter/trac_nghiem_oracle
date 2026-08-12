"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { MAX_TAB_SWITCH } from "@/lib/constants";

interface TabSwitchGuardProps {
  count: number;
  remaining: number;
}

export function TabSwitchGuardNotice({ count, remaining }: TabSwitchGuardProps) {
  if (count === 0) return null;
  if (remaining > 0) {
    return (
      <Alert variant="warning" icon={<AlertTriangle className="h-5 w-5" />}>
        Bạn đã rời tab <b>{count}</b> lần. Còn <b>{remaining}</b> lần trước khi hệ thống tự
        động nộp bài.
      </Alert>
    );
  }
  return (
    <Alert
      variant="danger"
      title="Đã đạt giới hạn rời tab"
      icon={<AlertTriangle className="h-5 w-5" />}
    >
      Bạn đã rời tab {count} lần (tối đa {MAX_TAB_SWITCH}). Hệ thống sẽ tự động nộp bài.
    </Alert>
  );
}
