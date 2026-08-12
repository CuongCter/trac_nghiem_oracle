"use client";

import * as React from "react";
import { Modal as AntdModal } from "antd";
import type { ModalProps } from "antd";

/**
 * AntD Modal pre-wired to use our hand-drawn theme tokens.
 */
export const Modal: React.FC<ModalProps> = (props) => (
  <AntdModal centered destroyOnClose {...props} />
);
