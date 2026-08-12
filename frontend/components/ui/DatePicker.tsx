"use client";

import * as React from "react";
import { DatePicker as AntdDatePicker } from "antd";
import type { DatePickerProps, RangePickerProps } from "antd";

export const DatePicker: React.FC<DatePickerProps> = (props) => (
  <AntdDatePicker format="DD/MM/YYYY HH:mm" showTime {...props} />
);

export const DateRangePicker: React.FC<RangePickerProps> = (props) => (
  <AntdDatePicker.RangePicker
    format="DD/MM/YYYY HH:mm"
    showTime={{ format: "HH:mm" }}
    {...props}
  />
);
