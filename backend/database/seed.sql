-- Optional helper index/seed file.
-- 1. Run schema.sql first.
-- 2. Then either:
--    a) Run npm run seed:admin to insert/update admin@local with bcrypt hash of "Admin@123"
--    b) Insert manually with your preferred password hash.

-- Sample subject for smoke tests (assumes admin user exists with ID = 1)
INSERT INTO SUBJECTS (NAME, CODE, DESCRIPTION, CREATED_BY)
SELECT 'Lap trinh Web', 'LTW', 'Mon hoc co so', ID
FROM USERS
WHERE EMAIL = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM SUBJECTS WHERE CODE = 'LTW');

-- Additional index for join performance on attempts.exam_id
CREATE INDEX IDX_ATTEMPTS_EXAM ON EXAM_ATTEMPTS(EXAM_ID);
