"use client";

import * as React from "react";
import { ConfigProvider, Table as AntdTable } from "antd";
import type { TableProps } from "antd";

/**
 * AntD Table wrapped with our hand-drawn token defaults.
 * All AntD theming comes from styles/antd-theme.ts + styles/antd-overrides.css.
 */
export const Table = <T extends object>(props: TableProps<T>) => (
  <ConfigProvider>
    <AntdTable<T> scroll={{ x: "max-content" }} {...props} />
  </ConfigProvider>
);
