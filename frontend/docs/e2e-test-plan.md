# E2E Test Plan — Frontend Hệ thống Quản lý Thi Trắc Nghiệm

## Mục tiêu
Đảm bảo toàn bộ flow Admin → Teacher → Student hoạt động end-to-end đúng với tài liệu `docs/01-ke-hoach-trien-khai.md` và `docs/02-ke-hoach-backend.md`.

## Yêu cầu môi trường
- Backend (Express + MongoDB) đang chạy ở `http://localhost:5000`.
- Đã seed ít nhất 1 tài khoản `ADMIN` (mặc định `admin@local / Admin@123`).
- Frontend (`npm run dev`) đang chạy ở `http://localhost:3000`.
- File `.env.local` của FE có `NEXT_PUBLIC_API_URL=http://localhost:5000/api`.

## Test cases thủ công

### 1. Auth flow
| STT | Bước | Kỳ vọng |
|-----|------|----------|
| 1.1 | Truy cập `http://localhost:3000` | Redirect về `/login` |
| 1.2 | Đăng nhập với `admin@local / Admin@123` | Redirect về `/admin/users` |
| 1.3 | Đăng xuất, thử truy cập `/admin/users` | Redirect về `/login` |
| 1.4 | Đăng ký tài khoản mới | Tạo thành công, đăng nhập thẳng vào `/student/exams` |
| 1.5 | Truy cập `/admin/users` bằng tài khoản Student | Redirect về `/dashboard` |

### 2. Admin — Quản lý người dùng
| STT | Bước | Kỳ vọng |
|-----|------|----------|
| 2.1 | Tạo user mới role=TEACHER | User xuất hiện trong bảng |
| 2.2 | Khóa tài khoản vừa tạo | Status badge đổi thành "Đã khóa" |
| 2.3 | Tìm kiếm theo tên | Bảng filter realtime (sau 300ms debounce) |

### 3. Admin — Môn học & Lớp học
| STT | Bước | Kỳ vọng |
|-----|------|----------|
| 3.1 | Tạo môn học mới với code `WEB101` | Môn học xuất hiện trong bảng |
| 3.2 | Tạo lớp mới, gán 2 học viên | Lớp hiển thị 2 học viên |

### 4. Teacher — Ngân hàng câu hỏi
| STT | Bước | Kỳ vọng |
|-----|------|----------|
| 4.1 | Tạo câu hỏi trắc nghiệm 4 đáp án | Câu hỏi xuất hiện, đáp án đúng lưu ở BE |
| 4.2 | Filter theo môn học & độ khó | Bảng filter chính xác |
| 4.3 | Xóa câu hỏi đang thuộc đề đã publish | BE từ chối, FE hiển thị Alert danger |

### 5. Teacher — Đề thi
| STT | Bước | Kỳ vọng |
|-----|------|----------|
| 5.1 | Tạo đề mới (chọn thủ công 3 câu hỏi) | Đề ở trạng thái DRAFT |
| 5.2 | Publish đề | Trạng thái đổi thành "Đã xuất bản" |
| 5.3 | Đóng đề | Trạng thái đổi thành "Đã đóng" |
| 5.4 | Tạo đề với randomConfig (5 dễ + 3 TB + 2 khó) | Đề chứa 10 câu random |

### 6. Student — Làm bài
| STT | Bước | Kỳ vọng |
|-----|------|----------|
| 6.1 | Vào `/student/exams` | Thấy đề PUBLISHED trong khung giờ |
| 6.2 | Click "Vào thi" | Trang xác nhận hiển thị thông tin đề |
| 6.3 | Click "Bắt đầu làm bài" | Redirect sang `/doing`, đồng hồ đếm ngược chạy |
| 6.4 | Chọn 1 đáp án, đợi 600ms | `save-answer` được gọi (network tab) |
| 6.5 | Reload trang (F5) | Đáp án đã chọn vẫn còn (BE phục hồi từ attempt) |
| 6.6 | Đợi hết giờ | Tự động nộp bài, redirect sang `/student/results/[id]` |
| 6.7 | Rời tab 3 lần (Alt+Tab hoặc minimize) | Tự động nộp bài, hiển thị Alert warning |
| 6.8 | Click "Nộp bài" thủ công | Modal xác nhận, nộp xong → results |
| 6.9 | Truy cập `/student/results` | Thấy kết quả vừa nộp |
| 6.10 | Click "Xem" trên 1 kết quả | Chi tiết từng câu, badge Đạt/Chưa đạt |

### 7. Responsive & Polish
| STT | Bước | Kỳ vọng |
|-----|------|----------|
| 7.1 | Resize browser xuống 375px | Menu sidebar ẩn, bảng cuộn ngang |
| 7.2 | Mở trên mobile (DevTools) | Layout 1 cột, palette ẩn, footer nút "Nộp bài" sticky |

## Smoke test tự động
File `__tests__/smoke.test.ts` kiểm tra các helper pure-function (format, validators).
Chạy bằng: `npm run test` (sau khi bổ sung Vitest ở giai đoạn 2).
