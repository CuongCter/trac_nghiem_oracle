"use client";

import * as React from "react";
import { Select as AntdSelect, InputNumber as AntdInputNumber } from "antd";
import type { SelectProps, TreeSelectProps, MultiSelectProps, InputNumberProps } from "antd";

export const Select = AntdSelect;

export const MultiSelect: React.FC<MultiSelectProps> = (props) => (
  <AntdSelect mode="multiple" allowClear {...props} />
);

export const TreeSelect: React.FC<TreeSelectProps> = (props) => (
  <AntdSelect.TreeSelect allowClear {...props} />
);

export const InputNumber: React.FC<InputNumberProps> = (props) => (
  <AntdInputNumber {...props} />
);
