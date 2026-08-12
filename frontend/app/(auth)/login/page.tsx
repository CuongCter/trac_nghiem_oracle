import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Đăng nhập — Trac Nghiem",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Decorative panel — hidden on mobile */}
      <aside className="relative hidden overflow-hidden border-r-2 border-dashed border-border-default bg-neutral-primary-medium lg:flex">
        <div className="relative m-auto max-w-md p-12 text-center">
          <p className="mb-4 inline-block rounded-pill border-2 border-dashed border-border-brand-subtle bg-brand-softer px-4 py-1 text-tiny font-medium uppercase tracking-wider text-fg-brand-strong">
            Trac Nghiem
          </p>
          <h1 className="mb-4 font-handrawn text-display-2 leading-tight text-heading">
            Học tập, luyện thi, vượt qua mọi kỳ thi trắc nghiệm.
          </h1>
          <p className="mx-auto max-w-sm text-body text-body-subtle">
            Hệ thống quản lý thi trắc nghiệm dành cho Admin, Giáo viên và Học viên với giao diện thân thiện,
            dễ sử dụng và chống gian lận hiệu quả.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-small text-body-subtle">
            <span className="rounded-pill border-2 border-dashed border-border-default bg-neutral-primary-soft px-3 py-1 shadow-pencil-xs">
              Quản lý câu hỏi
            </span>
            <span className="rounded-pill border-2 border-dashed border-border-default bg-neutral-primary-soft px-3 py-1 shadow-pencil-xs">
              Tạo đề thi tự động
            </span>
            <span className="rounded-pill border-2 border-dashed border-border-default bg-neutral-primary-soft px-3 py-1 shadow-pencil-xs">
              Làm bài &amp; chấm điểm
            </span>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="font-handrawn text-display-3 text-heading">Chào mừng trở lại</h2>
            <p className="mt-2 text-body text-body-subtle">
              Đăng nhập để tiếp tục sử dụng hệ thống.
            </p>
          </div>
          <Card variant="default" padding="lg">
            <LoginForm />
          </Card>
        </div>
      </main>
    </div>
  );
}
