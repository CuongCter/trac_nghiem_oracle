"use client";

import * as React from "react";
import { Steps as AntdSteps } from "antd";
import type { StepProps, StepsProps } from "antd";

export const Steps: React.FC<StepsProps> = (props) => (
  <AntdSteps size="small" {...props} />
);

export const Step: React.FC<StepProps> = (props) => <AntdSteps.Step {...props} />;
