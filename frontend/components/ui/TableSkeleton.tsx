"use client";

import * as React from "react";
import { Skeleton } from "antd";
import { Card } from "./Card";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <Card variant="default" padding="md">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton.Input
                key={c}
                active
                size="default"
                style={{ flex: 1, height: 24 }}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
