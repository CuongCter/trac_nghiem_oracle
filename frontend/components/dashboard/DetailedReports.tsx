"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { formatScore, formatDateTime } from "@/lib/format";
import type { ColumnsType } from "antd/es/table";

interface ExamStat {
  examId: string;
  examTitle: string;
  totalStudents: number;
  submitted: number;
  notSubmitted: number;
  average: number;
  highest: number;
  lowest: number;
  passRate: number;
}

interface StudentStat {
  studentId: string;
  studentName: string;
  email: string;
  attempts: number;
  average: number;
  passRate: number;
}

interface ClassStat {
  classId: string;
  className: string;
  students: number;
  attempts: number;
  average: number;
}

type Tab = "exam" | "student" | "class";

export function DetailedReports() {
  const [tab, setTab] = React.useState<Tab>("exam");
  const [examStats, setExamStats] = React.useState<ExamStat[] | null>(null);
  const [studentStats, setStudentStats] = React.useState<StudentStat[] | null>(null);
  const [classStats, setClassStats] = React.useState<ClassStat[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchData = React.useCallback(async (which: Tab) => {
    setLoading(true);
    try {
      if (which === "exam") {
        const res = (await api.get("/reports/exams")) as ExamStat[];
        setExamStats(res);
      } else if (which === "student") {
        const res = (await api.get("/reports/students")) as StudentStat[];
        setStudentStats(res);
      } else {
        const res = (await api.get("/reports/classes")) as ClassStat[];
        setClassStats(res);
      }
    } catch {
      if (which === "exam") setExamStats([]);
      else if (which === "student") setStudentStats([]);
      else setClassStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchData(tab);
  }, [tab, fetchData]);

  const examColumns: ColumnsType<ExamStat> = [
    { title: "Đề thi", dataIndex: "examTitle", key: "examTitle" },
    {
      title: "Đã nộp",
      key: "submitted",
      width: 120,
      align: "center",
      render: (_, r) => `${r.submitted}/${r.totalStudents}`,
    },
    {
      title: "Điểm TB",
      dataIndex: "average",
      key: "average",
      width: 120,
      align: "center",
      render: (n: number) => formatScore(n),
    },
    {
      title: "Cao nhất",
      dataIndex: "highest",
      key: "highest",
      width: 120,
      align: "center",
      render: (n: number) => n?.toFixed?.(2) ?? "—",
    },
    {
      title: "Thấp nhất",
      dataIndex: "lowest",
      key: "lowest",
      width: 120,
      align: "center",
      render: (n: number) => n?.toFixed?.(2) ?? "—",
    },
    {
      title: "Tỷ lệ đạt",
      dataIndex: "passRate",
      key: "passRate",
      width: 140,
      align: "center",
      render: (n: number) => (
        <Badge variant={n >= 50 ? "success" : "warning"}>
          {n?.toFixed?.(0) ?? "0"}%
        </Badge>
      ),
    },
  ];

  const studentColumns: ColumnsType<StudentStat> = [
    { title: "Học viên", dataIndex: "studentName", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Số lượt thi",
      dataIndex: "attempts",
      key: "attempts",
      width: 120,
      align: "center",
    },
    {
      title: "Điểm TB",
      dataIndex: "average",
      key: "average",
      width: 120,
      align: "center",
      render: (n: number) => formatScore(n),
    },
    {
      title: "Tỷ lệ đạt",
      dataIndex: "passRate",
      key: "passRate",
      width: 140,
      align: "center",
      render: (n: number) => (
        <Badge variant={n >= 50 ? "success" : "warning"}>
          {n?.toFixed?.(0) ?? "0"}%
        </Badge>
      ),
    },
  ];

  const classColumns: ColumnsType<ClassStat> = [
    { title: "Lớp", dataIndex: "className", key: "name" },
    {
      title: "Học viên",
      dataIndex: "students",
      key: "students",
      width: 120,
      align: "center",
    },
    {
      title: "Lượt thi",
      dataIndex: "attempts",
      key: "attempts",
      width: 120,
      align: "center",
    },
    {
      title: "Điểm TB",
      dataIndex: "average",
      key: "average",
      width: 140,
      align: "center",
      render: (n: number) => formatScore(n),
    },
  ];

  return (
    <Card variant="default" padding="md">
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { key: "exam", label: "Theo đề thi" },
            { key: "student", label: "Theo học viên" },
            { key: "class", label: "Theo lớp" },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-pill border-2 px-5 py-2 text-small font-medium transition-transform ${
              tab === t.key
                ? "border-border-dark bg-brand text-white shadow-pencil-xs"
                : "border-border-default bg-neutral-primary-medium text-body hover:-translate-x-px hover:-translate-y-px hover:shadow-pencil-xs"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" label="Đang tải thống kê..." />
        </div>
      ) : tab === "exam" ? (
        examStats && examStats.length > 0 ? (
          <Table<ExamStat>
            rowKey="examId"
            columns={examColumns}
            dataSource={examStats}
            pagination={false}
          />
        ) : (
          <EmptyState title="Chưa có dữ liệu thống kê" />
        )
      ) : tab === "student" ? (
        studentStats && studentStats.length > 0 ? (
          <Table<StudentStat>
            rowKey="studentId"
            columns={studentColumns}
            dataSource={studentStats}
            pagination={false}
          />
        ) : (
          <EmptyState title="Chưa có dữ liệu thống kê" />
        )
      ) : classStats && classStats.length > 0 ? (
        <Table<ClassStat>
          rowKey="classId"
          columns={classColumns}
          dataSource={classStats}
          pagination={false}
        />
      ) : (
        <EmptyState title="Chưa có dữ liệu thống kê" />
      )}
    </Card>
  );
}
