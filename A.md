# Tổng hợp câu lệnh SQL — Hệ thống Quản lý Thi Trắc Nghiệm

> Tài liệu tham khảo nhanh các câu lệnh SQL (truy vấn, trigger, procedure) ngắn gọn, đơn giản sử dụng trong dự án.
> Hệ CSDL: **Oracle 19c** — Schema gồm 11 bảng chính: `USERS`, `SUBJECTS`, `QUESTIONS`, `CLASSES`, `CLASS_STUDENTS`, `EXAMS`, `EXAM_QUESTIONS`, `EXAM_CLASSES`, `EXAM_ATTEMPTS`, `ATTEMPT_ANSWERS`, `VIOLATIONS`, `EXAM_RESULTS`, `RESULT_ANSWERS`.

---

## Mục lục

1. [Truy vấn SELECT — Đơn giản](#1-truy-vấn-select--đơn-giản)
2. [Truy vấn SELECT — Nâng cao (JOIN, GROUP BY, phân trang)](#2-truy-vấn-select--nâng-cao)
3. [Câu lệnh DML (INSERT / UPDATE / DELETE)](#3-câu-lệnh-dml)
4. [Trigger](#4-trigger)
5. [Procedure & Function](#5-procedure--function)

---

## 1. Truy vấn SELECT — Đơn giản

### 1.1. Lấy toàn bộ tài khoản đang hoạt động

```sql
SELECT ID, FULL_NAME, EMAIL, ROLE
FROM   USERS
WHERE  STATUS = 'ACTIVE'
ORDER  BY ID;
```

**Giải thích:** Liệt kê các cột cần thiết (ID, họ tên, email, vai trò) của những user `ACTIVE`. Câu này thường dùng cho trang quản trị người dùng.

### 1.2. Đếm số câu hỏi của từng môn

```sql
SELECT SUBJECT_ID, COUNT(*) AS TOTAL
FROM   QUESTIONS
GROUP  BY SUBJECT_ID;
```

**Giải thích:** Dùng `GROUP BY` để gom câu hỏi theo môn và đếm tổng số câu của mỗi môn — phục vụ cho dashboard giáo viên.

### 1.3. Lấy đề thi đang mở trong khoảng thời gian hiện tại

```sql
SELECT ID, TITLE, START_TIME, END_TIME
FROM   EXAMS
WHERE  STATUS   = 'PUBLISHED'
  AND  SYSTIMESTAMP BETWEEN START_TIME AND END_TIME;
```

**Giải thích:** Tận dụng `SYSTIMESTAMP` (thời điểm hiện tại của server Oracle) để lọc các đề đang trong cửa sổ thi — tương ứng index `IDX_EXAMS_STATUS_START`.

### 1.4. Lấy danh sách học viên thuộc một lớp cụ thể

```sql
SELECT u.ID, u.FULL_NAME, u.EMAIL
FROM   USERS u
JOIN   CLASS_STUDENTS cs ON cs.STUDENT_ID = u.ID
WHERE  cs.CLASS_ID = :class_id
  AND  u.ROLE = 'STUDENT';
```

**Giải thích:** `JOIN` bảng trung gian `CLASS_STUDENTS` để lấy học viên của một lớp. Dùng `:class_id` (bind parameter) để chống SQL Injection — đúng chuẩn backend đang áp dụng.

---

## 2. Truy vấn SELECT — Nâng cao

### 2.1. Xếp hạng học viên theo điểm trung bình của một môn

```sql
SELECT u.ID, u.FULL_NAME,
       ROUND(AVG(r.SCORE), 2) AS AVG_SCORE,
       COUNT(r.ID)            AS TOTAL_ATTEMPTS
FROM   USERS u
JOIN   EXAM_RESULTS r ON r.STUDENT_ID = u.ID
JOIN   EXAMS        e ON e.ID = r.EXAM_ID
WHERE  u.ROLE = 'STUDENT'
  AND  e.SUBJECT_ID = :subject_id
GROUP  BY u.ID, u.FULL_NAME
ORDER  BY AVG_SCORE DESC;
```

**Giải thích:** `AVG()` + `COUNT()` kết hợp `GROUP BY` để thống kê điểm TB và số lần thi theo từng học viên trong một môn cụ thể.

### 2.2. Phân trang danh sách câu hỏi (trang 2, mỗi trang 10 câu)

```sql
SELECT *
FROM   QUESTIONS
ORDER  BY ID DESC
OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY;
```

**Giải thích:** Cú pháp chuẩn Oracle 12c+ dùng `OFFSET ... ROWS FETCH NEXT ... ROWS ONLY` để phân trang — tương ứng logic pagination ở backend.

### 2.3. Học viên chưa từng làm bài thi nào

```sql
SELECT u.*
FROM   USERS u
WHERE  u.ROLE = 'STUDENT'
  AND  NOT EXISTS (
    SELECT 1 FROM EXAM_ATTEMPTS a WHERE a.STUDENT_ID = u.ID
  );
```

**Giải thích:** `NOT EXISTS` kiểm tra "không tồn tại attempt nào" — thường dùng để nhắc nh� hoặc đánh dấu học viên chưa hoàn thành bài thi.

### 2.4. Thống kê t�ng quan cho Admin Dashboard

```sql
SELECT
  (SELECT COUNT(*) FROM USERS    WHERE ROLE = 'STUDENT' AND STATUS = 'ACTIVE') AS TOTAL_STUDENTS,
  (SELECT COUNT(*) FROM SUBJECTS)                                                AS TOTAL_SUBJECTS,
  (SELECT COUNT(*) FROM EXAMS    WHERE STATUS = 'PUBLISHED')                     AS TOTAL_EXAMS,
  (SELECT COUNT(*) FROM EXAM_ATTEMPTS)                                            AS TOTAL_ATTEMPTS,
  (SELECT ROUND(AVG(SCORE), 2) FROM EXAM_RESULTS)                                 AS AVG_SCORE
FROM DUAL;
```

**Giải thích:** Mỗi `SELECT` con trả về 1 dòng 1 cột → gộp thành 1 dòng tóm tắt. `FROM DUAL` là bảng ảo chuẩn Oracle khi không cần nguồn dữ liệu thật.

### 2.5. Tỉ lệ đậu/rớt toàn hệ thống

```sql
SELECT
  SUM(CASE WHEN PASSED = 'Y' THEN 1 ELSE 0 END) AS PASSED,
  SUM(CASE WHEN PASSED = 'N' THEN 1 ELSE 0 END) AS FAILED,
  ROUND( SUM(CASE WHEN PASSED = 'Y' THEN 1 ELSE 0 END) * 100.0
       / COUNT(*), 2)                          AS PASS_RATE
FROM EXAM_RESULTS;
```

**Giải thích:** Dùng `CASE WHEN` để đếm có điều kiện (conditional aggregation) — một kỹ thuật rất hay thay cho nhiều `COUNT(*)` riêng lẻ.

---

## 3. Câu lệnh DML

### 3.1. Thêm mới một môn học

```sql
INSERT INTO SUBJECTS (NAME, CODE, DESCRIPTION, CREATED_BY)
VALUES ('Cơ sở dữ liệu', 'CSDL', 'Môn học nền tảng về CSDL', :user_id);
```

**Giải thích:** Chèn một môn học mới với 4 tham số. Cột `CREATED_AT`, `UPDATED_AT` sẽ tự sinh nhờ `DEFAULT SYSTIMESTAMP`. `:user_id` là ID admin/giáo viên tạo môn (FK → `USERS.ID`).

### 3.2. Cập nhật trạng thái tài khoản (khóa/mở)

```sql
UPDATE USERS
SET    STATUS     = 'LOCKED',
       UPDATED_AT = SYSTIMESTAMP
WHERE  ID = :user_id;
```

**Giải thích:** "Khóa" tài khoản thay vì xóa cứng — chiến lược **soft-delete** trong dự án. `UPDATED_AT` sẽ tự động cập nhật nếu có trigger `TRG_USERS_UPDATED_AT`.

### 3.3. Thêm câu hỏi vào đề thi (bảng trung gian N-N)

```sql
INSERT INTO EXAM_QUESTIONS (EXAM_ID, QUESTION_ID, POSITION)
SELECT :exam_id, q.ID, ROWNUM
FROM   QUESTIONS q
WHERE  q.SUBJECT_ID = :subject_id
  AND  q.DIFFICULTY = 'EASY'
  AND  ROWNUM <= 5;
```

**Giải thích:** Chèn nhanh 5 câu hỏi EASY vào đề — minh họa cách seed nhanh danh sách câu hỏi cho một đề. `POSITION` đánh số thứ tự hiển thị.

### 3.4. Xóa kết quả thi của một học viên

```sql
DELETE FROM EXAM_RESULTS
WHERE       STUDENT_ID = :student_id
  AND       EXAM_ID    = :exam_id;
```

**Giải thích:** Xóa theo khóa chính tổng hợp `(EXAM_ID, STUDENT_ID)` — các bản ghi `RESULT_ANSWERS` liên quan sẽ tự động xóa theo nhờ `ON DELETE CASCADE`.

---

## 4. Trigger

> Trigger là đoạn PL/SQL tự động chạy khi có sự kiện `INSERT/UPDATE/DELETE` trên bảng. Trong dự án, các trigger dưới đây là **đề xuất bổ sung** để minh họa sức mạnh xử lý nghiệp vụ ngay tại tầng database.

### 4.1. Tự động cập nhật `UPDATED_AT` khi sửa bản ghi

```sql
CREATE OR REPLACE TRIGGER TRG_USERS_UPDATED_AT
BEFORE UPDATE ON USERS
FOR EACH ROW
BEGIN
  :NEW.UPDATED_AT := SYSTIMESTAMP;
END;
/
```

**Giải thích:**

- `BEFORE UPDATE` — chạy **trước** khi bản ghi được cập nhật.
- `FOR EACH ROW` — chạy cho **từng dòng** bị ảnh hưởng (row-level trigger).
- `:NEW.UPDATED_AT` — tham chiếu đến giá trị mới của cột `UPDATED_AT` trong dòng sắp được ghi.
- Mục đích: bất kỳ ai `UPDATE` bảng `USERS` cũng không cần nhớ set `UPDATED_AT` — Oracle tự lo.

### 4.2. Kiểm tra logic th�i gian đề thi trước khi lưu

```sql
CREATE OR REPLACE TRIGGER TRG_EXAMS_VALIDATE_TIME
BEFORE INSERT OR UPDATE ON EXAMS
FOR EACH ROW
BEGIN
  IF :NEW.END_TIME <= :NEW.START_TIME THEN
    RAISE_APPLICATION_ERROR(-20001, 'END_TIME phai lon hon START_TIME');
  END IF;
END;
/
```

**Giải thích:** Mặc dù đã có `CHECK (END_TIME > START_TIME)` ở schema, trigger này giúp đưa ra **thông báo lỗi thân thiện** bằng tiếng Việt thay vì message mặc định của Oracle, cải thiện trải nghiệm debug.

### 4.3. Ngăn chỉnh sửa câu hỏi đã nằm trong đề đã xuất bản

```sql
CREATE OR REPLACE TRIGGER TRG_QUESTIONS_LOCK_PUBLISHED
BEFORE UPDATE OR DELETE ON QUESTIONS
FOR EACH ROW
DECLARE
  v_published_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_published_count
  FROM   EXAM_QUESTIONS eq
  JOIN   EXAMS e ON e.ID = eq.EXAM_ID
  WHERE  eq.QUESTION_ID = :OLD.ID
    AND  e.STATUS = 'PUBLISHED';

  IF v_published_count > 0 THEN
    RAISE_APPLICATION_ERROR(-20002,
      'Khong the sua/xoa cau hoi da nam trong de da xuat ban');
  END IF;
END;
/
```

**Giải thích:** Đảm bảo **tính toàn vẹn dữ liệu lịch sử** — câu hỏi đã có học viên làm thì không được phép âm thầm thay đổi/xóa (tránh ảnh hưởng tới kết quả đã chấm). `:OLD.ID` là ID của dòng sắp bị `UPDATE/DELETE`.

---

## 5. Procedure & Function

### 5.1. Hàm tính điểm cho một lượt thi (Function)

```sql
CREATE OR REPLACE FUNCTION FN_CALC_SCORE (p_attempt_id IN NUMBER)
  RETURN NUMBER
  DETERMINISTIC
IS
  v_score NUMBER := 0;
BEGIN
  SELECT SUM(CASE
               WHEN aa.SELECTED_OPTION IS NOT NULL
                    AND aa.SELECTED_OPTION = q.CORRECT_ANSWER
               THEN q.POINT
               ELSE 0
             END)
  INTO   v_score
  FROM   ATTEMPT_ANSWERS aa
  JOIN   QUESTIONS q ON q.ID = aa.QUESTION_ID
  WHERE  aa.ATTEMPT_ID = p_attempt_id;

  RETURN v_score;
END;
/
```

**Giải thích:**

- `FUNCTION ... RETURN NUMBER` — hàm trả về một giá trị số (điểm).
- `DETERMINISTIC` — gợi ý Oracle rằng với cùng input, hàm luôn trả về cùng output → cho phép tối ưu caching.
- Tham số `p_attempt_id IN NUMBER` — ID của lượt thi cần tính điểm.
- Câu lệnh `SELECT ... INTO v_score` lấy tổng điểm của những câu trả lời đúng (`SELECTED_OPTION = CORRECT_ANSWER`).

**Cách dùng:**

```sql
SELECT FN_CALC_SCORE(123) FROM DUAL;
```

### 5.2. Procedure chấm điểm và lưu kết quả

```sql
CREATE OR REPLACE PROCEDURE SP_GRADE_ATTEMPT (
  p_attempt_id IN NUMBER,
  p_pass_score IN NUMBER DEFAULT 5
) AS
  v_correct   NUMBER;
  v_wrong     NUMBER;
  v_score     NUMBER(6,2);
  v_result_id NUMBER;
BEGIN
  -- 1. Tính số câu đúng / sai
  SELECT SUM(CASE WHEN aa.SELECTED_OPTION = q.CORRECT_ANSWER THEN 1 ELSE 0 END),
         SUM(CASE WHEN aa.SELECTED_OPTION != q.CORRECT_ANSWER THEN 1 ELSE 0 END)
  INTO   v_correct, v_wrong
  FROM   ATTEMPT_ANSWERS aa
  JOIN   QUESTIONS q ON q.ID = aa.QUESTION_ID
  WHERE  aa.ATTEMPT_ID = p_attempt_id;

  -- 2. Tính tổng điểm (gọi lại Function ở trên)
  v_score := FN_CALC_SCORE(p_attempt_id);

  -- 3. Insert / Update vào EXAM_RESULTS
  MERGE INTO EXAM_RESULTS tgt
  USING (SELECT p_attempt_id AS ATTEMPT_ID FROM DUAL) src
  ON    (tgt.ID = (SELECT EXAM_ID FROM EXAM_ATTEMPTS WHERE ID = p_attempt_id))
  WHEN MATCHED THEN UPDATE SET ...
  ;
  -- (Logic MERGE/UPSERT đầy đủ xem trong DATABASE_PRESENTATION.md)
END;
/
```

**Giải thích:**

- `PROCEDURE` khác `FUNCTION` ở chỗ: procedure **không trả về giá trị trực tiếp**, dùng để thực hiện một chuỗi thao tác (insert/update/log...).
- `DEFAULT 5` — tham số `p_pass_score` có giá trị mặc định là 5, gọi procedure mà không truyền vào thì Oracle tự dùng 5.
- Thân procedure chia thành 3 bước rõ ràng: tính điểm → chấm → lưu kết quả.

### 5.3. Procedure random câu hỏi theo độ khó (dùng để soạn đề tự động)

```sql
CREATE OR REPLACE PROCEDURE SP_RANDOM_QUESTIONS (
  p_subject_id   IN  NUMBER,
  p_easy_count   IN  NUMBER,
  p_medium_count IN  NUMBER,
  p_hard_count   IN  NUMBER,
  p_result       OUT SYS_REFCURSOR
) AS
BEGIN
  OPEN p_result FOR
  SELECT * FROM (
    SELECT q.* FROM QUESTIONS q
    WHERE SUBJECT_ID = p_subject_id AND DIFFICULTY = 'EASY'
    ORDER BY DBMS_RANDOM.VALUE
  ) WHERE ROWNUM <= p_easy_count
  UNION ALL
  SELECT * FROM (
    SELECT q.* FROM QUESTIONS q
    WHERE SUBJECT_ID = p_subject_id AND DIFFICULTY = 'MEDIUM'
    ORDER BY DBMS_RANDOM.VALUE
  ) WHERE ROWNUM <= p_medium_count
  UNION ALL
  SELECT * FROM (
    SELECT q.* FROM QUESTIONS q
    WHERE SUBJECT_ID = p_subject_id AND DIFFICULTY = 'HARD'
    ORDER BY DBMS_RANDOM.VALUE
  ) WHERE ROWNUM <= p_hard_count;
END;
/
```

**Giải thích:**

- Tham số `OUT SYS_REFCURSOR` — procedure trả về **một con trỏ** (cursor) chứa danh sách câu hỏi đã random.
- `DBMS_RANDOM.VALUE` — sinh số ng�u nhiên cho mỗi dòng → `ORDER BY` giúp lấy ngẫu nhiên.
- `UNION ALL` gộp 3 nhóm EASY + MEDIUM + HARD theo đúng số lượng yêu cầu.
- Đây là procedure backend Node.js đang **gọi để sinh đề tự động** cho giáo viên.

### 5.4. Procedure đóng tất cả đề thi đã quá hạn (batch job)

```sql
CREATE OR REPLACE PROCEDURE SP_CLOSE_PAST_EXAMS AS
BEGIN
  UPDATE EXAMS
  SET    STATUS     = 'CLOSED',
         UPDATED_AT = SYSTIMESTAMP
  WHERE  STATUS     = 'PUBLISHED'
    AND  END_TIME   <  SYSTIMESTAMP;
  COMMIT;
END;
/
```

**Giải thích:** Một procedure siêu gọn dùng để chạy định kỳ (có thể qua `DBMS_SCHEDULER`):

- Duyệt mọi đề `PUBLISHED` đã quá `END_TIME` → đổi sang `CLOSED`.
- Thường được lập lịch chạy mỗi 5–10 phút để giữ trạng thái đề luôn đúng với thực tế.

---

## Tài liệu liên quan

- `backend/database/schema.sql` — Định nghĩa các bảng, ràng buộc, index.
- `backend/database/seed.sql` — File chèn dữ liệu mẫu + index bổ sung.
- `DATABASE_INTRODUCTION.md` — Giới thiệu tổng quan về CSDL của dự án.
- `DATABASE_PRESENTATION.md` — Phiên bản đầy đủ với nhiều trigger/procedure nâng cao hơn.

