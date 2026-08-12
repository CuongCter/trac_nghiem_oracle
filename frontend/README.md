# Frontend — Hệ thống Quản lý Thi Trắc Nghiệm

> Next.js (App Router) + TypeScript + Ant Design + Tailwind CSS. Giao diện web cho 3 vai trò: Admin, Teacher, Student.

Tài liệu chi tiết: [`../docs/03-ke-hoach-frontend.md`](../docs/03-ke-hoach-frontend.md).
Tài liệu tổng quan: [`../docs/00-tong-quan-va-cong-nghe.md`](../docs/00-tong-quan-va-cong-nghe.md).

---

## 1. Công nghệ

- **Next.js 14+** (App Router), **React 18**, **TypeScript 5**.
- **Ant Design 5** (bộ component chính) + `@ant-design/nextjs-registry` (tương thích App Router).
- **Tailwind CSS 3** (utility CSS, tắt preflight để không xung đột AntD).
- **Axios** gọi REST API, **Zustand** quản lý state auth/exam.
- **React Hook Form + Zod** validate form.
- **Day.js** xử lý thời gian, đếm ngược.
- (Giai đoạn 3) **Recharts** vẽ biểu đồ, **xlsx** export Excel.

---

## 2. Yêu cầu môi trường

- Node.js >= 18 (khuyến nghị 20 LTS).
- npm >= 9.
- Backend đang chạy (mặc định ở `http://localhost:5000`).

---

## 3. Cài đặt

```bash
cd frontend
cp .env.example .env.local
# Mặc định:
#   NEXT_PUBLIC_API_URL=http://localhost:5000/api

npm install
```

---

## 4. Chạy dự án

```bash
# Dev (hot reload)
npm run dev
# → http://localhost:3000

# Production
npm run build
npm start
```

Lần đầu truy cập sẽ tự chuyển về `/login`.

---

## 5. Cấu trúc thư mục

```
frontend/
├── app/
│   ├── (auth)/          # login, register
│   ├── admin/           # users, subjects, classes, exams, reports
│   ├── teacher/         # questions, exams, reports
│   ├── student/         # exams, results
│   ├── dashboard/
│   ├── profile/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── auth/            # AuthGuard, LoginForm, RegisterForm
│   ├── layout/          # AdminLayout, TeacherLayout, StudentLayout, AppHeader, AppSidebar
│   ├── exam/            # ExamForm, QuestionForm, ExamDoing, ExamCountdown, useTabSwitch, ...
│   ├── common/          # DataTable, LoadingState, EmptyState, ErrorState
│   └── result/
├── lib/                 # api (axios), auth, format, storage, constants
├── stores/              # authStore, examStore (Zustand)
├── hooks/               # useAuth, useCountdown, useTabSwitch, useAutoSave
├── types/               # user, subject, question, exam, attempt, result
├── public/
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

Xem chi tiết từng phần trong [`docs/03-ke-hoach-frontend.md`](../docs/03-ke-hoach-frontend.md).

---

## 6. Routes chính

### Chung
- `/login`, `/register` — đăng nhập/đăng ký.
- `/dashboard` — trang tổng quan theo role.
- `/profile` — thông tin cá nhân.

### Admin (`/admin/*`)
- `/admin/users` — quản lý người dùng.
- `/admin/subjects` — quản lý môn học.
- `/admin/classes` — quản lý lớp học.
- `/admin/exams` — quản lý đề thi.
- `/admin/reports` — thống kê tổng quan.

### Teacher (`/teacher/*`)
- `/teacher/questions` — ngân hàng câu hỏi.
- `/teacher/exams` — danh sách đề.
- `/teacher/exams/create` — tạo đề.
- `/teacher/exams/[id]` — chi tiết đề.
- `/teacher/reports` — thống kê điểm.

### Student (`/student/*`)
- `/student/exams` — danh sách bài thi.
- `/student/exams/[id]/start` — xác nhận bắt đầu.
- `/student/exams/[id]/doing` — làm bài (màn hình chính).
- `/student/results` — lịch sử kết quả.
- `/student/results/[id]` — chi tiết kết quả.

---

## 7. State management (Zustand)

| Store | Vai trò | Persist? |
|-------|---------|----------|
| `authStore` | Lưu `user`, `token` | Có (localStorage `auth-storage`) |
| `examStore` | State làm bài: answers, currentIndex, tabSwitchCount | Không (BE lưu tạm qua API) |

---

## 8. Tích hợp API

FE giao tiếp với Backend qua Axios instance trong `lib/api.ts`:

- Tự động gắn `Authorization: Bearer <token>` từ `authStore`.
- Tự động redirect về `/login` khi nhận 401.
- Trả về trực tiếp phần `data` của response chuẩn `{ success, data, message }`.

Ví dụ:

```ts
import { api } from '@/lib/api';

// Login
const res = await api.post('/auth/login', { email, password });
// res = { success: true, data: { user, token }, message: 'OK' }
```

---

## 9. Chống gian lận (FE)

| Biện pháp | Vị trí |
|-----------|--------|
| Đếm lần rời tab | `hooks/useTabSwitch.ts` |
| Tự động nộp khi rời tab ≥ 3 | `components/exam/ExamDoing.tsx` → `handleAutoSubmit` |
| Đếm ngược thời gian, cảnh báo 5 phút | `components/exam/ExamCountdown.tsx` |
| Tự động nộp khi hết giờ | `ExamCountdown` → `onExpire` |
| Lưu tự động sau mỗi lần chọn đáp án | `ExamDoing` → `handleSelect` gọi `save-answer` |
| (Tuỳ chọn) Ngăn copy/paste, chuột phải | `onCopyCapture`, `onContextMenu` trong `ExamDoing` |

---

## 10. Tài khoản thử nghiệm (sau khi BE seed)

| Email | Mật khẩu | Role | Truy cập |
|-------|----------|------|----------|
| admin@local | Admin@123 | ADMIN | `/admin/users` |
| (tự tạo qua admin) | — | TEACHER | `/teacher/questions` |
| (tự tạo qua admin) | — | STUDENT | `/student/exams` |

> Hãy tạo tài khoản teacher và student qua giao diện admin để thử đầy đủ luồng.

---

## 11. Scripts npm

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy dev server (port 3000) |
| `npm run build` | Build production |
| `npm start` | Chạy production |
| `npm run lint` | Chạy ESLint |
| `npm run test` | (Tùy chọn) Chạy Jest |

---

## 12. Lỗi thường gặp & cách xử lý

| Lỗi | Nguyên nhân | Cách xử lý |
|-----|-------------|-----------|
| `Network Error` khi gọi API | Backend chưa chạy hoặc sai `NEXT_PUBLIC_API_URL` | Khởi động backend, kiểm tra `.env.local` |
| Trang trắng, console báo "Hydration mismatch" | AntD không được bọc `AntdRegistry` | Kiểm tra `app/layout.tsx` |
| Style AntD bị Tailwind ghi đè | Tailwind preflight đang bật | Tắt `corePlugins.preflight` trong `tailwind.config.ts` |
| Lỗi CORS từ BE | BE chưa cho phép domain FE | Cập nhật `CORS_ORIGIN` trong `.env` BE |
| Đăng nhập thành công nhưng vào trang bị redirect liên tục | Token hết hạn hoặc chưa persist | Xóa `localStorage.auth-storage`, đăng nhập lại |

---

## 13. Best practices

- Luôn dùng `'use client'` ở đầu file component có state/effect.
- Tách logic fetch vào custom hook hoặc gọi trực tiếp trong `useEffect` (khuyến nghị dùng React Query/SWR nếu mở rộng).
- Validate form bằng Zod, schema dùng chung với backend nếu có thể.
- Component tái sử dụng đặt trong `components/common`.
- Tên file component dùng `PascalCase.tsx`, hook dùng `camelCase.ts`.
- Hạn chế logic phức tạp trong JSX, tách ra hàm hoặc sub-component.

---

## 14. Đóng góp

- Commit theo convention: `[FE] feat: ...`, `[FE] fix: ...`, `[FE] style: ...`.
- Pull request cần screenshot/video nếu thay đổi UI.
- Giữ code style thống nhất, không push file `.env.local` hay `node_modules`.
