# Hệ Thống Quản Lý Thi Trắc Nghiệm — Tài Liệu Cơ Sở Dữ Liệu

> **Môn học:** Quản trị CSDL nâng cao (Thạc sĩ)
> **Hệ quản trị CSDL:** Oracle Database 19c
> **Phạm vi:** Giới thiệu dự án · Lược đồ CSDL · Cài đặt · Truy vấn · Trigger · Procedure
> **Ngày cập nhật:** 19/08/2026

---

## Mục lục

1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Lược đồ cơ sở dữ liệu](#2-lược-đồ-cơ-sở-dữ-liệu)
   - 2.1. Sơ đồ ER
   - 2.2. Danh sách bảng
   - 2.3. Các ràng buộc toàn vẹn (Constraints)
   - 2.4. Chỉ mục (Indexes)
3. [Cài đặt Oracle](#3-cài-đặt-oracle)
4. [Các câu lệnh DDL — Tạo & quản lý schema](#4-các-câu-lệnh-ddl--tạo--quản-lý-schema)
5. [Các câu lệnh DML — Thao tác dữ liệu](#5-các-câu-lệnh-dml--thao-tác-dữ-liệu)
6. [Truy vấn dữ liệu (SELECT)](#6-truy-vấn-dữ-liệu-select)
7. [Trigger — Đề xuất bổ sung](#7-trigger--đề-xuất-bổ-sung)
8. [Procedure / Function — Đề xuất bổ sung](#8-procedure--function--đề-xuất-bổ-sung)
9. [Demo trên Oracle Live SQL](#9-demo-trên-oracle-live-sql)
10. [Kết luận](#10-kết-luận)

---

## 1. Giới thiệu dự án

### 1.1. Bối cảnh

Trong các cơ sở đào tạo hiện nay, việc tổ chức **thi trắc nghiệm** vẫn còn nhiều hạn chế:
- Tốn thời gian in ấn đề, chấm bài thủ công.
- Khó thống kê, đánh giá kết quả theo thời gian thực.
- Khó đảm bảo tính công bằng và chống gian lận.

Dự án **"Hệ thống Quản lý Thi Trắc Nghiệm"** ra đời nhằm:
- Số hóa toàn bộ quy trình **Tạo đề → Phân công → Làm bài → Chấm điểm → Báo cáo**.
- Hỗ trợ 3 vai trò: **Admin** · **Giáo viên** · **Học viên**.
- Tận dụng sức mạnh của **Oracle 19c** để đảm bảo tính toàn vẹn, bảo mật và hiệu năng cao.

### 1.2. Công nghệ sử dụng

| Thành phần | Stack |
| --- | --- |
| Frontend | Next.js 14 · React 18 · TypeScript · Ant Design 5 |
| Backend | Node.js 20 · Express 4 · TypeScript |
| Cơ sở dữ liệu | **Oracle Database 19c** |
| Driver | `oracledb` 6.x (connection pool) |
| Realtime | Socket.IO (cảnh báo gian lận tới giáo viên) |
| Auth | JWT (stateless) + bcrypt |

### 1.3. Tính năng chính

- **Ngân hàng câu hỏi:** 4 đáp án A/B/C/D, có độ khó (EASY/MEDIUM/HARD), chương, điểm.
- **Tạo đề thi thông minh:** Chọn thủ công HOẶC random theo độ khó.
- **Phân công lớp:** Một đề có thể giao cho nhiều lớp; nhiều học viên cùng lớp sẽ thấy đề.
- **Làm bài:** Đếm ngược, xáo trộn câu hỏi/đáp án, chống gian lận (tab switch, fullscreen exit).
- **Chấm điểm tự động:** So đáp án, tính điểm theo thang 10, đánh dấu ĐẠT/CHƯA ĐẠT.
- **Báo cáo thống kê:** Dashboard tổng quan, dashboard giáo viên, thống kê theo đề/lớp/học viên.

---

## 2. Lược đồ cơ sở dữ liệu

### 2.1. Sơ đồ ER

```
USERS (1) ──────────────── (∞) SUBJECTS (1) ────── (∞) QUESTIONS
   │                              │                       │
   │ (1)                          │ (1)                   │ (∞)
   │                              ▼                       ▼
   │                          EXAMS (1) ────── (∞) EXAM_QUESTIONS
   │                              │
   │ (1)                          │ (1)
   │                              ▼ (∞)
   │                          EXAM_ATTEMPTS (1) ──── (∞) ATTEMPT_ANSWERS
   │                              │                       │
   │ (1)                          │ (1)                   │
   │                              ▼ (∞)                   │
   │                          VIOLATIONS                  │
   │                              │                       │
   │                              ▼ (0..1)                │
   │                          EXAM_RESULTS (1) ───── (∞) RESULT_ANSWERS
   │
   └─ (∞) CLASSES (∞) ──────── CLASS_STUDENTS ────── (∞) STUDENT (USERS)
                          (∞)
                  EXAM_CLASSES ────── (∞) CLASSES
```

**Tổng cộng: 11 bảng** (xem chi tiết bên dưới).

### 2.2. Danh sách bảng

| # | Bảng | Mục đích | Số cột | Ghi chú |
|---|------|---------|--------|---------|
| 1 | `USERS` | Tài khoản hệ thống (Admin/Teacher/Student) | 8 | Mật khẩu lưu dạng `bcrypt hash` |
| 2 | `SUBJECTS` | Môn học | 7 | `CODE` duy nhất |
| 3 | `QUESTIONS` | Ngân hàng câu hỏi trắc nghiệm | 14 | Tối đa 4 đáp án A/B/C/D |
| 4 | `CLASSES` | Lớp học | 5 | Có `TEACHER_ID` phụ trách |
| 5 | `CLASS_STUDENTS` | Quan hệ N-N Lớp - Học viên | 3 | Khóa chính ghép |
| 6 | `EXAMS` | Đề thi | 14 | Trạng thái DRAFT → PUBLISHED → CLOSED |
| 7 | `EXAM_QUESTIONS` | Quan hệ N-N Đề - Câu hỏi | 3 | Có thứ tự `POSITION` |
| 8 | `EXAM_CLASSES` | Quan hệ N-N Đề - Lớp được gán | 2 | Học viên lớp nào sẽ thấy đề này |
| 9 | `EXAM_ATTEMPTS` | Lượt thi của học viên | 9 | Mỗi học viên chỉ 1 attempt/đề |
| 10 | `ATTEMPT_ANSWERS` | Đáp án đang chọn (trước khi chấm) | 3 | `SELECTED_OPTION` có thể NULL |
| 11 | `VIOLATIONS` | Nhật ký gian lận | 4 | Lưu `TAB_SWITCH`, `FULLSCREEN_EXIT`, ... |
| 12 | `EXAM_RESULTS` | Kết quả sau chấm | 11 | SCORE, PASSED, ... |
| 13 | `RESULT_ANSWERS` | Chi tiết đáp án sau chấm | 4 | Có `IS_CORRECT` từng câu |

### 2.3. Các ràng buộc toàn vẹn (Constraints)

#### Ràng buộc KHÓA CHÍNH (Primary Key)
- Tất cả các bảng dùng cột `ID` với `NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY` (Oracle 12c+ Identity Column, tương đương AUTO_INCREMENT).
- Bảng quan hệ N-N (`CLASS_STUDENTS`, `EXAM_QUESTIONS`, `EXAM_CLASSES`) dùng **khóa chính ghép**.

#### Ràng buộc DUY NHẤT (Unique)

```sql
USERS.EMAIL                -- email không trùng
SUBJECTS.CODE              -- mã môn học không trùng
CLASSES.NAME               -- tên lớp không trùng
EXAM_ATTEMPTS (EXAM_ID, STUDENT_ID)        -- mỗi SV chỉ 1 attempt/đề
EXAM_RESULTS  (EXAM_ID, STUDENT_ID)        -- mỗi SV chỉ 1 kết quả/đề
CLASS_STUDENTS (CLASS_ID, STUDENT_ID)      -- không thêm SV 2 lần vào 1 lớp
EXAM_QUESTIONS (EXAM_ID, QUESTION_ID)
```

#### Ràng buộc KIỂM TRA (Check)

| Bảng | Điều kiện |
|------|-----------|
| `USERS` | `ROLE IN ('ADMIN','TEACHER','STUDENT')` |
| `USERS` | `STATUS IN ('ACTIVE','LOCKED')` |
| `QUESTIONS` | `CORRECT_ANSWER IN ('A','B','C','D')` |
| `QUESTIONS` | `DIFFICULTY IN ('EASY','MEDIUM','HARD')` |
| `QUESTIONS` | `POINT > 0 AND POINT <= 100` |
| `EXAMS` | `STATUS IN ('DRAFT','PUBLISHED','CLOSED')` |
| `EXAMS` | `END_TIME > START_TIME` |
| `EXAMS` | `DURATION_MINUTES > 0` |
| `EXAM_ATTEMPTS` | `STATUS IN ('IN_PROGRESS','SUBMITTED','EXPIRED')` |
| `ATTEMPT_ANSWERS` | `SELECTED_OPTION IS NULL OR SELECTED_OPTION IN ('A','B','C','D')` |

#### Ràng buộc KHÓA NGOẠI (Foreign Key)

```
SUBJECTS.CREATED_BY    → USERS(ID)             ON DELETE SET NULL
QUESTIONS.SUBJECT_ID   → SUBJECTS(ID)           ON DELETE CASCADE
QUESTIONS.CREATED_BY   → USERS(ID)             ON DELETE SET NULL
CLASSES.TEACHER_ID     → USERS(ID)             ON DELETE SET NULL
CLASS_STUDENTS.CLASS_ID   → CLASSES(ID)         ON DELETE CASCADE
CLASS_STUDENTS.STUDENT_ID → USERS(ID)           ON DELETE CASCADE
EXAMS.SUBJECT_ID       → SUBJECTS(ID)           ON DELETE CASCADE
EXAMS.CREATED_BY       → USERS(ID)             ON DELETE SET NULL
EXAM_QUESTIONS.EXAM_ID    → EXAMS(ID)           ON DELETE CASCADE
EXAM_QUESTIONS.QUESTION_ID → QUESTIONS(ID)      ON DELETE CASCADE
EXAM_CLASSES.EXAM_ID      → EXAMS(ID)           ON DELETE CASCADE
EXAM_CLASSES.CLASS_ID     → CLASSES(ID)         ON DELETE CASCADE
EXAM_ATTEMPTS.EXAM_ID     → EXAMS(ID)           ON DELETE CASCADE
EXAM_ATTEMPTS.STUDENT_ID  → USERS(ID)           ON DELETE CASCADE
ATTEMPT_ANSWERS.ATTEMPT_ID  → EXAM_ATTEMPTS(ID) ON DELETE CASCADE
ATTEMPT_ANSWERS.QUESTION_ID → QUESTIONS(ID)     ON DELETE CASCADE
VIOLATIONS.ATTEMPT_ID     → EXAM_ATTEMPTS(ID)   ON DELETE CASCADE
EXAM_RESULTS.EXAM_ID      → EXAMS(ID)           ON DELETE CASCADE
EXAM_RESULTS.STUDENT_ID   → USERS(ID)           ON DELETE CASCADE
RESULT_ANSWERS.RESULT_ID  → EXAM_RESULTS(ID)    ON DELETE CASCADE
RESULT_ANSWERS.QUESTION_ID → QUESTIONS(ID)      ON DELETE CASCADE
```

### 2.4. Chỉ mục (Indexes)

```sql
-- Tăng tốc lọc câu hỏi theo môn và độ khó (dùng trong random đề thi)
CREATE INDEX IDX_QUESTIONS_SUBJECT     ON QUESTIONS(SUBJECT_ID);
CREATE INDEX IDX_QUESTIONS_DIFFICULTY  ON QUESTIONS(SUBJECT_ID, DIFFICULTY);

-- Tăng tốc lọc đề thi theo trạng thái và thời gian
CREATE INDEX IDX_EXAMS_SUBJECT_STATUS  ON EXAMS(SUBJECT_ID, STATUS);
CREATE INDEX IDX_EXAMS_STATUS_START    ON EXAMS(STATUS, START_TIME, END_TIME);

-- Tăng tốc các truy vấn "sinh viên X đã làm đề nào"
CREATE INDEX IDX_ATTEMPTS_STUDENT      ON EXAM_ATTEMPTS(STUDENT_ID);
CREATE INDEX IDX_ATTEMPTS_EXAM         ON EXAM_ATTEMPTS(EXAM_ID);
CREATE INDEX IDX_RESULTS_STUDENT       ON EXAM_RESULTS(STUDENT_ID);

-- Tăng tốc tìm học viên của lớp & ngược lại
CREATE INDEX IDX_CLASS_STUDENTS_STUDENT ON CLASS_STUDENTS(STUDENT_ID);

-- Tăng tốc join câu hỏi / lớp từ bảng trung gian
CREATE INDEX IDX_EXAM_QUESTIONS_Q      ON EXAM_QUESTIONS(QUESTION_ID);
CREATE INDEX IDX_EXAM_CLASSES_CLASS    ON EXAM_CLASSES(CLASS_ID);

-- Tăng tốc truy vấn vi phạm theo attempt và thời gian
CREATE INDEX IDX_VIOLATIONS_ATTEMPT    ON VIOLATIONS(ATTEMPT_ID, OCCURRED_AT);
```

---

## 3. Cài đặt Oracle

### 3.1. Cài đặt nhanh bằng Docker (khuyến nghị cho dev)

```bash
# Tải image Oracle 19c từ Docker Hub
docker pull container-registry.oracle.com/database/express:19.5.0-ee

# Tạo container
docker run -d --name oracle-19c \
  -p 1521:1521 -p 5500:5500 \
  -e ORACLE_PWD=Oracle123 \
  -v oracle-volume:/opt/oracle/oradata \
  container-registry.oracle.com/database/express:19.5.0-ee

# Kiểm tra log (chờ 2-3 phút lần đầu)
docker logs -f oracle-19c
```

### 3.2. Kết nối bằng SQL*Plus hoặc SQL Developer

```bash
# Kết nối với quyền SYSDBA
sqlplus sys/Oracle123@//localhost:1521/ORCLPDB1 as sysdba

-- Tạo schema riêng cho dự án
ALTER SESSION SET CONTAINER = ORCLPDB1;
CREATE USER tracnghiem IDENTIFIED BY tracnghiem
  DEFAULT TABLESPACE USERS QUOTA UNLIMITED ON USERS;
GRANT CONNECT, RESOURCE, CREATE VIEW TO tracnghiem;

-- Kết nối với user vừa tạo
CONN tracnghiem/tracnghiem@//localhost:1521/ORCLPDB1
```

### 3.3. Cài đặt Oracle Instant Client (cho Node.js driver)

- Tải từ [oracle.com/instantclient](https://www.oracle.com/database/technologies/instant-client.html).
- Giải nén và **thêm vào PATH** (Windows) hoặc `LD_LIBRARY_PATH` (Linux/macOS).

```bash
# Windows PowerShell
$env:OCI_LIB_DIR = "C:\oracle\instantclient_19_19"
$env:PATH       += ";C:\oracle\instantclient_19_19"

# Linux / macOS
export OCI_LIB_DIR=/opt/oracle/instantclient_19_19
export LD_LIBRARY_PATH=$OCI_LIB_DIR:$LD_LIBRARY_PATH
```

### 3.4. Cài đặt schema của dự án

```bash
cd backend
mysql # (không dùng mysql, mà dùng SQL*Plus)
sqlplus tracnghiem/tracnghiem@//localhost:1521/ORCLPDB1
SQL> @database/schema.sql
SQL> @database/seed.sql   -- tùy chọn
```

Sau khi schema tạo xong, backend sẽ tự kết nối được qua file `.env`:

```env
DB_USER=tracnghiem
DB_PASSWORD=tracnghiem
DB_CONNECT_STRING=localhost:1521/ORCLPDB1
```

---

## 4. Các câu lệnh DDL — Tạo & quản lý schema

### 4.1. Tạo bảng (CREATE TABLE) — trích đoạn từ `schema.sql`

```sql
-- USERS: Tài khoản hệ thống ---------------------------------------
CREATE TABLE USERS (
  ID              NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY,
  FULL_NAME       VARCHAR2(120 CHAR)  NOT NULL,
  EMAIL           VARCHAR2(180 CHAR)  NOT NULL,
  PASSWORD_HASH   VARCHAR2(255 CHAR)  NOT NULL,
  ROLE            VARCHAR2(20 CHAR)   NOT NULL,
  STATUS          VARCHAR2(20 CHAR)   DEFAULT 'ACTIVE' NOT NULL,
  CREATED_AT      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
  UPDATED_AT      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT USERS_EMAIL_UN     UNIQUE (EMAIL),
  CONSTRAINT USERS_ROLE_CHK    CHECK  (ROLE IN ('ADMIN','TEACHER','STUDENT')),
  CONSTRAINT USERS_STATUS_CHK  CHECK  (STATUS IN ('ACTIVE','LOCKED'))
);

-- QUESTIONS: Ngân hàng câu hỏi --------------------------------------
CREATE TABLE QUESTIONS (
  ID              NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY,
  SUBJECT_ID      NUMBER NOT NULL,
  CONTENT         VARCHAR2(2000 CHAR) NOT NULL,
  OPTION_A        VARCHAR2(500 CHAR)  NOT NULL,
  OPTION_B        VARCHAR2(500 CHAR)  NOT NULL,
  OPTION_C        VARCHAR2(500 CHAR)  NOT NULL,
  OPTION_D        VARCHAR2(500 CHAR)  NOT NULL,
  CORRECT_ANSWER  CHAR(1) NOT NULL,
  DIFFICULTY      VARCHAR2(20 CHAR)   NOT NULL,
  CHAPTER         VARCHAR2(80 CHAR),
  POINT           NUMBER(6,2)         DEFAULT 1 NOT NULL,
  CREATED_BY      NUMBER,
  CREATED_AT      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
  UPDATED_AT      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT QUESTIONS_SUBJECT_FK    FOREIGN KEY (SUBJECT_ID)  REFERENCES SUBJECTS(ID) ON DELETE CASCADE,
  CONSTRAINT QUESTIONS_CREATED_BY_FK FOREIGN KEY (CREATED_BY)  REFERENCES USERS(ID)    ON DELETE SET NULL,
  CONSTRAINT QUESTIONS_CORRECT_CHK   CHECK (CORRECT_ANSWER IN ('A','B','C','D')),
  CONSTRAINT QUESTIONS_DIFF_CHK      CHECK (DIFFICULTY     IN ('EASY','MEDIUM','HARD')),
  CONSTRAINT QUESTIONS_POINT_CHK     CHECK (POINT > 0 AND POINT <= 100)
);

-- EXAM_ATTEMPTS: Mỗi SV chỉ 1 attempt/đề -------------------------
CREATE TABLE EXAM_ATTEMPTS (
  ID                NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY,
  EXAM_ID           NUMBER NOT NULL,
  STUDENT_ID        NUMBER NOT NULL,
  STARTED_AT        TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  END_TIME          TIMESTAMP NOT NULL,
  SUBMITTED_AT      TIMESTAMP,
  STATUS            VARCHAR2(20 CHAR) DEFAULT 'IN_PROGRESS' NOT NULL,
  IS_AUTO_SUBMITTED CHAR(1) DEFAULT 'N' NOT NULL,
  CONSTRAINT ATTEMPTS_EXAM_FK     FOREIGN KEY (EXAM_ID)    REFERENCES EXAMS(ID) ON DELETE CASCADE,
  CONSTRAINT ATTEMPTS_STUDENT_FK  FOREIGN KEY (STUDENT_ID) REFERENCES USERS(ID) ON DELETE CASCADE,
  CONSTRAINT ATTEMPTS_STATUS_CHK  CHECK  (STATUS IN ('IN_PROGRESS','SUBMITTED','EXPIRED')),
  CONSTRAINT ATTEMPTS_UN          UNIQUE  (EXAM_ID, STUDENT_ID)
);
```

### 4.2. Sửa bảng (ALTER TABLE)

```sql
-- Thêm cột
ALTER TABLE EXAMS ADD PASS_SCORE NUMBER(4,2) DEFAULT 5 NOT NULL;

-- Thêm ràng buộc CHECK
ALTER TABLE USERS
  ADD CONSTRAINT USERS_NAME_LEN_CHK CHECK (LENGTH(FULL_NAME) >= 2);

-- Bật / tắt ràng buộc FK
ALTER TABLE QUESTIONS ENABLE  CONSTRAINT QUESTIONS_SUBJECT_FK;
ALTER TABLE QUESTIONS DISABLE CONSTRAINT QUESTIONS_SUBJECT_FK;

-- Đổi tên cột (Oracle 9i+)
ALTER TABLE EXAMS RENAME COLUMN DURATION_MINUTES TO DURATION_MIN;

-- Đổi tên bảng
ALTER TABLE CLASS_STUDENTS RENAME TO ENROLLMENTS;
```

### 4.3. Tạo INDEX và SEQUENCE

```sql
-- Index đơn
CREATE INDEX IDX_USERS_ROLE ON USERS(ROLE);

-- Index composite
CREATE INDEX IDX_RESULTS_EXAM_SCORE ON EXAM_RESULTS(EXAM_ID, SCORE DESC);

-- Unique index (tương đương UNIQUE constraint nhưng có thể kèm nhiều cột)
CREATE UNIQUE INDEX UQ_EXAM_ATTEMPT_STUDENT ON EXAM_ATTEMPTS(EXAM_ID, STUDENT_ID);

-- Sequence (Oracle truyền thống — Identity Column là đủ cho dự án này)
CREATE SEQUENCE SEQ_USERS START WITH 1000 INCREMENT BY 1 NOCACHE;

-- Xem thông tin sequence
SELECT SEQ_USERS.NEXTVAL FROM DUAL;

-- Drop sequence
DROP SEQUENCE SEQ_USERS;
```

### 4.4. COMMENT, RENAME, DROP

```sql
-- Ghi chú cho bảng / cột (giúp ích cho DBA và BA)
COMMENT ON TABLE  EXAMS          IS 'Đề thi trắc nghiệm';
COMMENT ON COLUMN EXAMS.STATUS   IS 'DRAFT | PUBLISHED | CLOSED';

-- Đổi tên bảng / cột
RENAME OLD_TABLE_NAME TO NEW_TABLE_NAME;
ALTER TABLE EXAMS RENAME COLUMN OLD_COL TO NEW_COL;

-- Xóa bảng — toàn bộ dữ liệu + FK đến bảng này sẽ bị xóa (CASCADE)
DROP TABLE EXAMS CASCADE CONSTRAINTS;

-- Truncate (nhanh hơn DELETE, nhưng không ghi log, không kích hoạt trigger)
TRUNCATE TABLE VIOLATIONS;
```

### 4.5. Tạo VIEW

```sql
-- View tổng hợp danh sách đề + số câu + điểm tối đa
CREATE OR REPLACE VIEW V_EXAM_OVERVIEW AS
SELECT e.ID            AS EXAM_ID,
       e.TITLE,
       s.NAME          AS SUBJECT_NAME,
       e.STATUS,
       e.START_TIME,
       e.END_TIME,
       (SELECT COUNT(*) FROM EXAM_QUESTIONS eq WHERE eq.EXAM_ID = e.ID) AS NUM_QUESTIONS,
       (SELECT COUNT(DISTINCT ec.CLASS_ID) FROM EXAM_CLASSES ec WHERE ec.EXAM_ID = e.ID) AS NUM_CLASSES,
       (SELECT COUNT(*) FROM EXAM_ATTEMPTS a  WHERE a.EXAM_ID  = e.ID) AS NUM_ATTEMPTS
FROM   EXAMS   e
JOIN   SUBJECTS s ON s.ID = e.SUBJECT_ID;

-- View bảng xếp hạng theo điểm trung bình
CREATE OR REPLACE VIEW V_STUDENT_RANKING AS
SELECT u.ID          AS STUDENT_ID,
       u.FULL_NAME,
       u.EMAIL,
       COUNT(r.ID)   AS TOTAL_ATTEMPTS,
       ROUND(AVG(r.SCORE), 2) AS AVG_SCORE,
       SUM(CASE WHEN r.PASSED = 'Y' THEN 1 ELSE 0 END) AS PASSED_COUNT
FROM   USERS        u
LEFT   JOIN EXAM_RESULTS r ON r.STUDENT_ID = u.ID
WHERE  u.ROLE = 'STUDENT'
GROUP  BY u.ID, u.FULL_NAME, u.EMAIL;

-- Sử dụng view
SELECT * FROM V_EXAM_OVERVIEW  WHERE STATUS = 'PUBLISHED';
SELECT * FROM V_STUDENT_RANKING ORDER BY AVG_SCORE DESC FETCH FIRST 10 ROWS ONLY;
```

### 4.6. Synonym (alias cho object ở schema khác)

```sql
-- Admin thấy dữ liệu của user tracnghiem
CREATE SYNONYM SYN_TN_QUESTIONS FOR tracnghiem.QUESTIONS;
SELECT * FROM SYN_TN_QUESTIONS FETCH FIRST 5 ROWS ONLY;
```

---

## 5. Các câu lệnh DML — Thao tác dữ liệu

### 5.1. INSERT — Thêm dữ liệu

```sql
-- Thêm admin
INSERT INTO USERS (FULL_NAME, EMAIL, PASSWORD_HASH, ROLE, STATUS)
VALUES ('Quản Trị Viên', 'admin@local',
        '$2a$10$abcdefghijklmnopqrstuv', -- bcrypt hash mật khẩu 'Admin@123'
        'ADMIN', 'ACTIVE');

-- Thêm môn học (cần biết ID của admin vừa tạo)
INSERT INTO SUBJECTS (NAME, CODE, DESCRIPTION, CREATED_BY)
VALUES ('Lập trình Web', 'LTW', 'Môn học cơ sở', 1);

-- Thêm câu hỏi
INSERT INTO QUESTIONS (
  SUBJECT_ID, CONTENT, OPTION_A, OPTION_B, OPTION_C, OPTION_D,
  CORRECT_ANSWER, DIFFICULTY, CHAPTER, POINT, CREATED_BY
) VALUES (
  1,
  'Trong React, hook nào dùng để quản lý state?',
  'useEffect', 'useState', 'useRef', 'useMemo',
  'B', 'EASY', 'Hook cơ bản', 1, 1
);

-- Insert nhiều dòng cùng lúc (Oracle 23c / 19c không hỗ trợ VALUES nhiều dòng,
-- nhưng có thể dùng INSERT ALL hoặc forall từ procedure)
INSERT ALL
  INTO QUESTIONS (SUBJECT_ID, CONTENT, OPTION_A, OPTION_B, OPTION_C, OPTION_D,
                   CORRECT_ANSWER, DIFFICULTY, POINT, CREATED_BY)
  VALUES (1, 'Câu hỏi 1', 'A1', 'B1', 'C1', 'D1', 'A', 'EASY',   1, 1)
  INTO QUESTIONS (SUBJECT_ID, CONTENT, OPTION_A, OPTION_B, OPTION_C, OPTION_D,
                   CORRECT_ANSWER, DIFFICULTY, POINT, CREATED_BY)
  VALUES (1, 'Câu hỏi 2', 'A2', 'B2', 'C2', 'D2', 'B', 'MEDIUM', 2, 1)
SELECT 1 FROM DUAL;

COMMIT;  -- Kết thúc transaction
```

### 5.2. UPDATE — Cập nhật

```sql
-- Khóa tài khoản thay vì xóa cứng (soft lock)
UPDATE USERS SET STATUS = 'LOCKED', UPDATED_AT = SYSTIMESTAMP
WHERE EMAIL = 'sinhvien_cantruycap@x.com';

-- Cộng điểm cho một câu hỏi
UPDATE QUESTIONS
SET    POINT = POINT + 0.5
WHERE  ID = 100 AND POINT < 100;

-- Cập nhật trạng thái đề: DRAFT → PUBLISHED
UPDATE EXAMS
SET    STATUS = 'PUBLISHED', UPDATED_AT = SYSTIMESTAMP
WHERE  ID = 10 AND STATUS = 'DRAFT';

-- Cập nhật kết thúc đề khi hết giờ
UPDATE EXAM_ATTEMPTS
SET    STATUS = 'EXPIRED', SUBMITTED_AT = SYSTIMESTAMP
WHERE  STATUS = 'IN_PROGRESS' AND END_TIME <= SYSTIMESTAMP;
COMMIT;
```

### 5.3. DELETE — Xóa dữ liệu

```sql
-- Xóa vi phạm cũ hơn 1 năm
DELETE FROM VIOLATIONS
WHERE  OCCURRED_AT < ADD_MONTHS(SYSDATE, -12);

-- Xóa câu hỏi rác
DELETE FROM QUESTIONS
WHERE  ID = 100 AND NOT EXISTS (
  SELECT 1 FROM EXAM_QUESTIONS eq WHERE eq.QUESTION_ID = 100
);
```

### 5.4. MERGE — Upsert (Insert hoặc Update)

```sql
-- Lưu kết quả: nếu (EXAM_ID, STUDENT_ID) đã có thì UPDATE, chưa có thì INSERT
MERGE INTO EXAM_RESULTS tgt
USING (SELECT :exam_id AS EXAM_ID, :student_id AS STUDENT_ID FROM DUAL) src
ON    (tgt.EXAM_ID = src.EXAM_ID AND tgt.STUDENT_ID = src.STUDENT_ID)
WHEN MATCHED THEN
  UPDATE SET tgt.TOTAL_CORRECT = :tc,
             tgt.TOTAL_WRONG   = :tw,
             tgt.SCORE         = :score,
             tgt.PASSED        = :passed,
             tgt.GRADED_AT     = SYSTIMESTAMP
WHEN NOT MATCHED THEN
  INSERT (EXAM_ID, STUDENT_ID, TOTAL_CORRECT, TOTAL_WRONG, SCORE, PASSED)
  VALUES (:exam_id, :student_id, :tc, :tw, :score, :passed);
COMMIT;
```

---

## 6. Truy vấn dữ liệu (SELECT)

### 6.1. Truy vấn đơn giản

```sql
-- Lấy tất cả câu hỏi EASY của môn Lập trình Web
SELECT q.ID, q.CONTENT, q.OPTION_A, q.OPTION_B, q.OPTION_C, q.OPTION_D,
       q.CORRECT_ANSWER, q.POINT
FROM   QUESTIONS q
JOIN   SUBJECTS  s ON s.ID = q.SUBJECT_ID
WHERE  s.CODE = 'LTW'
  AND  q.DIFFICULTY = 'EASY'
ORDER  BY q.ID;
```

### 6.2. Truy vấn có JOIN nhiều bảng

```sql
-- Bảng xếp hạng học viên theo điểm trung bình của một môn
SELECT u.ID, u.FULL_NAME, u.EMAIL,
       COUNT(r.ID)                  AS TOTAL_ATTEMPTS,
       ROUND(AVG(r.SCORE), 2)       AS AVG_SCORE,
       MAX(r.SCORE)                 AS BEST_SCORE,
       SUM(CASE WHEN r.PASSED = 'Y' THEN 1 ELSE 0 END) AS PASS_COUNT
FROM   USERS u
JOIN   EXAM_RESULTS r ON r.STUDENT_ID = u.ID
JOIN   EXAMS        e ON e.ID = r.EXAM_ID
JOIN   SUBJECTS     s ON s.ID = e.SUBJECT_ID
WHERE  u.ROLE = 'STUDENT'
  AND  s.CODE = 'LTW'
GROUP  BY u.ID, u.FULL_NAME, u.EMAIL
HAVING COUNT(r.ID) > 0
ORDER  BY AVG_SCORE DESC NULLS LAST;
```

### 6.3. Truy vấn lồng (Subquery)

```sql
-- Đề có nhiều lượt thi nhất trong tháng
SELECT e.ID, e.TITLE, COUNT(a.ID) AS NUM_ATTEMPTS
FROM   EXAMS         e
JOIN   EXAM_ATTEMPTS a ON a.EXAM_ID = e.ID
WHERE  a.STARTED_AT >= DATE '2026-08-01'
  AND  a.STARTED_AT <  DATE '2026-09-01'
GROUP  BY e.ID, e.TITLE
HAVING COUNT(a.ID) = (
  SELECT MAX(c)
  FROM (
    SELECT COUNT(a2.ID) AS c
    FROM   EXAM_ATTEMPTS a2
    WHERE  a2.STARTED_AT >= DATE '2026-08-01'
      AND  a2.STARTED_AT <  DATE '2026-09-01'
    GROUP  BY a2.EXAM_ID
  )
);

-- Học viên CHƯA làm bài thi nào
SELECT u.*
FROM   USERS u
WHERE  u.ROLE = 'STUDENT'
  AND  NOT EXISTS (
    SELECT 1 FROM EXAM_ATTEMPTS a WHERE a.STUDENT_ID = u.ID
);
```

### 6.4. Truy vấn phân trang (Pagination - Oracle 12c+)

```sql
-- Trang 2, mỗi trang 10 câu hỏi, sắp xếp theo ID giảm dần
SELECT *
FROM   QUESTIONS
ORDER  BY ID DESC
OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY;
```

### 6.5. Truy vấn báo cáo / thống kê

```sql
-- 1. Tổng số học viên, môn học, đề thi, lượt thi, kết quả
SELECT
  (SELECT COUNT(*) FROM USERS         WHERE ROLE = 'STUDENT')              AS TOTAL_STUDENTS,
  (SELECT COUNT(*) FROM USERS         WHERE ROLE = 'TEACHER')              AS TOTAL_TEACHERS,
  (SELECT COUNT(*) FROM SUBJECTS)                                           AS TOTAL_SUBJECTS,
  (SELECT COUNT(*) FROM QUESTIONS)                                          AS TOTAL_QUESTIONS,
  (SELECT COUNT(*) FROM EXAMS         WHERE STATUS = 'PUBLISHED')          AS TOTAL_PUBLISHED_EXAMS,
  (SELECT COUNT(*) FROM EXAM_ATTEMPTS)                                       AS TOTAL_ATTEMPTS,
  (SELECT COUNT(*) FROM EXAM_RESULTS)                                       AS TOTAL_RESULTS,
  (SELECT ROUND(AVG(SCORE), 2) FROM EXAM_RESULTS)                            AS AVG_SCORE
FROM   DUAL;

-- 2. Top 5 học viên có điểm trung bình cao nhất
SELECT *
FROM   V_STUDENT_RANKING
ORDER  BY AVG_SCORE DESC
FETCH FIRST 5 ROWS ONLY;

-- 3. Số lượt thi theo tháng (6 tháng gần nhất)
SELECT TO_CHAR(a.STARTED_AT, 'YYYY-MM') AS MONTH,
       COUNT(*)                          AS ATTEMPTS
FROM   EXAM_ATTEMPTS a
WHERE  a.STARTED_AT >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -5)
GROUP  BY TO_CHAR(a.STARTED_AT, 'YYYY-MM')
ORDER  BY MONTH;

-- 4. Tỉ lệ đậu/rớt toàn hệ thống
SELECT
  SUM(CASE WHEN PASSED = 'Y' THEN 1 ELSE 0 END) AS PASSED,
  SUM(CASE WHEN PASSED = 'N' THEN 1 ELSE 0 END) AS FAILED,
  ROUND(
    100 * SUM(CASE WHEN PASSED = 'Y' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) AS PASS_RATE_PERCENT
FROM EXAM_RESULTS;

-- 5. Học viên vi phạm nhiều nhất (dùng để cảnh báo)
SELECT u.FULL_NAME, u.EMAIL, COUNT(v.ID) AS VIOLATION_COUNT
FROM   VIOLATIONS v
JOIN   EXAM_ATTEMPTS a ON a.ID = v.ATTEMPT_ID
JOIN   USERS        u ON u.ID = a.STUDENT_ID
GROUP  BY u.FULL_NAME, u.EMAIL
HAVING COUNT(v.ID) > 0
ORDER  BY VIOLATION_COUNT DESC
FETCH  FIRST 10 ROWS ONLY;
```

### 6.6. Truy vấn với hàm phân tích (Analytic Functions)

```sql
-- Xếp hạng học viên theo điểm trong TỪNG đề thi
SELECT EXAM_ID, STUDENT_ID, SCORE,
       RANK()       OVER (PARTITION BY EXAM_ID ORDER BY SCORE DESC) AS RANK_IN_EXAM,
       DENSE_RANK() OVER (PARTITION BY EXAM_ID ORDER BY SCORE DESC) AS DENSE_RANK,
       ROW_NUMBER() OVER (PARTITION BY EXAM_ID ORDER BY SCORE DESC) AS ROW_NUM,
       PERCENT_RANK() OVER (PARTITION BY EXAM_ID ORDER BY SCORE)     AS PCT_RANK
FROM   EXAM_RESULTS;

-- Tìm top 3 học viên theo điểm cho từng đề
SELECT *
FROM (
  SELECT r.EXAM_ID, r.STUDENT_ID, r.SCORE,
         ROW_NUMBER() OVER (PARTITION BY r.EXAM_ID ORDER BY r.SCORE DESC) AS rn
  FROM   EXAM_RESULTS r
)
WHERE  rn <= 3;
```

---

## 7. Trigger — Đề xuất bổ sung

> **Lưu ý:** Schema hiện tại chưa có trigger vì logic nghiệp vụ được xử lý ở tầng backend (Node.js). Đây là các trigger Oracle **đề xuất bổ sung** để minh họa sức mạnh của Oracle trong môn Quản trị CSDL nâng cao.

### 7.1. Trigger tự động cập nhật `UPDATED_AT`

```sql
-- Áp dụng cho mọi bảng có cột UPDATED_AT
CREATE OR REPLACE TRIGGER TRG_USERS_UPDATED_AT
BEFORE UPDATE ON USERS
FOR EACH ROW
BEGIN
  :NEW.UPDATED_AT := SYSTIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER TRG_SUBJECTS_UPDATED_AT
BEFORE UPDATE ON SUBJECTS
FOR EACH ROW
BEGIN
  :NEW.UPDATED_AT := SYSTIMESTAMP;
END;
/

-- (Tương tự cho QUESTIONS, CLASSES, EXAMS, ...)
```

### 7.2. Trigger validate ngày giờ cho EXAMS

```sql
-- Đảm bảo END_TIME > START_TIME và DURATION > 0
CREATE OR REPLACE TRIGGER TRG_EXAMS_VALIDATE_TIME
BEFORE INSERT OR UPDATE ON EXAMS
FOR EACH ROW
BEGIN
  IF :NEW.END_TIME <= :NEW.START_TIME THEN
    RAISE_APPLICATION_ERROR(-20001,
      'END_TIME phải lớn hơn START_TIME');
  END IF;

  IF :NEW.DURATION_MINUTES <= 0 THEN
    RAISE_APPLICATION_ERROR(-20002,
      'DURATION_MINUTES phải > 0');
  END IF;
END;
/
```

### 7.3. Trigger cảnh báo khi xóa USERS có dữ liệu liên quan

```sql
-- Soft-delete: thay vì xóa cứng, set STATUS = 'LOCKED'
CREATE OR REPLACE TRIGGER TRG_USERS_SOFT_DELETE
BEFORE DELETE ON USERS
FOR EACH ROW
DECLARE
  v_exams_count   NUMBER;
  v_attempts_cnt  NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_exams_count
  FROM EXAMS WHERE CREATED_BY = :OLD.ID;

  SELECT COUNT(*) INTO v_attempts_cnt
  FROM EXAM_ATTEMPTS WHERE STUDENT_ID = :OLD.ID;

  IF v_exams_count > 0 THEN
    RAISE_APPLICATION_ERROR(-20010,
      'Không thể xóa user: đã tạo ' || v_exams_count || ' đề thi. ' ||
      'Hãy KHÓA tài khoản (STATUS=LOCKED) thay vì xóa.');
  END IF;

  IF v_attempts_cnt > 0 THEN
    RAISE_APPLICATION_ERROR(-20011,
      'Không thể xóa user: đã có ' || v_attempts_cnt || ' lượt thi. ' ||
      'Hãy KHÓA tài khoản thay vì xóa để giữ lịch sử.');
  END IF;
END;
/
```

### 7.4. Trigger tự động sinh RESULT khi SUBMIT

```sql
-- Khi EXAM_ATTEMPTS chuyển sang SUBMITTED/EXPIRED,
-- tự động tính điểm và tạo bản ghi EXAM_RESULTS + RESULT_ANSWERS
-- (Thay thế phần code TS ở studentExamService.submitExam())
CREATE OR REPLACE TRIGGER TRG_ATTEMPTS_AUTO_GRADE
AFTER UPDATE OF STATUS ON EXAM_ATTEMPTS
FOR EACH ROW
WHEN (NEW.STATUS IN ('SUBMITTED', 'EXPIRED'))
DECLARE
  v_total_correct   NUMBER := 0;
  v_total_wrong     NUMBER := 0;
  v_total_score     NUMBER := 0;
  v_result_id       NUMBER;
  v_max_score       CONSTANT NUMBER := 10;
  v_pass_threshold  CONSTANT NUMBER := 5;
  v_total_points_possible NUMBER := 0;
BEGIN
  -- Tính điểm
  FOR rec IN (
    SELECT aa.SELECTED_OPTION, q.CORRECT_ANSWER, q.POINT
    FROM   ATTEMPT_ANSWERS aa
    JOIN   QUESTIONS q ON q.ID = aa.QUESTION_ID
    WHERE  aa.ATTEMPT_ID = :NEW.ID
  ) LOOP
    v_total_points_possible := v_total_points_possible + rec.POINT;
    IF rec.SELECTED_OPTION IS NOT NULL
       AND rec.SELECTED_OPTION = rec.CORRECT_ANSWER THEN
      v_total_correct := v_total_correct + 1;
      v_total_score   := v_total_score + rec.POINT;
    ELSIF rec.SELECTED_OPTION IS NOT NULL THEN
      v_total_wrong := v_total_wrong + 1;
    END IF;
  END LOOP;

  -- Tính điểm theo thang 10
  DECLARE
    v_score10 NUMBER;
  BEGIN
    IF v_total_points_possible > 0 THEN
      v_score10 := ROUND((v_total_score / v_total_points_possible) * v_max_score, 2);
    ELSE
      v_score10 := 0;
    END IF;

    -- INSERT vào EXAM_RESULTS
    INSERT INTO EXAM_RESULTS (
      EXAM_ID, STUDENT_ID, TOTAL_CORRECT, TOTAL_WRONG,
      SCORE, PASSED, SUBMITTED_AT, GRADED_AT
    ) VALUES (
      :NEW.EXAM_ID, :NEW.STUDENT_ID, v_total_correct, v_total_wrong,
      v_score10,
      CASE WHEN v_score10 >= v_pass_threshold THEN 'Y' ELSE 'N' END,
      SYSTIMESTAMP, SYSTIMESTAMP
    )
    RETURNING ID INTO v_result_id;

    -- INSERT vào RESULT_ANSWERS
    INSERT INTO RESULT_ANSWERS (RESULT_ID, QUESTION_ID, SELECTED_OPTION, IS_CORRECT)
    SELECT v_result_id, aa.QUESTION_ID, aa.SELECTED_OPTION,
           CASE
             WHEN aa.SELECTED_OPTION IS NULL                              THEN 'N'
             WHEN aa.SELECTED_OPTION = q.CORRECT_ANSWER                    THEN 'Y'
             ELSE 'N'
           END
    FROM   ATTEMPT_ANSWERS aa
    JOIN   QUESTIONS q ON q.ID = aa.QUESTION_ID
    WHERE  aa.ATTEMPT_ID = :NEW.ID;
  END;
END;
/
```

### 7.5. Trigger ngăn đổi câu hỏi khi đề đã PUBLISHED

```sql
-- Không cho phép sửa / xóa câu hỏi nếu đã nằm trong đề đã xuất bản
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
    IF UPDATING THEN
      RAISE_APPLICATION_ERROR(-20030,
        'Không thể sửa câu hỏi: đang thuộc ' ||
        v_published_count || ' đề đã xuất bản.');
    ELSE
      RAISE_APPLICATION_ERROR(-20031,
        'Không thể xóa câu hỏi: đang thuộc ' ||
        v_published_count || ' đề đã xuất bản.');
    END IF;
  END IF;
END;
/
```

### 7.6. Trigger ngăn student có nhiều attempt

```sql
-- UNIQUE constraint đã chặn, nhưng trigger có thể thêm thông báo thân thiện
CREATE OR REPLACE TRIGGER TRG_ATTEMPTS_NO_DUPLICATE
BEFORE INSERT ON EXAM_ATTEMPTS
FOR EACH ROW
DECLARE
  v_exist NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_exist
  FROM EXAM_ATTEMPTS
  WHERE EXAM_ID    = :NEW.EXAM_ID
    AND STUDENT_ID = :NEW.STUDENT_ID;

  IF v_exist > 0 THEN
    RAISE_APPLICATION_ERROR(-20040,
      'Học viên đã có attempt cho đề thi này. Không thể tạo mới.');
  END IF;
END;
/
```

### 7.7. Trigger ghi log thay đổi trạng thái đề (Audit)

```sql
-- Bảng audit
CREATE TABLE AUDIT_EXAM_STATUS (
  ID            NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY,
  EXAM_ID       NUMBER NOT NULL,
  OLD_STATUS    VARCHAR2(20),
  NEW_STATUS    VARCHAR2(20) NOT NULL,
  CHANGED_BY    NUMBER,
  CHANGED_AT    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

-- Trigger
CREATE OR REPLACE TRIGGER TRG_EXAM_STATUS_AUDIT
AFTER UPDATE OF STATUS ON EXAMS
FOR EACH ROW
WHEN (OLD.STATUS != NEW.STATUS)
BEGIN
  INSERT INTO AUDIT_EXAM_STATUS (EXAM_ID, OLD_STATUS, NEW_STATUS, CHANGED_BY)
  VALUES (:NEW.ID, :OLD.STATUS, :NEW.STATUS,
          SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER'));
END;
/

-- Xem log
SELECT * FROM AUDIT_EXAM_STATUS ORDER BY CHANGED_AT DESC;
```

### 7.8. Trigger cảnh báo gian lận realtime cho giáo viên

```sql
-- Khi sinh viên vi phạm → ghi vào bảng notify_teacher (queue)
CREATE TABLE NOTIFY_TEACHER (
  ID           NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY,
  TEACHER_ID   NUMBER NOT NULL,
  ATTEMPT_ID   NUMBER NOT NULL,
  TYPE         VARCHAR2(40),
  OCCURRED_AT  TIMESTAMP DEFAULT SYSTIMESTAMP,
  PROCESSED    CHAR(1) DEFAULT 'N'
);

CREATE OR REPLACE TRIGGER TRG_VIOLATION_NOTIFY
AFTER INSERT ON VIOLATIONS
FOR EACH ROW
DECLARE
  v_exam_id    EXAM_ATTEMPTS.EXAM_ID%TYPE;
  v_teacher_id EXAMS.CREATED_BY%TYPE;
BEGIN
  SELECT EXAM_ID INTO v_exam_id
  FROM   EXAM_ATTEMPTS WHERE ID = :NEW.ATTEMPT_ID;

  SELECT CREATED_BY INTO v_teacher_id
  FROM   EXAMS WHERE ID = v_exam_id;

  INSERT INTO NOTIFY_TEACHER (TEACHER_ID, ATTEMPT_ID, TYPE)
  VALUES (v_teacher_id, :NEW.ATTEMPT_ID, :NEW.TYPE);
END;
/

-- Backend sẽ dùng DBMS_SCHEDULER hoặc Java/Node job để đẩy qua Socket.IO
```

### 7.9. Liệt kê tất cả trigger trong schema

```sql
SELECT TRIGGER_NAME, TABLE_NAME, STATUS
FROM   USER_TRIGGERS
ORDER  BY TABLE_NAME, TRIGGER_NAME;
```

---

## 8. Procedure / Function — Đề xuất bổ sung

### 8.1. Hàm tính điểm cho một attempt (có thể thay thế phần code TS)

```sql
CREATE OR REPLACE FUNCTION FN_CALC_SCORE (p_attempt_id IN NUMBER)
  RETURN NUMBER
  DETERMINISTIC
IS
  v_total_earned  NUMBER := 0;
  v_total_possible NUMBER := 0;
  v_score10       NUMBER := 0;
  c_max_score CONSTANT NUMBER := 10;
BEGIN
  SELECT SUM(CASE
               WHEN aa.SELECTED_OPTION IS NOT NULL
                    AND aa.SELECTED_OPTION = q.CORRECT_ANSWER
               THEN q.POINT ELSE 0
             END),
         SUM(q.POINT)
  INTO   v_total_earned, v_total_possible
  FROM   ATTEMPT_ANSWERS aa
  JOIN   QUESTIONS q ON q.ID = aa.QUESTION_ID
  WHERE  aa.ATTEMPT_ID = p_attempt_id;

  IF v_total_possible > 0 THEN
    v_score10 := ROUND((v_total_earned / v_total_possible) * c_max_score, 2);
  END IF;

  RETURN v_score10;
END FN_CALC_SCORE;
/

-- Sử dụng
SELECT FN_CALC_SCORE(1) FROM DUAL;
```

### 8.2. Procedure chấm điểm cho nhiều attempts (batch)

```sql
CREATE OR REPLACE PROCEDURE SP_GRADE_ATTEMPT (
  p_attempt_id IN NUMBER,
  p_pass_score IN NUMBER DEFAULT 5
) AS
  v_score      NUMBER;
  v_correct    NUMBER := 0;
  v_wrong      NUMBER := 0;
  v_result_id  NUMBER;
BEGIN
  -- Tính số câu đúng / sai
  SELECT SUM(CASE
               WHEN aa.SELECTED_OPTION IS NOT NULL
                    AND aa.SELECTED_OPTION = q.CORRECT_ANSWER
               THEN 1 ELSE 0
             END),
         SUM(CASE
               WHEN aa.SELECTED_OPTION IS NOT NULL
                    AND aa.SELECTED_OPTION != q.CORRECT_ANSWER
               THEN 1 ELSE 0
             END)
  INTO   v_correct, v_wrong
  FROM   ATTEMPT_ANSWERS aa
  JOIN   QUESTIONS q ON q.ID = aa.QUESTION_ID
  WHERE  aa.ATTEMPT_ID = p_attempt_id;

  -- Tính điểm
  v_score := FN_CALC_SCORE(p_attempt_id);

  -- Insert vào EXAM_RESULTS
  INSERT INTO EXAM_RESULTS (
    EXAM_ID, STUDENT_ID, TOTAL_CORRECT, TOTAL_WRONG, SCORE, PASSED
  )
  SELECT a.EXAM_ID, a.STUDENT_ID, v_correct, v_wrong, v_score,
         CASE WHEN v_score >= p_pass_score THEN 'Y' ELSE 'N' END
  FROM   EXAM_ATTEMPTS a WHERE a.ID = p_attempt_id
  RETURNING ID INTO v_result_id;

  -- Insert vào RESULT_ANSWERS
  INSERT INTO RESULT_ANSWERS (RESULT_ID, QUESTION_ID, SELECTED_OPTION, IS_CORRECT)
  SELECT v_result_id, aa.QUESTION_ID, aa.SELECTED_OPTION,
         CASE
           WHEN aa.SELECTED_OPTION IS NULL                     THEN 'N'
           WHEN aa.SELECTED_OPTION = q.CORRECT_ANSWER          THEN 'Y'
           ELSE 'N'
         END
  FROM   ATTEMPT_ANSWERS aa
  JOIN   QUESTIONS q ON q.ID = aa.QUESTION_ID
  WHERE  aa.ATTEMPT_ID = p_attempt_id;

  COMMIT;
END SP_GRADE_ATTEMPT;
/

-- Gọi thử
CALL SP_GRADE_ATTEMPT(1);
```

### 8.3. Procedure random câu hỏi theo độ khó

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
  SELECT *
  FROM (
    SELECT q.*, 'EASY' AS DIFF_TAG, ORACLE_RANDOM.NEXTVAL
    FROM QUESTIONS q
    WHERE SUBJECT_ID = p_subject_id AND DIFFICULTY = 'EASY'
    ORDER BY DBMS_RANDOM.VALUE
  )
  WHERE ROWNUM <= p_easy_count

  UNION ALL

  SELECT *
  FROM (
    SELECT q.*, 'MEDIUM' AS DIFF_TAG
    FROM QUESTIONS q
    WHERE SUBJECT_ID = p_subject_id AND DIFFICULTY = 'MEDIUM'
    ORDER BY DBMS_RANDOM.VALUE
  )
  WHERE ROWNUM <= p_medium_count

  UNION ALL

  SELECT *
  FROM (
    SELECT q.*, 'HARD' AS DIFF_TAG
    FROM QUESTIONS q
    WHERE SUBJECT_ID = p_subject_id AND DIFFICULTY = 'HARD'
    ORDER BY DBMS_RANDOM.VALUE
  )
  WHERE ROWNUM <= p_hard_count;
END SP_RANDOM_QUESTIONS;
/

DECLARE
  v_cursor SYS_REFCURSOR;
BEGIN
  SP_RANDOM_QUESTIONS(1, 5, 3, 2, v_cursor);
  -- Xử lý cursor tại đây
END;
/
```

### 8.4. Procedure đóng đề hết hạn (scheduled job)

```sql
CREATE OR REPLACE PROCEDURE SP_CLOSE_PAST_EXAMS AS
BEGIN
  UPDATE EXAMS
  SET    STATUS = 'CLOSED', UPDATED_AT = SYSTIMESTAMP
  WHERE  STATUS = 'PUBLISHED'
    AND  END_TIME < SYSTIMESTAMP;

  UPDATE EXAM_ATTEMPTS
  SET    STATUS = 'EXPIRED', SUBMITTED_AT = SYSTIMESTAMP
  WHERE  STATUS = 'IN_PROGRESS'
    AND  END_TIME <= SYSTIMESTAMP;

  COMMIT;
END SP_CLOSE_PAST_EXAMS;
/

-- Đặt job chạy mỗi 5 phút
BEGIN
  DBMS_SCHEDULER.CREATE_JOB (
    job_name        => 'JOB_CLOSE_PAST_EXAMS',
    job_type        => 'PLSQL_BLOCK',
    job_action      => 'BEGIN SP_CLOSE_PAST_EXAMS; END;',
    repeat_interval => 'FREQ=MINUTELY; INTERVAL=5',
    enabled         => TRUE,
    comments        => 'Đóng các đề và attempt đã quá hạn'
  );
END;
/
```

### 8.5. Procedure thống kê báo cáo tổng quan

```sql
CREATE OR REPLACE PROCEDURE SP_REPORT_DASHBOARD (
  p_total_users       OUT NUMBER,
  p_total_subjects    OUT NUMBER,
  p_total_exams       OUT NUMBER,
  p_total_attempts    OUT NUMBER,
  p_total_results     OUT NUMBER,
  p_avg_score         OUT NUMBER,
  p_pass_rate         OUT NUMBER
) AS
BEGIN
  SELECT COUNT(*) INTO p_total_users
  FROM USERS WHERE STATUS = 'ACTIVE';

  SELECT COUNT(*) INTO p_total_subjects FROM SUBJECTS;

  SELECT COUNT(*) INTO p_total_exams FROM EXAMS WHERE STATUS = 'PUBLISHED';

  SELECT COUNT(*) INTO p_total_attempts FROM EXAM_ATTEMPTS;

  SELECT COUNT(*), NVL(ROUND(AVG(SCORE), 2), 0),
         NVL(ROUND(SUM(CASE WHEN PASSED='Y' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2), 0)
  INTO   p_total_results, p_avg_score, p_pass_rate
  FROM   EXAM_RESULTS;
END SP_REPORT_DASHBOARD;
/

-- Sử dụng (cần khối PL/SQL hoặc dùng qua Node.js)
DECLARE
  v_users    NUMBER; v_subjects  NUMBER; v_exams  NUMBER;
  v_attempts NUMBER; v_results   NUMBER; v_avg    NUMBER; v_pass NUMBER;
BEGIN
  SP_REPORT_DASHBOARD(v_users, v_subjects, v_exams,
                      v_attempts, v_results, v_avg, v_pass);
  DBMS_OUTPUT.PUT_LINE('Users='      || v_users   || ', Subjects=' || v_subjects);
  DBMS_OUTPUT.PUT_LINE('Exams='      || v_exams   || ', Attempts=' || v_attempts);
  DBMS_OUTPUT.PUT_LINE('Results='    || v_results || ', AvgScore=' || v_avg);
  DBMS_OUTPUT.PUT_LINE('PassRate='   || v_pass    || '%');
END;
/
```

### 8.6. Procedure xuất danh sách câu hỏi của đề (helper)

```sql
CREATE OR REPLACE PROCEDURE SP_GET_EXAM_QUESTIONS (
  p_exam_id IN NUMBER,
  p_cur     OUT SYS_REFCURSOR
) AS
BEGIN
  OPEN p_cur FOR
    SELECT q.ID, q.CONTENT, q.OPTION_A, q.OPTION_B, q.OPTION_C, q.OPTION_D,
           q.POINT, q.DIFFICULTY, q.CORRECT_ANSWER, eq.POSITION
    FROM   EXAM_QUESTIONS eq
    JOIN   QUESTIONS q ON q.ID = eq.QUESTION_ID
    WHERE  eq.EXAM_ID = p_exam_id
    ORDER  BY eq.POSITION NULLS LAST, eq.QUESTION_ID;
END SP_GET_EXAM_QUESTIONS;
/
```

### 8.7. Package gom nhóm các procedure / function

```sql
CREATE OR REPLACE PACKAGE PKG_EXAM AS
  -- Functions
  FUNCTION FN_CALC_SCORE (p_attempt_id IN NUMBER) RETURN NUMBER;

  -- Procedures
  PROCEDURE SP_GRADE_ATTEMPT (p_attempt_id IN NUMBER, p_pass_score IN NUMBER DEFAULT 5);
  PROCEDURE SP_CLOSE_PAST_EXAMS;
  PROCEDURE SP_RANDOM_QUESTIONS (
    p_subject_id IN NUMBER, p_easy_count IN NUMBER,
    p_medium_count IN NUMBER, p_hard_count IN NUMBER,
    p_result OUT SYS_REFCURSOR
  );
  PROCEDURE SP_GET_EXAM_QUESTIONS (p_exam_id IN NUMBER, p_cur OUT SYS_REFCURSOR);
END PKG_EXAM;
/

CREATE OR REPLACE PACKAGE BODY PKG_EXAM AS
  FUNCTION FN_CALC_SCORE (p_attempt_id IN NUMBER) RETURN NUMBER IS
    v_total_earned  NUMBER := 0;
    v_total_possible NUMBER := 0;
    v_score10       NUMBER := 0;
    c_max CONSTANT NUMBER := 10;
  BEGIN
    SELECT SUM(CASE
                 WHEN aa.SELECTED_OPTION IS NOT NULL
                      AND aa.SELECTED_OPTION = q.CORRECT_ANSWER
                 THEN q.POINT ELSE 0
               END),
           SUM(q.POINT)
    INTO   v_total_earned, v_total_possible
    FROM   ATTEMPT_ANSWERS aa
    JOIN   QUESTIONS q ON q.ID = aa.QUESTION_ID
    WHERE  aa.ATTEMPT_ID = p_attempt_id;

    IF v_total_possible > 0 THEN
      v_score10 := ROUND((v_total_earned / v_total_possible) * c_max, 2);
    END IF;
    RETURN v_score10;
  END FN_CALC_SCORE;

  PROCEDURE SP_GRADE_ATTEMPT (p_attempt_id IN NUMBER, p_pass_score IN NUMBER DEFAULT 5) AS
    v_score     NUMBER;
    v_correct   NUMBER := 0;
    v_wrong     NUMBER := 0;
    v_result_id NUMBER;
  BEGIN
    SELECT SUM(CASE WHEN aa.SELECTED_OPTION IS NOT NULL AND aa.SELECTED_OPTION = q.CORRECT_ANSWER THEN 1 ELSE 0 END),
           SUM(CASE WHEN aa.SELECTED_OPTION IS NOT NULL AND aa.SELECTED_OPTION != q.CORRECT_ANSWER THEN 1 ELSE 0 END)
    INTO   v_correct, v_wrong
    FROM   ATTEMPT_ANSWERS aa
    JOIN   QUESTIONS q ON q.ID = aa.QUESTION_ID
    WHERE  aa.ATTEMPT_ID = p_attempt_id;

    v_score := FN_CALC_SCORE(p_attempt_id);

    INSERT INTO EXAM_RESULTS (EXAM_ID, STUDENT_ID, TOTAL_CORRECT, TOTAL_WRONG, SCORE, PASSED)
    SELECT a.EXAM_ID, a.STUDENT_ID, v_correct, v_wrong, v_score,
           CASE WHEN v_score >= p_pass_score THEN 'Y' ELSE 'N' END
    FROM   EXAM_ATTEMPTS a WHERE a.ID = p_attempt_id
    RETURNING ID INTO v_result_id;

    INSERT INTO RESULT_ANSWERS (RESULT_ID, QUESTION_ID, SELECTED_OPTION, IS_CORRECT)
    SELECT v_result_id, aa.QUESTION_ID, aa.SELECTED_OPTION,
           CASE
             WHEN aa.SELECTED_OPTION IS NULL            THEN 'N'
             WHEN aa.SELECTED_OPTION = q.CORRECT_ANSWER THEN 'Y'
             ELSE 'N'
           END
    FROM   ATTEMPT_ANSWERS aa
    JOIN   QUESTIONS q ON q.ID = aa.QUESTION_ID
    WHERE  aa.ATTEMPT_ID = p_attempt_id;

    COMMIT;
  END SP_GRADE_ATTEMPT;

  PROCEDURE SP_CLOSE_PAST_EXAMS AS
  BEGIN
    UPDATE EXAMS         SET STATUS = 'CLOSED', UPDATED_AT = SYSTIMESTAMP
      WHERE STATUS = 'PUBLISHED' AND END_TIME < SYSTIMESTAMP;

    UPDATE EXAM_ATTEMPTS SET STATUS = 'EXPIRED', SUBMITTED_AT = SYSTIMESTAMP
      WHERE STATUS = 'IN_PROGRESS' AND END_TIME <= SYSTIMESTAMP;
    COMMIT;
  END SP_CLOSE_PAST_EXAMS;

  PROCEDURE SP_RANDOM_QUESTIONS (
    p_subject_id IN NUMBER, p_easy_count IN NUMBER,
    p_medium_count IN NUMBER, p_hard_count IN NUMBER,
    p_result OUT SYS_REFCURSOR
  ) AS
  BEGIN
    OPEN p_result FOR
      SELECT * FROM (
        SELECT q.*, 'EASY' AS DIFF_TAG, ROW_NUMBER() OVER (ORDER BY DBMS_RANDOM.VALUE) rn
        FROM QUESTIONS q WHERE SUBJECT_ID = p_subject_id AND DIFFICULTY = 'EASY'
      ) WHERE rn <= p_easy_count
      UNION ALL
      SELECT * FROM (
        SELECT q.*, 'MEDIUM' AS DIFF_TAG, ROW_NUMBER() OVER (ORDER BY DBMS_RANDOM.VALUE) rn
        FROM QUESTIONS q WHERE SUBJECT_ID = p_subject_id AND DIFFICULTY = 'MEDIUM'
      ) WHERE rn <= p_medium_count
      UNION ALL
      SELECT * FROM (
        SELECT q.*, 'HARD' AS DIFF_TAG, ROW_NUMBER() OVER (ORDER BY DBMS_RANDOM.VALUE) rn
        FROM QUESTIONS q WHERE SUBJECT_ID = p_subject_id AND DIFFICULTY = 'HARD'
      ) WHERE rn <= p_hard_count;
  END SP_RANDOM_QUESTIONS;

  PROCEDURE SP_GET_EXAM_QUESTIONS (p_exam_id IN NUMBER, p_cur OUT SYS_REFCURSOR) AS
  BEGIN
    OPEN p_cur FOR
      SELECT q.ID, q.CONTENT, q.OPTION_A, q.OPTION_B, q.OPTION_C, q.OPTION_D,
             q.POINT, q.DIFFICULTY, q.CORRECT_ANSWER, eq.POSITION
      FROM   EXAM_QUESTIONS eq
      JOIN   QUESTIONS q ON q.ID = eq.QUESTION_ID
      WHERE  eq.EXAM_ID = p_exam_id
      ORDER  BY eq.POSITION NULLS LAST;
  END SP_GET_EXAM_QUESTIONS;
END PKG_EXAM;
/

-- Sử dụng package
SELECT PKG_EXAM.FN_CALC_SCORE(1) FROM DUAL;
CALL PKG_EXAM.SP_GRADE_ATTEMPT(1);
```

---

## 9. Demo trên Oracle Live SQL

Vì không phải lúc nào cũng có sẵn Oracle 19c, bạn có thể chạy **demo SQL đầy đủ** trên [Oracle Live SQL](https://livesql.oracle.com/) (miễn phí, dùng Oracle 21c).

1. Truy cập **livesql.oracle.com** → đăng nhập Oracle Account.
2. Vào **My Scripts** → dán toàn bộ nội dung `backend/database/schema.sql`.
3. Chạy từng phần (DDL → Trigger → Procedure → truy vấn).
4. Vào **Schema** để xem sơ đồ ER tự động sinh.

---

## 10. Kết luận

Dự án **Hệ thống Quản lý Thi Trắc Nghiệm** khai thác tối đa sức mạnh của Oracle 19c:

| Đặc điểm Oracle | Ứng dụng trong dự án |
|------------------|----------------------|
| **Identity Column** (`GENERATED ... IDENTITY`) | Khóa chính tự tăng cho 11 bảng |
| **CHECK constraint** | Đảm bảo STATUS, ROLE, DIFFICULTY, POINT hợp lệ |
| **Foreign key `ON DELETE CASCADE / SET NULL`** | Tự động dọn dẹp dữ liệu liên quan |
| **Composite index** | Tăng tốc truy vấn lọc đề thi theo trạng thái + thời gian |
| **TRIGGER** | Cập nhật `UPDATED_AT`, audit log, ngăn cập nhật câu hỏi đã dùng, thông báo vi phạm |
| **PROCEDURE / FUNCTION** | Tính điểm tự động, random câu hỏi, đóng đề hết hạn, thống kê |
| **PACKAGE** | Gom nhóm các đơn vị PL/SQL liên quan |
| **VIEW** | Bảng xếp hạng, danh sách đề - tái sử dụng cho nhiều màn hình |
| **MERGE, ANALYTIC FUNCTION** | Upsert kết quả, xếp hạng theo đề thi |
| **B-Tree INDEX** | Tăng tốc truy vấn `WHERE` và `JOIN` |

> **Bài học:** Thiết kế CSDL chặt chẽ (constraints + index + trigger) giúp giảm tải logic ở tầng ứng dụng, bảo đảm tính toàn vẹn ngay cả khi nhiều service cùng truy cập, và là nền tảng vững chắc cho các tính năng nghiệp vụ phức tạp như chấm điểm tự động, anti-cheat, báo cáo realtime.

---

**Tác giả:** Sinh viên Thạc sĩ — Môn học *Quản trị CSDL nâng cao*
**Stack:** Next.js · Node.js · Express · **Oracle 19c** · Socket.IO
