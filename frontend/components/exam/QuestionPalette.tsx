"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { OptionLabel } from "@/lib/constants";

export interface QuestionPaletteItem {
  id: string;
  index: number;
  answered: boolean;
  current: boolean;
}

interface QuestionPaletteProps {
  items: QuestionPaletteItem[];
  onJump: (id: string) => void;
}

export function QuestionPalette({ items, onJump }: QuestionPaletteProps) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
      {items.map((item) => {
        const isAnswered = item.answered;
        const isCurrent = item.current;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onJump(item.id)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-pill border-2 text-small font-medium transition-transform",
              isCurrent
                ? "border-border-dark bg-brand text-white shadow-pencil-sm ring-4 ring-brand-soft"
                : isAnswered
                  ? "border-border-brand-subtle bg-brand-soft text-fg-brand-strong"
                  : "border-border-default bg-neutral-primary-soft text-body-subtle",
              "hover:-translate-x-px hover:-translate-y-px hover:shadow-pencil-xs",
            )}
            aria-label={`Câu ${item.index + 1}${isAnswered ? " (đã làm)" : " (chưa làm)"}`}
          >
            {item.index + 1}
          </button>
        );
      })}
    </div>
  );
}

export interface ExamQuestionView {
  _id: string;
  content: string;
  options: { label: OptionLabel; text: string }[];
}

interface QuestionCardProps {
  question: ExamQuestionView;
  index: number;
  total: number;
  selected?: OptionLabel | null;
  onSelect: (opt: OptionLabel) => void;
  questionRef?: React.RefObject<HTMLDivElement>;
}

export function QuestionCard({
  question,
  index,
  total,
  selected,
  onSelect,
  questionRef,
}: QuestionCardProps) {
  return (
    <Card
      ref={questionRef as React.RefObject<HTMLDivElement>}
      variant="default"
      padding="lg"
      className="mb-4 scroll-mt-24"
    >
      <div className="mb-3 flex items-center gap-2 text-tiny uppercase tracking-wider text-body-subtle">
        <span>Câu {index + 1}</span>
        <span>/</span>
        <span>{total}</span>
      </div>
      <h3 className="mb-5 text-body font-medium text-heading">{question.content}</h3>
      <div className="flex flex-col gap-3">
        {question.options.map((opt) => {
          const isSelected = selected === opt.label;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onSelect(opt.label)}
              className={cn(
                "flex w-full items-start gap-3 rounded-card border-2 px-4 py-3 text-left transition-transform",
                isSelected
                  ? "border-border-dark bg-brand-soft shadow-pencil-sm"
                  : "border-border-default bg-neutral-primary-soft hover:-translate-x-px hover:-translate-y-px hover:shadow-pencil-xs",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-small font-medium",
                  isSelected
                    ? "border-border-dark bg-brand text-white"
                    : "border-border-default-medium bg-neutral-primary-medium text-body",
                )}
              >
                {opt.label}
              </span>
              <span
                className={cn(
                  "text-body",
                  isSelected ? "text-heading font-medium" : "text-body",
                )}
              >
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

import { Card } from "@/components/ui/Card";
