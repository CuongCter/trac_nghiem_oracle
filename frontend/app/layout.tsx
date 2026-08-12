import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import "dayjs/locale/vi";
import { antdTheme } from "@/styles/antd-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Thi Trắc Nghiệm",
  description:
    "Hệ thống quản lý thi trắc nghiệm trực tuyến — hỗ trợ Admin, Giáo viên và Học viên.",
  applicationName: "Trac Nghiem",
  authors: [{ name: "Trac Nghiem Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fffaf5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <AntdRegistry>
          <ConfigProvider theme={antdTheme} locale={viVN}>
            <App>{children}</App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
