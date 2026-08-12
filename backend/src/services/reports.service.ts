import { execute } from "../config/database";

interface CountRow { C: number }

interface DashboardSummary {
  totalUsers: number;
  totalSubjects: number;
  totalExams: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  monthlyAttempts: Array<{ label: string; value: number }>;
  monthlyAvgScore: Array<{ label: string; value: number }>;
  passVsFail: Array<{ name: string; value: number }>;
}

interface TeacherStats extends DashboardSummary {
  totalExams: number;
  publishedExams: number;
  totalQuestions: number;
}

interface ExamStat {
  examId: string;
  examTitle: string;
  totalStudents: number;
  submitted: number;
  notSubmitted: number;
  average: number;
  highest: number;
  lowest: number;
  passRate: number;
}

interface StudentStat {
  studentId: string;
  studentName: string;
  email: string;
  attempts: number;
  average: number;
  passRate: number;
}

interface ClassStat {
  classId: string;
  className: string;
  students: number;
  attempts: number;
  average: number;
}

async function counts(): Promise<{ users: number; subjects: number; exams: number; attempts: number; questions: number; results: number; passCount: number; sumScore: number }> {
  const [users, subjects, exams, attempts, questions, scoreRows] = await Promise.all([
    execute<CountRow>("SELECT COUNT(*) AS C FROM USERS"),
    execute<CountRow>("SELECT COUNT(*) AS C FROM SUBJECTS"),
    execute<CountRow>("SELECT COUNT(*) AS C FROM EXAMS"),
    execute<CountRow>("SELECT COUNT(*) AS C FROM EXAM_ATTEMPTS"),
    execute<CountRow>("SELECT COUNT(*) AS C FROM QUESTIONS"),
    execute<{ C: number; SUM: number | null }>("SELECT COUNT(*) AS C, SUM(SCORE) AS SUM FROM EXAM_RESULTS"),
  ]);
  return {
    users: Number(users.rows[0]?.C ?? 0),
    subjects: Number(subjects.rows[0]?.C ?? 0),
    exams: Number(exams.rows[0]?.C ?? 0),
    attempts: Number(attempts.rows[0]?.C ?? 0),
    questions: Number(questions.rows[0]?.C ?? 0),
    results: Number(scoreRows.rows[0]?.C ?? 0),
    passCount: 0,
    sumScore: Number(scoreRows.rows[0]?.SUM ?? 0),
  };
}

export const reportsService = {
  async dashboard(): Promise<DashboardSummary> {
    const sums = await counts();
    const avg = sums.results ? sums.sumScore / sums.results : 0;
    const { rows: passRows } = await execute<CountRow>(
      "SELECT COUNT(*) AS C FROM EXAM_RESULTS WHERE PASSED = 'Y'",
    );
    const passCount = Number(passRows[0]?.C ?? 0);
    const passRate = sums.results ? (passCount / sums.results) * 100 : 0;

    // monthly over last 6 months
    const { rows: monthlyAttempts } = await execute<{ LABEL: string; C: number }>(
      `SELECT TO_CHAR(STARTED_AT, 'YYYY-MM') AS LABEL, COUNT(*) AS C
       FROM EXAM_ATTEMPTS
       WHERE STARTED_AT >= ADD_MONTHS(TRUNC(SYSDATE,'MM'), -5)
       GROUP BY TO_CHAR(STARTED_AT, 'YYYY-MM')
       ORDER BY LABEL`,
    );
    const { rows: monthlyAvg } = await execute<{ LABEL: string; AVG: number }>(
      `SELECT TO_CHAR(SUBMITTED_AT, 'YYYY-MM') AS LABEL, AVG(SCORE) AS AVG
       FROM EXAM_RESULTS
       WHERE SUBMITTED_AT >= ADD_MONTHS(TRUNC(SYSDATE,'MM'), -5)
       GROUP BY TO_CHAR(SUBMITTED_AT, 'YYYY-MM')
       ORDER BY LABEL`,
    );
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyAttemptsList = monthlyAttempts.map((m) => {
      const [, mm] = m.LABEL.split("-");
      return { label: months[Number(mm) - 1] ?? m.LABEL, value: Number(m.C) };
    });
    const monthlyAvgList = monthlyAvg.map((m) => {
      const [, mm] = m.LABEL.split("-");
      return { label: months[Number(mm) - 1] ?? m.LABEL, value: Math.round(Number(m.AVG ?? 0) * 100) / 100 };
    });

    const failCount = sums.results - passCount;
    return {
      totalUsers: sums.users,
      totalSubjects: sums.subjects,
      totalExams: sums.exams,
      totalAttempts: sums.attempts,
      averageScore: Math.round(avg * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      monthlyAttempts: monthlyAttemptsList,
      monthlyAvgScore: monthlyAvgList,
      passVsFail: [
        { name: "Đạt", value: passCount },
        { name: "Chưa đạt", value: failCount },
      ],
    };
  },

  async teacherDashboard(teacherId: number): Promise<TeacherStats> {
    const { rows: examRows } = await execute<{ ID: number; STATUS: string }>(
      "SELECT ID, STATUS FROM EXAMS WHERE CREATED_BY = :tid",
      { tid: teacherId },
    );
    const examIds = examRows.map((r) => r.ID);
    const totalExams = examIds.length;
    const publishedExams = examRows.filter((r) => r.STATUS === "PUBLISHED").length;

    const { rows: q } = await execute<{ C: number }>(
      "SELECT COUNT(*) AS C FROM QUESTIONS WHERE CREATED_BY = :tid",
      { tid: teacherId },
    );
    const totalQuestions = Number(q[0]?.C ?? 0);

    let averageScore = 0;
    let passRate = 0;
    let monthlyAttempts: DashboardSummary["monthlyAttempts"] = [];
    let monthlyAvgScore: DashboardSummary["monthlyAvgScore"] = [];
    let passVsFail: DashboardSummary["passVsFail"] = [{ name: "Đạt", value: 0 }, { name: "Chưa đạt", value: 0 }];
    if (examIds.length > 0) {
      const placeholders = examIds.map((_, i) => `:e${i}`).join(",");
      const binds: Record<string, unknown> = {};
      examIds.forEach((eid, i) => (binds[`e${i}`] = eid));

      const { rows: scoreRows } = await execute<{ AVG: number | null; C: number; P: number }>(
        `SELECT AVG(SCORE) AS AVG, COUNT(*) AS C, SUM(CASE WHEN PASSED = 'Y' THEN 1 ELSE 0 END) AS P
         FROM EXAM_RESULTS WHERE EXAM_ID IN (${placeholders})`,
        binds,
      );
      const s = scoreRows[0];
      const total = Number(s?.C ?? 0);
      averageScore = total ? Number(s?.AVG ?? 0) : 0;
      passRate = total ? (Number(s?.P ?? 0) / total) * 100 : 0;

      const { rows: monthlyAttemptsRows } = await execute<{ L: string; C: number }>(
        `SELECT TO_CHAR(a.STARTED_AT, 'YYYY-MM') AS L, COUNT(*) AS C
         FROM EXAM_ATTEMPTS a
         WHERE a.EXAM_ID IN (${placeholders})
           AND a.STARTED_AT >= ADD_MONTHS(TRUNC(SYSDATE,'MM'), -5)
         GROUP BY TO_CHAR(a.STARTED_AT, 'YYYY-MM')
         ORDER BY L`,
        binds,
      );
      const { rows: monthlyAvgRows } = await execute<{ L: string; A: number | null }>(
        `SELECT TO_CHAR(SUBMITTED_AT, 'YYYY-MM') AS L, AVG(SCORE) AS A
         FROM EXAM_RESULTS WHERE EXAM_ID IN (${placeholders})
           AND SUBMITTED_AT >= ADD_MONTHS(TRUNC(SYSDATE,'MM'), -5)
         GROUP BY TO_CHAR(SUBMITTED_AT, 'YYYY-MM')
         ORDER BY L`,
        binds,
      );
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      monthlyAttempts = monthlyAttemptsRows.map((m) => {
        const [, mm] = m.L.split("-");
        return { label: months[Number(mm) - 1] ?? m.L, value: Number(m.C) };
      });
      monthlyAvgScore = monthlyAvgRows.map((m) => {
        const [, mm] = m.L.split("-");
        return { label: months[Number(mm) - 1] ?? m.L, value: Math.round(Number(m.A ?? 0) * 100) / 100 };
      });

      const { rows: pfRows } = await execute<{ P: number; F: number }>(
        `SELECT SUM(CASE WHEN PASSED = 'Y' THEN 1 ELSE 0 END) AS P,
                SUM(CASE WHEN PASSED = 'N' THEN 1 ELSE 0 END) AS F
         FROM EXAM_RESULTS WHERE EXAM_ID IN (${placeholders})`,
        binds,
      );
      passVsFail = [
        { name: "Đạt", value: Number(pfRows[0]?.P ?? 0) },
        { name: "Chưa đạt", value: Number(pfRows[0]?.F ?? 0) },
      ];
    }

    return {
      totalExams,
      publishedExams,
      totalQuestions,
      totalUsers: 0,
      totalSubjects: 0,
      totalAttempts: 0,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      monthlyAttempts,
      monthlyAvgScore,
      passVsFail,
    };
  },

  async examStats(teacherId?: number): Promise<ExamStat[]> {
    const binds: Record<string, unknown> = {};
    let whereTeacher = "";
    if (teacherId) {
      whereTeacher = "WHERE e.CREATED_BY = :tid";
      binds.tid = teacherId;
    }
    const { rows } = await execute<{
      EXAM_ID: number;
      TITLE: string;
      TOTAL: number;
      SUBMITTED: number;
      AVERAGE: number | null;
      HIGHEST: number | null;
      LOWEST: number | null;
      PASS: number | null;
    }>(
      `SELECT e.ID AS EXAM_ID, e.TITLE,
              (SELECT COUNT(*) FROM EXAM_CLASSES ec WHERE ec.EXAM_ID = e.ID) AS TOTAL,
              (SELECT COUNT(*) FROM EXAM_RESULTS r WHERE r.EXAM_ID = e.ID) AS SUBMITTED,
              (SELECT AVG(SCORE) FROM EXAM_RESULTS r WHERE r.EXAM_ID = e.ID) AS AVERAGE,
              (SELECT MAX(SCORE) FROM EXAM_RESULTS r WHERE r.EXAM_ID = e.ID) AS HIGHEST,
              (SELECT MIN(SCORE) FROM EXAM_RESULTS r WHERE r.EXAM_ID = e.ID) AS LOWEST,
              (SELECT SUM(CASE WHEN PASSED = 'Y' THEN 1 ELSE 0 END) FROM EXAM_RESULTS r WHERE r.EXAM_ID = e.ID) AS PASS
       FROM EXAMS e
       ${whereTeacher}
       ORDER BY e.CREATED_AT DESC`,
      binds,
    );

    return rows.map((r) => {
      const submitted = Number(r.SUBMITTED ?? 0);
      const pass = Number(r.PASS ?? 0);
      const avg = Number(r.AVERAGE ?? 0);
      const passRate = submitted > 0 ? (pass / submitted) * 100 : 0;
      return {
        examId: String(r.EXAM_ID),
        examTitle: r.TITLE,
        totalStudents: Number(r.TOTAL ?? 0),
        submitted,
        notSubmitted: Math.max(0, Number(r.TOTAL ?? 0) - submitted),
        average: Math.round(avg * 100) / 100,
        highest: r.HIGHEST !== null ? Math.round(Number(r.HIGHEST) * 100) / 100 : 0,
        lowest: r.LOWEST !== null ? Math.round(Number(r.LOWEST) * 100) / 100 : 0,
        passRate: Math.round(passRate * 100) / 100,
      };
    });
  },

  async studentStats(teacherId?: number): Promise<StudentStat[]> {
    const binds: Record<string, unknown> = {};
    let whereTeacher = "";
    if (teacherId) {
      whereTeacher = "AND EXISTS (SELECT 1 FROM EXAMS ex WHERE ex.ID = r.EXAM_ID AND ex.CREATED_BY = :tid)";
      binds.tid = teacherId;
    }
    const { rows } = await execute<{
      STUDENT_ID: number;
      FULL_NAME: string;
      EMAIL: string;
      ATTEMPTS: number;
      AVERAGE: number | null;
      PASS: number | null;
    }>(
      `SELECT u.ID AS STUDENT_ID, u.FULL_NAME, u.EMAIL,
              COUNT(r.ID) AS ATTEMPTS,
              AVG(r.SCORE) AS AVERAGE,
              SUM(CASE WHEN r.PASSED = 'Y' THEN 1 ELSE 0 END) AS PASS
       FROM USERS u
       LEFT JOIN EXAM_RESULTS r ON r.STUDENT_ID = u.ID ${whereTeacher}
       WHERE u.ROLE = 'STUDENT'
       GROUP BY u.ID, u.FULL_NAME, u.EMAIL
       ORDER BY u.FULL_NAME`,
      binds,
    );
    return rows.map((r) => {
      const attempts = Number(r.ATTEMPTS ?? 0);
      const pass = Number(r.PASS ?? 0);
      const passRate = attempts > 0 ? (pass / attempts) * 100 : 0;
      return {
        studentId: String(r.STUDENT_ID),
        studentName: r.FULL_NAME,
        email: r.EMAIL,
        attempts,
        average: Math.round(Number(r.AVERAGE ?? 0) * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
      };
    });
  },

  async classStats(teacherId?: number): Promise<ClassStat[]> {
    const binds: Record<string, unknown> = {};
    let whereTeacher = "";
    if (teacherId) {
      whereTeacher = "WHERE NOT EXISTS (SELECT 1 FROM EXAMS ex WHERE ex.ID IN (SELECT EXAM_ID FROM EXAM_CLASSES WHERE CLASS_ID = c.ID) AND ex.CREATED_BY <> :tid)";
      binds.tid = teacherId;
    }
    const { rows } = await execute<{
      CLASS_ID: number;
      CLASS_NAME: string;
      STUDENTS: number;
      ATTEMPTS: number;
      AVERAGE: number | null;
    }>(
      `SELECT c.ID AS CLASS_ID, c.NAME AS CLASS_NAME,
              (SELECT COUNT(*) FROM CLASS_STUDENTS cs WHERE cs.CLASS_ID = c.ID) AS STUDENTS,
              (SELECT COUNT(*) FROM EXAM_RESULTS r JOIN EXAM_ATTEMPTS a ON a.ID = r.ID WHERE a.STUDENT_ID IN (SELECT STUDENT_ID FROM CLASS_STUDENTS WHERE CLASS_ID = c.ID)) AS ATTEMPTS,
              (SELECT AVG(r.SCORE) FROM EXAM_RESULTS r JOIN EXAM_ATTEMPTS a ON a.ID = r.ID WHERE a.STUDENT_ID IN (SELECT STUDENT_ID FROM CLASS_STUDENTS WHERE CLASS_ID = c.ID)) AS AVERAGE
       FROM CLASSES c
       ${whereTeacher}
       ORDER BY c.NAME`,
      binds,
    );
    return rows.map((r) => ({
      classId: String(r.CLASS_ID),
      className: r.CLASS_NAME,
      students: Number(r.STUDENTS ?? 0),
      attempts: Number(r.ATTEMPTS ?? 0),
      average: Math.round(Number(r.AVERAGE ?? 0) * 100) / 100,
    }));
  },
};
