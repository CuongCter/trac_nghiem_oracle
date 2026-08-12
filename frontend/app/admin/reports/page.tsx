"use client";

import * as React from "react";
import { Users, BookOpen, ClipboardList, Activity, TrendingUp, Award } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { IconShape } from "@/components/ui/IconShape";
import { Spinner } from "@/components/ui/Spinner";
import {
  ChartCard,
  BarSeriesChart,
  LineSeriesChart,
  PieSeriesChart,
} from "@/components/dashboard/Charts";
import { DetailedReports } from "@/components/dashboard/DetailedReports";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";

interface DashboardSummary {
  totalUsers?: number;
  totalSubjects?: number;
  totalExams?: number;
  totalAttempts?: number;
  averageScore?: number;
  passRate?: number;
  monthlyAttempts?: Array<{ label: string; value: number }>;
  monthlyAvgScore?: Array<{ label: string; value: number }>;
  passVsFail?: Array<{ name: string; value: number }>;
}

function StatTile({
  icon,
  label,
  value,
  variant = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  variant?: "brand" | "success" | "warning" | "gray";
}) {
  return (
    <Card variant="default" padding="md">
      <div className="flex items-center gap-4">
        <IconShape icon={icon} variant={variant} size="lg" />
        <div>
          <p className="text-tiny uppercase tracking-wider text-body-subtle">{label}</p>
          <p className="font-handrawn text-display-4 text-heading">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default function AdminReportsPage() {
  const [data, setData] = React.useState<DashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = (await api.get("/reports/dashboard")) as DashboardSummary;
        setData(res);
      } catch {
        setData({
          totalUsers: 0,
          totalSubjects: 0,
          totalExams: 0,
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0,
          monthlyAttempts: [],
          monthlyAvgScore: [],
          passVsFail: [
            { name: "Đạt", value: 0 },
            { name: "Chưa đạt", value: 0 },
          ],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN]}>
      <AppShellWrapper role={ROLES.ADMIN}>
        <PageHeader
          eyebrow="Báo cáo"
          title="Tổng quan hệ thống"
          description="Các chỉ số quan trọng của hệ thống thi trắc nghiệm."
        />

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Spinner size="lg" label="Đang tải thống kê..." />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatTile
                icon={<Users className="h-6 w-6" />}
                label="Người dùng"
                value={data?.totalUsers ?? 0}
                variant="brand"
              />
              <StatTile
                icon={<BookOpen className="h-6 w-6" />}
                label="Môn học"
                value={data?.totalSubjects ?? 0}
                variant="warning"
              />
              <StatTile
                icon={<ClipboardList className="h-6 w-6" />}
                label="Đề thi"
                value={data?.totalExams ?? 0}
                variant="success"
              />
              <StatTile
                icon={<Activity className="h-6 w-6" />}
                label="Lượt thi"
                value={data?.totalAttempts ?? 0}
                variant="gray"
              />
              <StatTile
                icon={<Award className="h-6 w-6" />}
                label="Điểm TB"
                value={data?.averageScore?.toFixed?.(2) ?? "0.00"}
                variant="brand"
              />
              <StatTile
                icon={<TrendingUp className="h-6 w-6" />}
                label="Tỷ lệ đạt"
                value={`${data?.passRate?.toFixed?.(0) ?? "0"}%`}
                variant="success"
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard
                title="Lượt thi theo tháng"
                description="Số lượt nộp bài trong 6 tháng gần nhất"
              >
                <BarSeriesChart data={data?.monthlyAttempts ?? []} />
              </ChartCard>
              <ChartCard
                title="Điểm trung bình theo tháng"
                description="Điểm trung bình hệ thống trong 6 tháng gần nhất"
              >
                <LineSeriesChart data={data?.monthlyAvgScore ?? []} />
              </ChartCard>
              <ChartCard
                title="Tỷ lệ đậu / rớt"
                description="Tổng kết toàn hệ thống"
              >
                <PieSeriesChart
                  data={data?.passVsFail ?? [
                    { name: "Đạt", value: 0 },
                    { name: "Chưa đạt", value: 0 },
                  ]}
                />
              </ChartCard>
            </div>

            <div className="mt-6">
              <h2 className="mb-3 font-handrawn text-display-5 text-heading">Thống kê chi tiết</h2>
              <DetailedReports />
            </div>
          </>
        )}
      </AppShellWrapper>
    </AuthGuard>
  );
}
