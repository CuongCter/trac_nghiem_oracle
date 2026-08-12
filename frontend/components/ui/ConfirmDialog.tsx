"use client";

import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "brand" | "danger";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  trigger?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "brand",
  loading,
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger> : null}
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-dark/50 backdrop-blur-sm",
            "data-[state=open]:animate-fade-in",
          )}
        />
        <AlertDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(28rem,90vw)] -translate-x-1/2 -translate-y-1/2",
            "rounded-card border-2 border-dashed border-dark bg-neutral-primary-medium p-6",
            "shadow-pencil-xl",
            "data-[state=open]:animate-scale-in",
          )}
        >
          <AlertDialog.Title className="mb-2 font-handrawn text-display-6 text-heading">
            {title}
          </AlertDialog.Title>
          {description ? (
            <AlertDialog.Description className="mb-6 text-body text-body-subtle">
              {description}
            </AlertDialog.Description>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" size="sm">
                {cancelText}
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant={variant === "danger" ? "danger" : "brand"}
              size="sm"
              loading={loading}
              onClick={(e) => {
                e.preventDefault();
                void onConfirm();
              }}
            >
              {confirmText}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
