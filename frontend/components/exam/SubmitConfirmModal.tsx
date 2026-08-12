"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

interface SubmitConfirmModalProps {
  open: boolean;
  answered: number;
  total: number;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SubmitConfirmModal({
  open,
  answered,
  total,
  loading,
  onCancel,
  onConfirm,
}: SubmitConfirmModalProps) {
  const unanswered = total - answered;
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title="Xác nhận nộp bài"
      width={440}
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border-brand-subtle bg-brand-softer text-fg-brand-strong">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="text-body text-heading">
          Bạn đã làm <b>{answered}</b> / {total} câu.
        </p>
        {unanswered > 0 ? (
          <p className="text-small text-body-subtle">
            Còn <b className="text-fg-warning">{unanswered}</b> câu chưa làm.
          </p>
        ) : (
          <p className="text-small text-fg-success">Đã hoàn thành tất cả các câu.</p>
        )}
        <p className="text-small text-body-subtle">Bạn có chắc muốn nộp bài?</p>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Tiếp tục làm
        </Button>
        <Button variant="brand" onClick={onConfirm} loading={loading}>
          Nộp bài
        </Button>
      </div>
    </Modal>
  );
}
