"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { EXAM_STATUS, type ExamStatus } from "@/lib/constants";

const labelMap: Record<ExamStatus, string> = {
  [EXAM_STATUS.DRAFT]: "Bản nháp",
  [EXAM_STATUS.PUBLISHED]: "Đã xuất bản",
  [EXAM_STATUS.CLOSED]: "Đã đóng",
};

const variantMap: Record<ExamStatus, "gray" | "success" | "warning"> = {
  [EXAM_STATUS.DRAFT]: "gray",
  [EXAM_STATUS.PUBLISHED]: "success",
  [EXAM_STATUS.CLOSED]: "warning",
};

export function ExamStatusBadge({ status }: { status: ExamStatus }) {
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}
