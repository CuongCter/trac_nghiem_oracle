# Hệ thống Quản lý Thi Trắc Nghiệm

> **Hệ thống thi trắc nghiệm trực tuyến 3 vai trò** (Admin / Giáo viên / Học viên) với ngân hàng câu hỏi, tạo đề thi thông minh (chọn thủ công / random theo độ khó), giám sát gian lận theo thời gian thực, và chấm điểm tự động.
>
> Stack: **Next.js 14 + TypeScript + Ant Design** (FE) · **Node.js + Express + TypeScript + Oracle 19c** (BE) · **Socket.IO** (realtime).

---

## Mục lục

- [1. Ý tưởng dự án](#1-ý-tưởng-dự-án)
- [2. Mục tiêu & đối tượng sử dụng](#2-mục-tiêu--đối-tượng-sử-dụng)
- [3. Tính năng chính](#3-tính-năng-chính)
- [4. Công nghệ sử dụng](#4-công-nghệ-sử-dụng)
- [5. Cấu trúc repository](#5-cấu-trúc-repository)
- [6. Mô hình dữ liệu](#6-mô-hình-dữ-liệu)
- [7. Luồng hoạt động](#7-luồng-hoạt-động)
- [8. Hợp đồng API](#8-hợp-đồng-api)
- [9. Bảo mật & chống gian lận](#9-bảo-mật--chống-gian-lận)
- [10. Cài đặt & chạy nhanh](#10-cài-đặt--chạy-nhanh)
- [11. Tài khoản thử nghiệm](#11-tài-khoản-thử-nghiệm)
- [12. Tài liệu liên quan](#12-tài-liệu-liên-quan)
- [13. Sơ đồ CSDL (dbdiagram.io)](#13-sơ-đồ-csdl-dbdiagramio)

---

## 1. Ý tưởng dự án

Nhằm xây dựng một **hệ thống thi trắc nghiệm trực tuyến hoàn chỉnh** phục vụ cho các cơ sở đào tạo, trường học và trung tâm. Thay vì các bài kiểm tra giấy truyền thống tốn thời gian in ấn, chấm bài và thống kê, hệ thống cho phép:

- **Giáo viên** xây dựng ngân hàng câu hỏi, tạo đề thi, cấu hình khung giờ, giao đề cho từng lớp — tất cả trên giao diện web.
- **Học viên** truy cập danh sách bài thi được phân công, làm bài trực tuyến với đồng hồ đếm ngược, xem điểm ngay khi nộp.
- **Quản trị viên** quản lý người dùng, môn học, lớp học, đề thi và xem báo cáo thống kê tổng quan.
- **Giám sát gian lận theo thời gian thực** thông qua WebSocket: giáo viên nhận cảnh báo ngay khi học viên thoát tab, thoát fullscreen, v.v.

Điểm nhấn của dự án là **tận dụng Oracle 19c** làm hệ quản trị CSDL (phù hợp chương trình Thạc sĩ Quản trị CSDL nâng cao), với thiết kế schema chặt chẽ, sử dụng các ràng buộc `CHECK`, khóa ngoại `ON DELETE CASCADE / SET NULL`, sequence `IDENTITY`, index tối ưu truy vấn — đảm bảo tính toàn vẹn dữ liệu ngay tại tầng database.

---

## 2. Mục tiêu & đối tượng sử dụng

### Mục tiêu

- Số hóa quy trình tạo đề → phân công → làm bài → chấm điểm → báo cáo.
- Hỗ trợ **tạo đề thi thông minh** theo độ khó (EASY / MEDIUM / HARD) thay vì chọn thủ công từng câu.
- Đảm bảo **tính công bằng** nhờ xáo trộn câu hỏi, xáo trộn đáp án và đếm ngược thời gian.
- **Giảm thiểu gian lận** với cơ chế phát hiện thoát tab, thoát fullscreen, cảnh báo realtime cho giám thị.
- Hỗ trợ quản lý tập trung cho **nhiều môn học, nhiều lớp, nhiều vai trò**.

### Đối tượng

| Vai trò | Quyền hạn |
|---------|-----------|
| **ADMIN** (Quản trị viên) | Toàn quyền: quản lý người dùng, môn học, lớp học, đề thi, xem báo cáo tổng quan. |
| **TEACHER** (Giáo viên) | Quản lý câu hỏi, tạo/xuất bản đề thi của mình, xem kết quả và cảnh báo gian lận của học viên. |
| **STUDENT** (Học viên) | Xem bài thi được phân công, làm bài, xem lịch sử kết quả cá nhân. |

---

## 3. Tính năng chính

### 3.1. Phân hệ xác thực & phân quyền

- Đăng ký tài khoản (mặc định vai trò STUDENT).
- Đăng nhập bằng email + mật khẩu, JWT lưu ở `localStorage` (FE) và trong header `Authorization: Bearer ...`.
- Đổi mật khẩu (đã đăng nhập).
- Phân quyền theo route (FE `AuthGuard`) + middleware `authenticate` + `authorize(role)` (BE).
- Tự động redirect về `/login` khi nhận 401.

### 3.2. Phân hệ Admin

| Module | Tính năng |
|--------|-----------|
| **Người dùng** | CRUD tài khoản, lọc theo vai trò/trạng thái, khóa/mở khóa thay vì xóa cứng. |
| **Môn học** | CRUD môn học, mã môn học duy nhất, mô tả. |
| **Lớp học** | CRUD lớp, gán giáo viên phụ trách, thêm học viên vào lớp. |
| **Đề thi** | Xem & quản lý toàn bộ đề trong hệ thống (xem/sửa/xóa). |
| **Báo cáo** | Dashboard tổng quan: số user, số môn, số đề, số lượt thi, biểu đồ tròn/cột. |

### 3.3. Phân hệ Teacher (Giáo viên)

| Module | Tính năng |
|--------|-----------|
| **Ngân hàng câu hỏi** | CRUD câu hỏi trắc nghiệm (A/B/C/D) theo môn học, độ khó, chương, điểm. Lọc theo môn, độ khó, chương. |
| **Import câu hỏi** | Import hàng loạt từ Excel lên `/api/teacher/import-questions`. |
| **Đề thi** | Tạo đề, 2 chế độ: **chọn thủ công** hoặc **random theo độ khó** (EASY/MEDIUM/HARD). Cấu hình thời lượng, khung giờ, xáo trộn câu/đáp án, gán lớp. |
| **Xuất bản / Đóng đề** | Đề chuyển trạng thái `DRAFT → PUBLISHED → CLOSED`. Học viên chỉ làm được khi đang `PUBLISHED` và trong khung giờ. |
| **Báo cáo** | Thống kê điểm theo môn, top học viên, đề thi của giáo viên. |
| **Cảnh báo gian lận (Realtime)** | Nhận event `violation` qua Socket.IO: thoát tab, thoát fullscreen. |

### 3.4. Phân hệ Student (Học viên)

| Module | Tính năng |
|--------|-----------|
| **Danh sách bài thi** | Xem các bài thi đang mở và được phân công (theo lớp). |
| **Bắt đầu bài thi** | Trang xác nhận, yêu cầu fullscreen, cảnh báo vi phạm. |
| **Làm bài** | Giao diện 2 cột: câu hỏi + palette câu hỏi, đếm ngược, tiến độ. Tự động lưu đáp án mỗi lần chọn (debounce 600ms). |
| **Chống gian lận FE** | Phát hiện `visibilitychange`, `blur`, copy/paste, thoát fullscreen; gửi event về BE; tự nộp bài nếu vượt ngưỡng. |
| **Kết quả** | Xem điểm, số câu đúng/sai, đáp án đúng từng câu. |
| **Lịch sử** | Danh sách tất cả các lượt thi đã hoàn thành. |

### 3.5. Phân hệ chung

- Health check: `GET /api/health` → kiểm tra DB up/down.
- Response envelope chuẩn `{ success, data, message?, errors? }` cho mọi endpoint.
- Phân trang + lọc + tìm kiếm cho hầu hết danh sách.
- Realtime qua Socket.IO (`path: /ws`).

---

## 4. Công nghệ sử dụng

### Frontend (`frontend/`)

- **Next.js 14** (App Router) + **React 18** + **TypeScript 5**.
- **Ant Design 5** (UI component chính) + `@ant-design/nextjs-registry` (hỗ trợ SSR).
- **Tailwind CSS 3** (utility CSS, tắt preflight tránh xung đột AntD).
- **Zustand** (state management) + `persist` middleware (lưu `auth-storage` vào `localStorage`).
- **Axios** (HTTP client, interceptor gắn JWT + unwrap envelope).
- **React Hook Form + Zod** (validate form).
- **Socket.IO Client** (realtime).
- **Recharts** (biểu đồ dashboard), **xlsx** (export Excel), **Day.js** (đếm ngược).

### Backend (`backend/`)

- **Node.js 20 LTS** + **Express 4** + **TypeScript 5**.
- **oracledb 6.x** (driver Oracle 19c, connection pool).
- **Socket.IO 4.x** (realtime bridge).
- **JWT** (`jsonwebtoken`) cho stateless auth.
- **bcryptjs** hash mật khẩu.
- **Zod** validate input (chia sẻ schema ý tưởng với FE).
- **Helmet + CORS + Morgan** bảo mật & logging.

### Cơ sở dữ liệu

- **Oracle Database 19c**.
- 11 bảng chính với ràng buộc `CHECK`, `UNIQUE`, `FOREIGN KEY` chặt chẽ.
- Sequence `IDENTITY` cho mọi khóa chính.
- Index tối ưu cho các truy vấn phổ biến (`IDX_ATTEMPTS_STUDENT`, `IDX_RESULTS_STUDENT`, ...).

---

## 5. Cấu trúc repository

```
code/
├── backend/                          # Node.js + Express + Oracle 19c
│   ├── database/
│   │   ├── schema.sql                # Tạo bảng + index
│   │   ├── seed.sql                  # Dữ liệu mẫu (tùy chọn)
│   │   └── drop.sql
│   ├── src/
│   │   ├── app.ts                    # Khởi tạo Express + router
│   │   ├── server.ts                 # Bootstrap HTTP + Socket.IO
│   │   ├── config/                   # env, database (pool Oracle)
│   │   ├── middleware/               # auth, error handler
│   │   ├── routes/                   # auth, users, subjects, classes, questions, exams, student, reports
│   │   ├── services/                 # business logic
│   │   ├── repositories/             # SQL access (Oracle)
│   │   ├── validators/               # zod schemas
│   │   ├── realtime/                 # socket.io bridge (emitViolation)
│   │   ├── types/                    # shared TS types
│   │   ├── utils/                    # auth/jwt/bcrypt, errors, response
│   │   └── scripts/                  # seed-admin
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── frontend/                         # Next.js + React + AntD
│   ├── app/
│   │   ├── (auth)/                   # /login, /register
│   │   ├── admin/                    # /admin/{users,subjects,classes,exams,reports}
│   │   ├── teacher/                  # /teacher/{questions,exams,reports,alerts}
│   │   ├── student/                  # /student/{exams,results}
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── layout.tsx
│   │   └── page.tsx                  # redirect → /dashboard
│   ├── components/
│   │   ├── auth/                     # AuthGuard, LoginForm, RegisterForm
│   │   ├── layout/                   # AppShellWrapper, AppHeader, Sidebar, RoleRedirect
│   │   ├── exam/                     # ExamForm, ExamDoing, ExamCountdown, QuestionPalette, ...
│   │   ├── admin/                    # UserFormModal, SubjectFormModal, ClassFormModal
│   │   ├── dashboard/
│   │   └── ui/                       # Button, Card, Table, Input, ...
│   ├── lib/                          # api (axios), auth, format, storage, excel, constants
│   ├── stores/                       # authStore (Zustand persist)
│   ├── hooks/                        # useAuthGuard, useTabSwitch, useAntiCheat, useAutoSave, ...
│   ├── types/                        # api, user, subject, exam, question, attempt, result
│   ├── package.json
│   ├── tailwind.config.ts
│   └── README.md
│
└── README.md                         # ← File này (tổng quan dự án)
```

---

## 6. Mô hình dữ liệu

Mô hình ER cốt lõi:

```
USERS ─┬─< SUBJECTS ─< QUESTIONS
       ├─< CLASSES ─< CLASS_STUDENTS >─ USERS (role=STUDENT)
       ├─< EXAMS ─< EXAM_QUESTIONS >─ QUESTIONS
       │        └─< EXAM_CLASSES >─ CLASSES
       └─< EXAM_ATTEMPTS ─< ATTEMPT_ANSWERS >─ QUESTIONS
                     └─< VIOLATIONS
       └─< EXAM_RESULTS ─< RESULT_ANSWERS >─ QUESTIONS
```

Các bảng chính:

| Bảng | Vai trò | Điểm đáng chú ý |
|------|--------|-----------------|
| `USERS` | Người dùng hệ thống | `ROLE IN ('ADMIN','TEACHER','STUDENT')`, `STATUS IN ('ACTIVE','LOCKED')`. |
| `SUBJECTS` | Môn học | `CODE` duy nhất, ghi nhớ `CREATED_BY` (giáo viên/admin tạo). |
| `QUESTIONS` | Ngân hàng câu hỏi | `CORRECT_ANSWER IN ('A','B','C','D')`, `DIFFICULTY IN ('EASY','MEDIUM','HARD')`, `POINT (0,100]`. Index `(SUBJECT_ID, DIFFICULTY)`. |
| `CLASSES` + `CLASS_STUDENTS` | Lớp học | Quan hệ N-N giữa lớp và học viên. |
| `EXAMS` | Đề thi | `STATUS IN ('DRAFT','PUBLISHED','CLOSED')`, `SHUFFLE_QUESTIONS`, `SHUFFLE_OPTIONS`, `DURATION_MINUTES > 0`, `END_TIME > START_TIME`. |
| `EXAM_QUESTIONS`, `EXAM_CLASSES` | Gán câu hỏi & lớp vào đề | Bảng trung gian. |
| `EXAM_ATTEMPTS` | Lượt thi | `UNIQUE(EXAM_ID, STUDENT_ID)` — mỗi học viên chỉ có 1 attempt. `STATUS IN ('IN_PROGRESS','SUBMITTED','EXPIRED')`. |
| `ATTEMPT_ANSWERS` | Đáp án đang chọn (chưa chấm) | `SELECTED_OPTION` có thể `NULL`. |
| `VIOLATIONS` | Nhật ký gian lận | `TYPE` mô tả hành vi, `OCCURRED_AT` tự động. |
| `EXAM_RESULTS` + `RESULT_ANSWERS` | Kết quả sau chấm | `SCORE`, `PASSED`, `IS_CORRECT` từng câu. |

---

## 7. Luồng hoạt động

### 7.1. Luồng tổng quan (3 vai trò)

```
┌────────────┐    đăng ký/đăng nhập    ┌──────────────────────────┐
│  Người dùng│ ──────────────────────► │   Frontend (Next.js)     │
└────────────┘                          │  AuthGuard theo role     │
                                        └──────────┬───────────────┘
                                                   │ JWT trong header
                                                   ▼
                                        ┌──────────────────────────┐
                                        │   Backend (Express)      │
                                        │  authenticate/authorize  │
                                        └──────────┬───────────────┘
                                                   │ oracledb pool
                                                   ▼
                                        ┌──────────────────────────┐
                                        │   Oracle 19c             │
                                        └──────────────────────────┘
```

### 7.2. Luồng Admin: Quản lý người dùng

1. Admin đăng nhập → JWT được lưu vào `authStore` (persist `localStorage`).
2. Vào `/admin/users` → `AuthGuard` kiểm tra role = ADMIN.
3. FE gọi `GET /api/users?page=1&limit=10` (Axios tự gắn `Authorization`).
4. BE `userRouter` → `userService` → `userRepo.list()` → trả envelope `{success, data: {items, pagination}}`.
5. FE render bảng có phân trang + bộ lọc (search theo tên/email, lọc role, status).
6. Khi bấm **Tạo / Sửa** → mở `UserFormModal` → submit `POST /api/users` hoặc `PUT /api/users/:id`.
7. **Khóa/Mở khóa** thay vì xóa cứng: `PUT /api/users/:id` với `{status: 'LOCKED'|'ACTIVE'}` → giữ lại lịch sử dữ liệu liên quan (đề thi, lượt thi, kết quả).

### 7.3. Luồng Teacher: Tạo đề thi

1. Teacher vào `/teacher/exams/create`.
2. Form `ExamForm` (React Hook Form + Zod) gồm:
   - **Thông tin cơ bản**: tiêu đề, môn học, thời lượng, danh sách lớp được gán.
   - **Khung giờ thi**: `startTime`, `endTime`, `shuffleQuestions`, `shuffleOptions`.
   - **Bộ câu hỏi**: 2 tab —
     - *Chọn thủ công*: load `/api/questions?subjectId=...` rồi tick chọn.
     - *Random theo độ khó*: nhập số câu EASY/MEDIUM/HARD.
3. Submit → `POST /api/exams` → `examService.create()` (sinh `EXAM_QUESTIONS` theo 1 trong 2 cách).
4. Bấm **Publish** → `POST /api/exams/:id/publish` → status `DRAFT → PUBLISHED`.
5. Trong khung giờ, học viên thuộc lớp được gán sẽ thấy bài thi trong `/student/exams`.

### 7.4. Luồng Student: Làm bài

```
[1] Vào /student/exams
        │
        ▼  GET /api/student/exams
[2] Danh sách bài thi (lọc theo lớp, trong khung giờ, status=PUBLISHED)
        │  Bấm "Bắt đầu"
        ▼  POST /api/student/exams/:id/start
[3] Server tạo EXAM_ATTEMPTS (UNIQUE(EXAM_ID, STUDENT_ID))
    END_TIME = SYSTIMESTAMP + DURATION_MINUTES
    Xáo trộn câu/đáp án theo cấu hình đề
    Trả về danh sách câu hỏi + endTime
        │
        ▼
[4] /student/exams/[id]/doing → ExamDoing
    ┌─────────────────────────────────────────────────────────────┐
    │ • requestFullscreen() + useAntiCheat()                       │
    │ • useTabSwitch() → đếm số lần visibilitychange               │
    │ • useDebouncedEffect(answers, 600ms) → POST save-answer      │
    │ • ExamCountdown → onExpire = submit                          │
    │ • Nếu vi phạm: POST /student/exams/:id/violation             │
    │   + BE emitViolation() qua Socket.IO tới giáo viên phụ trách│
    │ • Nếu vượt ngưỡng (≥3 lần rời tab): auto-submit             │
    └─────────────────────────────────────────────────────────────┘
        │  Bấm "Nộp bài"
        ▼  POST /api/student/exams/:id/submit
[5] studentExamService.submitExam():
    • So sánh ATTEMPT_ANSWERS.SELECTED_OPTION vs QUESTIONS.CORRECT_ANSWER
    • Tính SCORE = SUM(POINT * IS_CORRECT)
    • Tạo EXAM_RESULTS + RESULT_ANSWERS
    • Đánh dấu attempt SUBMITTED
        │
        ▼
[6] Redirect → /student/results/:id  (xem chi tiết điểm)
```

### 7.5. Luồng Realtime: Cảnh báo gian lận

```
┌──────────────┐ vi phạm (tab switch, fullscreen exit) ┌──────────────┐
│  Student FE  │ ─────────────────────────────────────► │  Backend     │
│  ExamDoing   │  POST /student/exams/:id/violation    │  Express     │
└──────────────┘                                       └──────┬───────┘
                                                                 │
                                       studentExamService.recordViolation()
                                                                 │
                                       realtime.emitViolation(event, teacherIds)
                                                                 │
                                                          Socket.IO
                                                                 ▼
                                                      ┌──────────────────┐
                                                      │  Teacher FE      │
                                                      │  /teacher/alerts │
                                                      │  useTeacherAlerts│
                                                      │  → cập nhật UI   │
                                                      └──────────────────┘
```

- Socket.IO chạy ở `path: "/ws"`, client kết nối `http://localhost:5000` (không `/api`).
- Khi connect, FE gửi `auth: { token }` (JWT) → BE xác thực → teacher gửi `teacher:subscribe` để join room `teacher:<id>`.
- Mỗi vi phạm FE báo lên BE → BE insert `VIOLATIONS` → `emitViolation()` tới room của giáo viên phụ trách.

### 7.6. Sơ đồ trạng thái đề thi

```
   DRAFT ──publish──► PUBLISHED ──close──► CLOSED
     │                  │
     │                  │ trong khung giờ
     │                  ▼
     │            Student làm bài (IN_PROGRESS → SUBMITTED/EXPIRED)
     ▼
  delete (chỉ khi DRAFT, không có attempt)
```

### 7.7. Sơ đồ trạng thái attempt

```
   (chưa có) ─start─► IN_PROGRESS ─submit─► SUBMITTED
                          │                      │
                          │ hết giờ              │
                          ▼                      │
                       EXPIRED (auto-submit)     │
                                                 ▼
                                       EXAM_RESULTS (chấm điểm)
```

---

## 8. Hợp đồng API

Tất cả response đều theo envelope:

```json
{ "success": true, "data": { ... }, "message": "OK" }
// hoặc khi lỗi
{ "success": false, "message": "...", "errors": [...] }
```

Trừ các endpoint trả mảng ngắn dùng cho dropdown/dashboard.

| Prefix | Mô tả | Quyền |
|--------|-------|-------|
| `/api/health` | Health check (DB up/down) | Public |
| `/api/auth/login` · `/register` · `/me` · `/logout` · `/change-password` | Xác thực | Mixed |
| `/api/users` | CRUD người dùng, khóa/mở | ADMIN |
| `/api/subjects` | CRUD môn học | ADMIN, TEACHER |
| `/api/classes` | CRUD lớp học, gán học viên | ADMIN |
| `/api/questions` | CRUD ngân hàng câu hỏi | TEACHER, ADMIN |
| `/api/teacher/import-questions` | Import Excel | TEACHER, ADMIN |
| `/api/exams` | CRUD đề thi, publish, close | TEACHER, ADMIN (tùy endpoint) |
| `/api/student/exams` · `/student/exams/:id/start` · `/save-answer` · `/submit` · `/violation` · `/results` | Làm bài & kết quả | STUDENT |
| `/api/reports/dashboard` · `/teacher-dashboard` · `/exams` · `/students` · `/classes` | Thống kê | ADMIN, TEACHER |

---

## 9. Bảo mật & chống gian lận

### Tầng Backend

- Mật khẩu hash bằng **bcrypt** (salt rounds 10).
- **JWT stateless** trong header `Authorization: Bearer <token>`.
- Middleware `authenticate` (xác thực) + `authorize(roles)` (phân quyền).
- **Zod validators** chặn input rác/sai kiểu ngay từ router.
- **Oracle CHECK constraints** ngăn dữ liệu không hợp lệ (vd: `ROLE`, `STATUS`, `CORRECT_ANSWER`, `END_TIME > START_TIME`).
- Soft delete: ưu tiên **khóa tài khoản** (`STATUS='LOCKED'`) thay vì xóa cứng.
- Helmet + CORS whitelist + body size limit 2MB.

### Tầng Frontend

- `AuthGuard` chặn truy cập theo role ngay tại client.
- Axios interceptor tự gắn token, tự redirect khi 401.
- **useTabSwitch** — đếm số lần `visibilitychange`/`blur`, cảnh báo, tự nộp khi ≥ 3 lần.
- **useAntiCheat** — phát hiện copy/paste, chuột phải, thoát fullscreen.
- **ExamCountdown** — đếm ngược theo `endTime` server trả về, cảnh báo 5 phút cuối, auto-submit khi hết giờ.
- **Auto-save** mỗi lần chọn đáp án (debounce 600ms) → resume khi reload.

### Realtime monitoring

- Socket.IO gửi `violation` event tới giáo viên phụ trách → cảnh báo tức thì.
- BE lưu log `VIOLATIONS` phục vụ truy vết sau kỳ thi.

---

## 10. Cài đặt & chạy nhanh

### Yêu cầu

- Node.js ≥ 18 (khuyến nghị 20 LTS), npm ≥ 9.
- Oracle Database 19c với user có quyền CREATE/ALTER/DROP trên schema mặc định.
- Oracle Instant Client 19c (nếu cần) — trỏ `OCI_LIB_DIR` / `PATH`.

### Bước 1 — Khởi tạo database

Mở SQL*Plus / SQLcl / DBeaver, kết nối tới Oracle và chạy:

```sql
@backend/database/schema.sql
@backend/database/seed.sql   -- tùy chọn
```

### Bước 2 — Backend

```bash
cd backend
cp .env.example .env
# Sửa DB_USER, DB_PASSWORD, DB_CONNECT_STRING trong .env
npm install
npm run dev          # http://localhost:5000
```

Tạo tài khoản admin mặc định (`admin@local / Admin@123`):

```bash
npm run seed:admin
```

Smoke test:

```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local","password":"Admin@123"}'
```

### Bước 3 — Frontend

```bash
cd frontend
cp .env.example .env.local
# Mặc định: NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev          # http://localhost:3000
```

Lần đầu truy cập sẽ tự chuyển về `/login`. Sau khi đăng nhập, FE tự route theo role:

- ADMIN → `/admin/users`
- TEACHER → `/teacher/questions`
- STUDENT → `/student/exams`

---

## 11. Tài khoản thử nghiệm

| Email | Mật khẩu | Role | Truy cập |
|-------|----------|------|----------|
| `admin@local` | `Admin@123` | ADMIN | `/admin/users` |
| _(tạo qua admin)_ | — | TEACHER | `/teacher/questions` |
| _(tạo qua admin)_ | — | STUDENT | `/student/exams` |

> Tạo tài khoản teacher và student qua giao diện admin để thử đầy đủ luồng.

---

## 12. Tài liệu liên quan

- [`backend/README.md`](./backend/README.md) — Hướng dẫn chi tiết backend, schema, smoke test.
- [`frontend/README.md`](./frontend/README.md) — Hướng dẫn chi tiết frontend, route, state, chống gian lận.
- [`frontend/.agents/skills/vercel-react-best-practices/AGENTS.md`](./frontend/.agents/skills/vercel-react-best-practices/AGENTS.md) — Best practices React/Next.js (Vercel).

---

## 13. Sơ đồ CSDL (dbdiagram.io)

Toàn bộ 11 bảng trong `backend/database/schema.sql` được tái tạo bằng [DBML](https://dbml.dbdiagram.io/home/) (Database Markup Language). Copy nguyên khối dưới đây, dán vào [https://dbdiagram.io/d](https://dbdiagram.io/d) để xem sơ đồ quan hệ trực quan.

```dbml
// =====================================================
// Hệ thống Quản lý Thi Trắc Nghiệm — DBML Diagram
// Tương thích: https://dbdiagram.io/d
// Schema gốc: backend/database/schema.sql (Oracle 19c)
// =====================================================

// USERS ---------------------------------------------------------
Table USERS {
  ID            int          [pk, increment, note: 'IDENTITY']
  FULL_NAME     varchar(120) [not null]
  EMAIL         varchar(180) [not null, unique]
  PASSWORD_HASH varchar(255) [not null]
  ROLE          varchar(20)  [not null, note: 'CHECK IN (ADMIN, TEACHER, STUDENT)']
  STATUS        varchar(20)  [not null, default: `ACTIVE`, note: 'CHECK IN (ACTIVE, LOCKED)']
  CREATED_AT    timestamp    [not null, default: `SYSTIMESTAMP`]
  UPDATED_AT    timestamp    [not null, default: `SYSTIMESTAMP`]

  Note: 'Người dùng hệ thống (ADMIN / TEACHER / STUDENT)'
}

// SUBJECTS ------------------------------------------------------
Table SUBJECTS {
  ID          int          [pk, increment]
  NAME        varchar(120) [not null]
  CODE        varchar(20)  [not null, unique]
  DESCRIPTION varchar(500)
  CREATED_BY  int          [ref: > USERS.ID, note: 'ON DELETE SET NULL']
  CREATED_AT  timestamp    [not null, default: `SYSTIMESTAMP`]
  UPDATED_AT  timestamp    [not null, default: `SYSTIMESTAMP`]

  Note: 'Môn học'
}

// QUESTIONS -----------------------------------------------------
Table QUESTIONS {
  ID             int            [pk, increment]
  SUBJECT_ID     int            [not null, ref: > SUBJECTS.ID, note: 'ON DELETE CASCADE']
  CONTENT        varchar(2000)  [not null]
  OPTION_A       varchar(500)   [not null]
  OPTION_B       varchar(500)   [not null]
  OPTION_C       varchar(500)   [not null]
  OPTION_D       varchar(500)   [not null]
  CORRECT_ANSWER char(1)        [not null, note: 'CHECK IN (A, B, C, D)']
  DIFFICULTY     varchar(20)    [not null, note: 'CHECK IN (EASY, MEDIUM, HARD)']
  CHAPTER        varchar(80)
  POINT          decimal(6, 2)  [not null, default: 1, note: 'CHECK (0, 100]']
  CREATED_BY     int            [ref: > USERS.ID, note: 'ON DELETE SET NULL']
  CREATED_AT     timestamp      [not null, default: `SYSTIMESTAMP`]
  UPDATED_AT     timestamp      [not null, default: `SYSTIMESTAMP`]

  Indexes {
    (SUBJECT_ID)              [name: 'IDX_QUESTIONS_SUBJECT']
    (SUBJECT_ID, DIFFICULTY)  [name: 'IDX_QUESTIONS_DIFFICULTY']
  }

  Note: 'Ngân hàng câu hỏi trắc nghiệm'
}

// CLASSES -------------------------------------------------------
Table CLASSES {
  ID         int          [pk, increment]
  NAME       varchar(120) [not null, unique]
  TEACHER_ID int          [ref: > USERS.ID, note: 'ON DELETE SET NULL']
  CREATED_AT timestamp    [not null, default: `SYSTIMESTAMP`]
  UPDATED_AT timestamp    [not null, default: `SYSTIMESTAMP`]

  Note: 'Lớp học (giáo viên phụ trách)'
}

Table CLASS_STUDENTS {
  CLASS_ID   int       [not null, ref: > CLASSES.ID, note: 'ON DELETE CASCADE']
  STUDENT_ID int       [not null, ref: > USERS.ID, note: 'ON DELETE CASCADE']
  ADDED_AT   timestamp [not null, default: `SYSTIMESTAMP`]

  Indexes {
    (CLASS_ID, STUDENT_ID) [pk, name: 'CLASS_STUDENTS_PK']
    (STUDENT_ID)           [name: 'IDX_CLASS_STUDENTS_STUDENT']
  }

  Note: 'Quan hệ N-N giữa Lớp và Học viên'
}

// EXAMS ---------------------------------------------------------
Table EXAMS {
  ID                int           [pk, increment]
  TITLE             varchar(200)  [not null]
  SUBJECT_ID        int           [not null, ref: > SUBJECTS.ID, note: 'ON DELETE CASCADE']
  DURATION_MINUTES  int           [not null, note: 'CHECK > 0']
  TOTAL_QUESTIONS   int           [not null, default: 0]
  TOTAL_POINTS      decimal(8, 2) [not null, default: 0]
  START_TIME        timestamp     [not null]
  END_TIME          timestamp     [not null, note: 'CHECK END_TIME > START_TIME']
  STATUS            varchar(20)   [not null, default: `DRAFT`, note: 'CHECK IN (DRAFT, PUBLISHED, CLOSED)']
  SHUFFLE_QUESTIONS char(1)       [not null, default: `Y`]
  SHUFFLE_OPTIONS   char(1)       [not null, default: `Y`]
  CREATED_BY        int           [ref: > USERS.ID, note: 'ON DELETE SET NULL']
  CREATED_AT        timestamp     [not null, default: `SYSTIMESTAMP`]
  UPDATED_AT        timestamp     [not null, default: `SYSTIMESTAMP`]

  Indexes {
    (SUBJECT_ID, STATUS)           [name: 'IDX_EXAMS_SUBJECT_STATUS']
    (STATUS, START_TIME, END_TIME) [name: 'IDX_EXAMS_STATUS_START']
  }

  Note: '�ề thi'
}

Table EXAM_QUESTIONS {
  EXAM_ID     int [not null, ref: > EXAMS.ID, note: 'ON DELETE CASCADE']
  QUESTION_ID int [not null, ref: > QUESTIONS.ID, note: 'ON DELETE CASCADE']
  POSITION    int

  Indexes {
    (EXAM_ID, QUESTION_ID) [pk, name: 'EXAM_QUESTIONS_PK']
    (QUESTION_ID)          [name: 'IDX_EXAM_QUESTIONS_Q']
  }

  Note: 'Gán câu h�i vào đề thi'
}

Table EXAM_CLASSES {
  EXAM_ID  int [not null, ref: > EXAMS.ID,   note: 'ON DELETE CASCADE']
  CLASS_ID int [not null, ref: > CLASSES.ID, note: 'ON DELETE CASCADE']

  Indexes {
    (EXAM_ID, CLASS_ID) [pk, name: 'EXAM_CLASSES_PK']
    (CLASS_ID)          [name: 'IDX_EXAM_CLASSES_CLASS']
  }

  Note: 'Gán lớp được phép thi vào đề'
}

// EXAM_ATTEMPTS -------------------------------------------------
Table EXAM_ATTEMPTS {
  ID                int       [pk, increment]
  EXAM_ID           int       [not null, ref: > EXAMS.ID, note: 'ON DELETE CASCADE']
  STUDENT_ID        int       [not null, ref: > USERS.ID, note: 'ON DELETE CASCADE']
  STARTED_AT        timestamp [not null, default: `SYSTIMESTAMP`]
  END_TIME          timestamp [not null]
  SUBMITTED_AT      timestamp
  STATUS            varchar(20) [not null, default: `IN_PROGRESS`, note: 'CHECK IN (IN_PROGRESS, SUBMITTED, EXPIRED)']
  IS_AUTO_SUBMITTED char(1)   [not null, default: `N`]

  Indexes {
    (EXAM_ID, STUDENT_ID) [unique, name: 'ATTEMPTS_UN']
    (STUDENT_ID)          [name: 'IDX_ATTEMPTS_STUDENT']
    (EXAM_ID)             [name: 'IDX_ATTEMPTS_EXAM (seed.sql)']
  }

  Note: 'Lượt thi của học viên — UNIQUE(EXAM_ID, STUDENT_ID)'
}

Table ATTEMPT_ANSWERS {
  ATTEMPT_ID      int     [not null, ref: > EXAM_ATTEMPTS.ID, note: 'ON DELETE CASCADE']
  QUESTION_ID     int     [not null, ref: > QUESTIONS.ID,     note: 'ON DELETE CASCADE']
  SELECTED_OPTION char(1) [note: 'NULL hoặc A/B/C/D']

  Indexes {
    (ATTEMPT_ID, QUESTION_ID) [pk, name: 'ATTEMPT_ANSWERS_PK']
  }

  Note: '�áp án đang chọn trong lúc làm bài (chưa chấm)'
}

// VIOLATIONS ----------------------------------------------------
Table VIOLATIONS {
  ID         int        [pk, increment]
  ATTEMPT_ID int        [not null, ref: > EXAM_ATTEMPTS.ID, note: 'ON DELETE CASCADE']
  TYPE       varchar(40) [not null, note: 'TAB_SWITCH / FULLSCREEN_EXIT / COPY_PASTE ...']
  OCCURRED_AT timestamp [not null, default: `SYSTIMESTAMP`]

  Indexes {
    (ATTEMPT_ID, OCCURRED_AT) [name: 'IDX_VIOLATIONS_ATTEMPT']
  }

  Note: 'Nhật ký gian lận trong lúc thi'
}

// EXAM_RESULTS --------------------------------------------------
Table EXAM_RESULTS {
  ID            int           [pk, increment]
  EXAM_ID       int           [not null, ref: > EXAMS.ID, note: 'ON DELETE CASCADE']
  STUDENT_ID    int           [not null, ref: > USERS.ID, note: 'ON DELETE CASCADE']
  TOTAL_CORRECT int           [not null, default: 0]
  TOTAL_WRONG   int           [not null, default: 0]
  SCORE         decimal(6, 2) [not null, default: 0]
  PASSED        char(1)       [not null, default: `N`]
  SUBMITTED_AT  timestamp     [not null, default: `SYSTIMESTAMP`]
  GRADED_AT     timestamp     [not null, default: `SYSTIMESTAMP`]

  Indexes {
    (EXAM_ID, STUDENT_ID) [unique, name: 'RESULTS_UN']
    (STUDENT_ID)          [name: 'IDX_RESULTS_STUDENT']
  }

  Note: 'Kết quả sau khi chấm'
}

Table RESULT_ANSWERS {
  RESULT_ID       int     [not null, ref: > EXAM_RESULTS.ID, note: 'ON DELETE CASCADE']
  QUESTION_ID     int     [not null, ref: > QUESTIONS.ID,    note: 'ON DELETE CASCADE']
  SELECTED_OPTION char(1) [note: 'NULL hoặc A/B/C/D']
  IS_CORRECT      char(1) [not null, default: `N`]

  Indexes {
    (RESULT_ID, QUESTION_ID) [pk, name: 'RESULT_ANSWERS_PK']
  }

  Note: 'Chi tiết đúng/sai t�ng câu trong bài thi đã chấm'
}
```

**Một số lưu ý khi dán vào dbdiagram.io:**

- DBML không hỗ trợ đầy đủ cú pháp Oracle (sequence `IDENTITY`, kiểu `CHAR`, `SYSTIMESTAMP` default). Trên dbdiagram các kiểu sẽ được hiển thị tương đương (`int`, `varchar`, `timestamp`, …) nhưng vẫn giữ nguyên ý nghĩa — bạn có thể chỉnh lại nhãn cột nếu cần.
- Quan hệ được suy ra từ `FOREIGN KEY` trong `schema.sql`: `SUBJECTS.CREATED_BY`, `QUESTIONS.{SUBJECT_ID, CREATED_BY}`, `CLASSES.TEACHER_ID`, `CLASS_STUDENTS.{CLASS_ID, STUDENT_ID}`, `EXAMS.{SUBJECT_ID, CREATED_BY}`, `EXAM_QUESTIONS.{EXAM_ID, QUESTION_ID}`, `EXAM_CLASSES.{EXAM_ID, CLASS_ID}`, `EXAM_ATTEMPTS.{EXAM_ID, STUDENT_ID}`, `ATTEMPT_ANSWERS.{ATTEMPT_ID, QUESTION_ID}`, `VIOLATIONS.ATTEMPT_ID`, `EXAM_RESULTS.{EXAM_ID, STUDENT_ID}`, `RESULT_ANSWERS.{RESULT_ID, QUESTION_ID}`.
- `ON DELETE CASCADE / SET NULL` được ghi chú bằng `note:` ngay trong định nghĩa cột để không mất thông tin.
- Index phụ `IDX_ATTEMPTS_EXAM` (từ `seed.sql`) cũng được liệt kê trong `EXAM_ATTEMPTS` để khớp với schema thật.

---

> **Tác giả**: Sinh viên Thạc sĩ — Môn học *Quản trị CSDL nâng cao*.
> **Mục tiêu**: Minh chứng thiết kế CSDL chặt chẽ trên Oracle 19c, kết hợp full-stack web application cho bài toán thi trắc nghiệm thực tế.