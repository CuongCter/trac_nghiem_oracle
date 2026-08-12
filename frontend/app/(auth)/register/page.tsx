import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Đăng ký — Trac Nghiem",
};

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r-2 border-dashed border-border-default bg-neutral-primary-medium lg:flex">
        <div className="relative m-auto max-w-md p-12 text-center">
          <p className="mb-4 inline-block rounded-pill border-2 border-dashed border-border-brand-subtle bg-brand-softer px-4 py-1 text-tiny font-medium uppercase tracking-wider text-fg-brand-strong">
            Tạo tài khoản
          </p>
          <h1 className="mb-4 font-handrawn text-display-2 leading-tight text-heading">
            Tham gia cùng hàng nghìn học viên đang luyện thi mỗi ngày.
          </h1>
          <p className="mx-auto max-w-sm text-body text-body-subtle">
            Tài khoản mới sẽ mặc định là Học viên. Nếu bạn là giáo viên hoặc quản trị viên, hãy liên hệ Admin để được nâng cấp quyền.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="font-handrawn text-display-3 text-heading">Tạo tài khoản mới</h2>
            <p className="mt-2 text-body text-body-subtle">
              Chỉ mất chưa đầy một phút.
            </p>
          </div>
          <Card variant="default" padding="lg">
            <RegisterForm />
          </Card>
        </div>
      </main>
    </div>
  );
}
