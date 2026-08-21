# PROCEDURE ngắn gọn — Hệ thống Quản lý Thi Trắc Nghiệm

> Bộ procedure Oracle 19c **siêu gọn**, mỗi cái chỉ làm 1 việc duy nhất, phục vụ cho việc demo / học tập trong môn **Quản trị CSDL nâng cao**.

---

## Mục lục
1. [Khóa / Mở tài khoản](#1-khóa--mở-tài-khoản)
2. [Thêm / Xóa học viên khỏi lớp](#2-thêm--xóa-học-viên-khỏi-lớp)
3. [Đổi trạng thái đề thi](#3-đổi-trạng-thái-đề-thi)
4. [Procedure có tham số OUT](#4-procedure-có-tham-số-out)

---

## 1. Khóa / Mở tài khoản

### 1.1. Khóa 1 tài khoản
```sql
CREATE OR REPLACE PROCEDURE SP_LOCK_USER (p_user_id IN NUMBER) AS
BEGIN
  UPDATE USERS
  SET    STATUS = 'LOCKED', UPDATED_AT = SYSTIMESTAMP
  WHERE  ID = p_user_id;
END;
/
```
**Giải thích:**
- Nhận vào `p_user_id` → chỉ cần **1 lệnh UPDATE** để đổi `STATUS = 'LOCKED'`.
- Đây là chiến lược **soft-delete** của dự án: không xóa user mà chỉ khóa, giữ nguyên lịch sử.

### 1.2. Mở khóa 1 tài khoản
```sql
CREATE OR REPLACE PROCEDURE SP_UNLOCK_USER (p_user_id IN NUMBER) AS
BEGIN
  UPDATE USERS
  SET    STATUS = 'ACTIVE', UPDATED_AT = SYSTIMESTAMP
  WHERE  ID = p_user_id;
END;
/
```
**Giải thích:** Ngược lại của `SP_LOCK_USER` — đổi `STATUS` về `'ACTIVE'` để user đăng nhập lại được.

### 1.3. Xóa cứng 1 tài khoản
```sql
CREATE OR REPLACE PROCEDURE SP_DELETE_USER (p_user_id IN NUMBER) AS
BEGIN
  DELETE FROM USERS WHERE ID = p_user_id;
END;
/
```
**Giải thích:** Xóa cứng — nhờ `ON DELETE CASCADE` ở schema, các bản ghi liên quan (`EXAM_ATTEMPTS`, `CLASS_STUDENTS`, `EXAM_RESULTS`...) cũng tự động bị xóa theo.

---

## 2. Thêm / Xóa học viên kh�i lớp

### 2.1. Thêm 1 học viên vào lớp
```sql
CREATE OR REPLACE PROCEDURE SP_ADD_STUDENT_TO_CLASS (
  p_class_id   IN NUMBER,
  p_student_id IN NUMBER
) AS
BEGIN
  INSERT INTO CLASS_STUDENTS (CLASS_ID, STUDENT_ID)
  VALUES (p_class_id, p_student_id);
END;
/
```
**Giải thích:** Chèn 1 dòng vào bảng trung gian N-N. Nếu học viên đã có trong lớp, khóa chính tổng hợp `(CLASS_ID, STUDENT_ID)` sẽ tự chặn (ném lỗi ORA-00001).

### 2.2. Xóa 1 học viên khỏi lớp
```sql
CREATE OR REPLACE PROCEDURE SP_REMOVE_STUDENT_FROM_CLASS (
  p_class_id   IN NUMBER,
  p_student_id IN NUMBER
) AS
BEGIN
  DELETE FROM CLASS_STUDENTS
  WHERE  CLASS_ID   = p_class_id
    AND  STUDENT_ID = p_student_id;
END;
/
```
**Giải thích:** Xóa đúng 1 dòng quan hệ N-N — không ảnh hư�ng tới bảng `USERS` hay `CLASSES`.

---

## 3. Đổi trạng thái đề thi

### 3.1. Xuất bản đề thi (DRAFT → PUBLISHED)
```sql
CREATE OR REPLACE PROCEDURE SP_PUBLISH_EXAM (p_exam_id IN NUMBER) AS
BEGIN
  UPDATE EXAMS
  SET    STATUS = 'PUBLISHED', UPDATED_AT = SYSTIMESTAMP
  WHERE  ID     = p_exam_id
    AND  STATUS = 'DRAFT';
END;
/
```
**Giải thích:** Chỉ chuyển trạng thái khi đề đang ở `DRAFT` — thêm điều kiện `STATUS = 'DRAFT'` để tránh ghi đè các trạng thái khác.

### 3.2. Đóng đề thi (PUBLISHED → CLOSED)
```sql
CREATE OR REPLACE PROCEDURE SP_CLOSE_EXAM (p_exam_id IN NUMBER) AS
BEGIN
  UPDATE EXAMS
  SET    STATUS = 'CLOSED', UPDATED_AT = SYSTIMESTAMP
  WHERE  ID     = p_exam_id
    AND  STATUS = 'PUBLISHED';
END;
/
```
**Giải thích:** Tương tự trên — chỉ đóng khi đề đang `PUBLISHED`. Không thể "đóng" một đề đã `CLOSED` (lệnh UPDATE sẽ không ảnh hưởng dòng nào).

---

## 4. Procedure có tham số OUT

### 4.1. Đếm số câu hỏi của 1 môn
```sql
CREATE OR REPLACE PROCEDURE SP_COUNT_QUESTIONS (
  p_subject_id IN  NUMBER,
  p_total      OUT NUMBER
) AS
BEGIN
  SELECT COUNT(*) INTO p_total
  FROM   QUESTIONS
  WHERE  SUBJECT_ID = p_subject_id;
END;
/
```
**Giải thích:**
- `IN` — tham số đầu vào (id môn học).
- `OUT` — tham số đầu ra, procedure sẽ **gán giá trị** cho biến này để trả về cho nơi gọi.
- `SELECT ... INTO p_total` — Oracle gán kết quả `COUNT(*)` vào biến OUT.

**Cách dùng (trong SQL*Plus / SQLcl):**
```sql
SET SERVEROUTPUT ON
DECLARE
  v_total NUMBER;
BEGIN
  SP_COUNT_QUESTIONS(1, v_total);
  DBMS_OUTPUT.PUT_LINE('Tong cau hoi: ' || v_total);
END;
/
```

### 4.2. Đếm tổng học viên đang hoạt động
```sql
CREATE OR REPLACE PROCEDURE SP_COUNT_ACTIVE_STUDENTS (
  p_total OUT NUMBER
) AS
BEGIN
  SELECT COUNT(*) INTO p_total
  FROM   USERS
  WHERE  ROLE = 'STUDENT' AND STATUS = 'ACTIVE';
END;
/
```
**Giải thích:** Procedure không cần tham số `IN` — chỉ trả về 1 con số tổng qua `OUT`. Rất tiện cho các dashboard "snapshot nhanh".

---

## So sánh độ phức tạp

| Procedure | Số dòng thân | Mục đích |
|---|---|---|
| `SP_LOCK_USER` | 3 | Khóa tài khoản |
| `SP_UNLOCK_USER` | 3 | Mở khóa tài khoản |
| `SP_DELETE_USER` | 2 | Xóa tài khoản |
| `SP_ADD_STUDENT_TO_CLASS` | 3 | Thêm học viên vào lớp |
| `SP_REMOVE_STUDENT_FROM_CLASS` | 5 | Xóa học viên khỏi lớp |
| `SP_PUBLISH_EXAM` | 4 | Xuất bản đề thi |
| `SP_CLOSE_EXAM` | 4 | Đóng đề thi |
| `SP_COUNT_QUESTIONS` | 4 | Đếm câu hỏi (có OUT) |
| `SP_COUNT_ACTIVE_STUDENTS` | 4 | Đếm học viên (có OUT) |

> Tất cả đều chỉ **1 câu lệnh DML** bên trong → rất dễ nhớ, dễ test, dễ bảo trì.
