"use client";

import * as React from "react";
import { Progress as AntdProgress } from "antd";
import type { ProgressProps } from "antd";

export const Progress: React.FC<ProgressProps> = (props) => (
  <AntdProgress strokeColor="#1dad97" trailColor="#f4eddf" {...props} />
);
