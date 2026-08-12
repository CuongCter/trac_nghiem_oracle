"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { ExamResult } from "@/types/result";
import type { ApiError } from "@/types/api";
import type { ColumnsType } from "antd/es/table";

export default function StudentResultsPage() {
  const [data, setData] = React.useState<ExamResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = (await api.get("/student/results")) as ExamResult[];
        setData(res);
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message ?? "Không thể tải kết quả");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: ColumnsType<ExamResult> = [
    {
      title: "Bài thi",
      dataIndex: "examTitle",
      key: "examTitle",
      render: (t?: string) => t || "—",
    },
    {
      title: "Nộp lúc",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 200,
      render: (d: string) => (
        <span className="inline-flex items-center gap-1 text-small">
          <Calendar className="h-3.5 w-3.5 text-body-subtle" /> {formatDateTime(d)}
        </span>
      ),
    },
    {
      title: "Số câu đúng",
      key: "correct",
      width: 140,
      align: "center",
      render: (_, r) => `${r.totalCorrect}/${r.totalCorrect + r.totalWrong}`,
    },
    {
      title: "Điểm",
      dataIndex: "score",
      key: "score",
      width: 100,
      align: "center",
      render: (s: number) => (
        <span className="font-handrawn text-display-6 text-heading">
          {s?.toFixed?.(2) ?? "0.00"}
        </span>
      ),
    },
    {
      title: "Kết quả",
      key: "passed",
      width: 140,
      render: (_, r) =>
        r.passed ? (
          <Badge variant="success" leftIcon={<CheckCircle2 className="h-3 w-3" />}>
            Đạt
          </Badge>
        ) : (
          <Badge variant="danger" leftIcon={<XCircle className="h-3 w-3" />}>
            Chưa đạt
          </Badge>
        ),
    },
    {
      title: "Chi tiết",
      key: "actions",
      width: 140,
      align: "right",
      render: (_, r) => (
        <Link href={`/student/results/${r._id}`} className="no-underline">
          <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
            Xem
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={[ROLES.STUDENT]}>
      <AppShellWrapper role={ROLES.STUDENT}>
        <PageHeader
          eyebrow="Kết quả"
          title="Lịch sử bài thi"
          description="Xem điểm và chi tiết các bài thi đã hoàn thành."
        />

        <Card variant="default" padding="md" className="mt-6">
          {error ? (
            <ErrorState description={error} />
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" label="Đang tải..." />
            </div>
          ) : data.length === 0 ? (
            <EmptyState
              title="Chưa có kết quả nào"
              description="Hoàn thành bài thi để xem kết quả tại đây."
            />
          ) : (
            <Table<ExamResult>
              rowKey="_id"
              columns={columns}
              dataSource={data}
              pagination={false}
            />
          )}
        </Card>
      </AppShellWrapper>
    </AuthGuard>
  );
}
