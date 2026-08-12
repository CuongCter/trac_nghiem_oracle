"use client";

import * as React from "react";
import { Pagination as AntdPagination } from "antd";
import type { PaginationProps } from "antd";

export const Pagination: React.FC<PaginationProps> = (props) => (
  <AntdPagination
    showSizeChanger
    showTotal={(total, range) => `${range[0]}-${range[1]} / ${total} mục`}
    {...props}
  />
);
