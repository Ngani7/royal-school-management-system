import { Router, Request, Response, RequestHandler } from "express";
import { prisma } from "../db.js";
import { authenticateJWT, requireRole } from "./auth.js";

export const academicRouter = Router();

// ==========================================
// ACADEMIC TERMS
// ==========================================

// GET /terms
academicRouter.get("/terms", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const terms = await prisma.academicTerm.findMany({
      orderBy: { startDate: "desc" },
    });
    return res.json(terms);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /terms
academicRouter.post("/terms", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate, isActive } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: "Term Name, Start Date, and End Date are required" });
    }

    if (isActive) {
      // Deactivate all others
      await prisma.academicTerm.updateMany({
        data: { isActive: false },
      });
    }

    const term = await prisma.academicTerm.create({
      data: {
        name,
        startDate,
        endDate,
        isActive: !!isActive,
      },
    });

    return res.status(201).json(term);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// PATCH /terms/:id/activate
academicRouter.patch("/terms/:id/activate", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Set all to inactive
    await prisma.academicTerm.updateMany({
      data: { isActive: false },
    });

    // Activate this specific term
    const term = await prisma.academicTerm.update({
      where: { id },
      data: { isActive: true },
    });

    return res.json(term);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// CLASSES & STREAMS
// ==========================================

// GET /classes
academicRouter.get("/classes", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        streams: {
          include: {
            _count: { select: { students: true } }
          }
        },
        _count: { select: { students: true } }
      },
      orderBy: { name: "asc" },
    });
    return res.json(classes);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /classes
academicRouter.post("/classes", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { name, schoolLevel, classTeacher, capacity, academicYear } = req.body;
    if (!name || !schoolLevel) {
      return res.status(400).json({ error: "Class Name and School Level are required" });
    }

    const exClass = await prisma.class.findUnique({ where: { name } });
    if (exClass) {
      return res.status(400).json({ error: `A class named '${name}' already exists` });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        schoolLevel,
        classTeacher: classTeacher || "TBD",
        capacity: Number(capacity) || 40,
        academicYear: academicYear || "2026",
        status: "ACTIVE",
      },
    });

    // Auto create a Stream A
    await prisma.stream.create({
      data: {
        name: "Stream A",
        classId: newClass.id,
        teacher: classTeacher || "TBD",
      },
    });

    const fullClass = await prisma.class.findUnique({
      where: { id: newClass.id },
      include: { streams: true },
    });

    return res.status(201).json(fullClass);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// DELETE /classes/:id - with student safety check
academicRouter.delete("/classes/:id", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if class has students
    const studentCount = await prisma.student.count({
      where: { classId: id },
    });

    if (studentCount > 0) {
      return res.status(400).json({
        error: `Cannot delete class. It has ${studentCount} enrolled students. Please reassign students to another class first.`,
      });
    }

    // Safe to delete if no students
    await prisma.class.delete({
      where: { id },
    });

    return res.json({ message: "Class deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /classes/:id/streams
academicRouter.post("/classes/:id/streams", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id: classId } = req.params;
    const { name, teacher } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Stream Name is required" });
    }

    const stream = await prisma.stream.create({
      data: {
        name,
        classId,
        teacher: teacher || "TBD",
      },
    });

    return res.status(201).json(stream);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// DELETE /classes/:id/streams/:streamId
academicRouter.delete("/classes/:id/streams/:streamId", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    await prisma.stream.delete({ where: { id: streamId } });
    return res.json({ message: "Stream deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// SUBJECTS
// ==========================================

// GET /subjects
academicRouter.get("/subjects", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        classSubjects: {
          include: {
            class: true,
          }
        }
      },
      orderBy: { name: "asc" },
    });
    return res.json(subjects);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /subjects
academicRouter.post("/subjects", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: "Subject Name and Subject Code are required" });
    }

    const existingName = await prisma.subject.findUnique({ where: { name } });
    if (existingName) return res.status(400).json({ error: "Subject with this name already exists" });

    const existingCode = await prisma.subject.findUnique({ where: { code } });
    if (existingCode) return res.status(400).json({ error: "Subject with this code already exists" });

    const subject = await prisma.subject.create({
      data: { name, code },
    });

    return res.status(201).json(subject);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// DELETE /subjects/:id
academicRouter.delete("/subjects/:id", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id } });
    return res.json({ message: "Subject deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /subjects/:id/assign (Assign subject to class)
academicRouter.post("/subjects/:id/assign", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id: subjectId } = req.params;
    const { classId, streamId } = req.body;
    if (!classId) {
      return res.status(400).json({ error: "Class ID is required" });
    }

    const assigned = await prisma.classSubject.create({
      data: {
        subjectId,
        classId,
        streamId: streamId || null,
      },
    });

    return res.status(201).json(assigned);
  } catch (err: any) {
    return res.status(500).json({ error: "Subject is already assigned to this class/stream or DB error" });
  }
}) as RequestHandler);

// DELETE /subjects/:id/assign/:classId (Unassign subject)
academicRouter.delete("/subjects/:id/assign/:classId", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id: subjectId, classId } = req.params;
    
    // Find and delete
    await prisma.classSubject.deleteMany({
      where: {
        subjectId,
        classId,
      },
    });

    return res.json({ message: "Subject unassigned from class successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// ATTENDANCE
// ==========================================

// GET /attendance/stream/:streamId
academicRouter.get("/attendance/stream/:streamId", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const { date } = req.query; // YYYY-MM-DD
    
    if (!date) {
      return res.status(400).json({ error: "Date parameter (YYYY-MM-DD) is required" });
    }

    // Get stream details
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { class: true },
    });

    if (!stream) {
      return res.status(444).json({ error: "Stream not found" });
    }

    // Get all students enrolled in this stream
    const students = await prisma.student.findMany({
      where: {
        streamId,
        status: "ACTIVE",
      },
      orderBy: { lastName: "asc" },
    });

    // Find attendance sheet for this date and stream
    const attendance = await prisma.attendance.findUnique({
      where: {
        streamId_date: {
          streamId,
          date: String(date),
        },
      },
      include: {
        records: true,
      },
    });

    return res.json({
      stream,
      students,
      attendance, // can be null if not marked yet
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /attendance/mark
academicRouter.post("/attendance/mark", authenticateJWT, requireRole(["ADMIN", "TEACHER"]), (async (req: any, res: Response) => {
  try {
    const { streamId, date, records } = req.body; // records is interface of { studentId, status }
    if (!streamId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: "streamId, date, and records array are required" });
    }

    // Find or create Attendance
    let attendance = await prisma.attendance.findUnique({
      where: {
        streamId_date: {
          streamId,
          date,
        },
      },
    });

    if (!attendance) {
      attendance = await prisma.attendance.create({
        data: {
          streamId,
          date,
          markedBy: req.user.name,
        },
      });
    } else {
      // Update who marked it
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { markedBy: req.user.name },
      });
    }

    // Create or Update records
    for (const rec of records) {
      await prisma.attendanceRecord.upsert({
        where: {
          attendanceId_studentId: {
            attendanceId: attendance.id,
            studentId: rec.studentId,
          },
        },
        update: {
          status: rec.status, // P, A, L, E
        },
        create: {
          attendanceId: attendance.id,
          studentId: rec.studentId,
          status: rec.status,
        },
      });
    }

    return res.json({ message: "Attendance saved successfully", attendanceId: attendance.id });
  } catch (err: any) {
    console.error("Attendance mark backend error:", err);
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// GET /attendance/stream/:streamId/history (30-day index)
academicRouter.get("/attendance/stream/:streamId/history", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    
    const attendances = await prisma.attendance.findMany({
      where: { streamId },
      include: {
        records: true,
      },
      orderBy: { date: "desc" },
      take: 30,
    });

    // Formatting 30 days history aggregates
    const history = attendances.map((att) => {
      const records = att.records;
      const total = records.length;
      const present = records.filter(r => r.status === "P").length;
      const absent = records.filter(r => r.status === "A").length;
      const late = records.filter(r => r.status === "L").length;
      const excused = records.filter(r => r.status === "E").length;
      
      return {
        id: att.id,
        date: att.date,
        markedBy: att.markedBy,
        total,
        present,
        absent,
        late,
        excused,
        rate: total > 0 ? Math.round(((present + late) / total) * 100) : 100,
      };
    });

    return res.json(history);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// EXAMS & RESULTS
// ==========================================

// GET /exams
academicRouter.get("/exams", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        class: true,
        subject: true,
        results: {
          include: {
            student: true,
          }
        },
      },
      orderBy: { date: "desc" },
    });
    return res.json(exams);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /exams
academicRouter.post("/exams", authenticateJWT, requireRole(["ADMIN", "TEACHER"]), (async (req: Request, res: Response) => {
  try {
    const { name, type, termId, classId, subjectId, date } = req.body;
    if (!name || !type || !termId || !classId || !subjectId || !date) {
      return res.status(400).json({ error: "All examination fields are required (name, type, termId, classId, subjectId, date)" });
    }

    const exam = await prisma.exam.create({
      data: {
        name,
        type, // TEST, MIDTERM, FINAL
        termId,
        classId,
        subjectId,
        date,
      },
    });

    return res.status(201).json(exam);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// DELETE /exams/:id
academicRouter.delete("/exams/:id", authenticateJWT, requireRole(["ADMIN", "TEACHER"]), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.exam.delete({ where: { id } });
    return res.json({ message: "Examination record deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /exams/:id/results (Enters/upserts marks and grades)
academicRouter.post("/exams/:id/results", authenticateJWT, requireRole(["ADMIN", "TEACHER"]), (async (req: Request, res: Response) => {
  try {
    const { id: examId } = req.params;
    const { results } = req.body; // array of { studentId, marks }
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ error: "Results array is required" });
    }

    const gradingMatrix = (score: number): string => {
      if (score >= 85) return "A";
      if (score >= 75) return "B";
      if (score >= 65) return "C";
      if (score >= 50) return "D";
      return "F";
    };

    const savedResults = [];

    for (const r of results) {
      const marks = Number(r.marks);
      const grade = gradingMatrix(marks);

      const saved = await prisma.result.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: r.studentId,
          }
        },
        update: {
          marks,
          grade,
        },
        create: {
          examId,
          studentId: r.studentId,
          marks,
          grade,
        }
      });
      savedResults.push(saved);
    }

    return res.json({ message: "Examination results updated successfully", count: savedResults.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// ANNOUNCEMENTS
// ==========================================

// GET /announcements
academicRouter.get("/announcements", authenticateJWT, (async (req: any, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });

    const userRole = req.user.role;

    // Filter by role unless Admin/Finance
    const filtered = announcements.filter(ann => {
      try {
        const roles: string[] = JSON.parse(ann.targetRoles);
        if (userRole === "ADMIN") return true; 
        return roles.includes(userRole);
      } catch {
        return true; // fallback
      }
    });

    return res.json(filtered);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /announcements
academicRouter.post("/announcements", authenticateJWT, requireRole(["ADMIN"]), (async (req: any, res: Response) => {
  try {
    const { title, content, targetRoles } = req.body; // targetRoles is list of roles e.g., ["PARENT", "STUDENT"]
    if (!title || !content || !targetRoles || !Array.isArray(targetRoles)) {
      return res.status(400).json({ error: "Title, content, and targetRoles role array are required" });
    }

    const anno = await prisma.announcement.create({
      data: {
        title,
        content,
        targetRoles: JSON.stringify(targetRoles),
        createdBy: req.user.name,
      },
    });

    return res.status(201).json(anno);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// DELETE /announcements/:id
academicRouter.delete("/announcements/:id", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    return res.json({ message: "Announcement deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);