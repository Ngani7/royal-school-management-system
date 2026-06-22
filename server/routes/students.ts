import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// CREATE STUDENT
router.post(
  "/",
  (async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        admissionNumber,
        gender,
        dateOfBirth,
        schoolLevel,
        academicYear,
        classId,
        streamId,
        parentGuardianName,
        parentGuardianPhone,
        residentialAddress,
        enrollmentDate,
      } = req.body;

      if (!firstName || !lastName || !gender) {
        return res.status(400).json({ error: "First Name, Last Name, and Gender are required" });
      }

      let admNo = admissionNumber;
      if (!admNo) {
        const count = await prisma.student.count();
        admNo = `ADM-${Date.now()}-${count + 1}`;
      }

      // Build data object - ONLY include classId/streamId if they have values
      const createData: any = {
        firstName,
        lastName,
        admissionNumber: admNo,
        gender: gender.toUpperCase(),
        dateOfBirth: dateOfBirth || "2010-01-01",
        schoolLevel: schoolLevel || "PRIMARY",
        academicYear: academicYear || "2026",
        parentGuardianName: parentGuardianName || "To be assigned",
        parentGuardianPhone: parentGuardianPhone || "N/A",
        residentialAddress: residentialAddress || "N/A",
        enrollmentDate: enrollmentDate || new Date().toISOString().split("T")[0],
        status: "ACTIVE",
      };

      // Only add classId/streamId if they're provided
      if (classId) createData.classId = classId;
      if (streamId) createData.streamId = streamId;

      const student = await prisma.student.create({
        data: createData,
        include: {
          class: true,
          stream: true,
        },
      });

      return res.status(201).json(student);
    } catch (err: any) {
      console.error("Create student error:", err);
      return res.status(500).json({ error: err.message });
    }
  }) as RequestHandler
);

// GET ALL STUDENTS
router.get(
  "/",
  (async (req, res) => {
    try {
      const { status, search, schoolLevel, classId } = req.query;

      let where: any = {};
      if (status) where.status = status;
      if (schoolLevel) where.schoolLevel = schoolLevel;
      if (classId) where.classId = classId;

      if (search) {
        where.OR = [
          { firstName: { contains: String(search), mode: "insensitive" } },
          { lastName: { contains: String(search), mode: "insensitive" } },
          { admissionNumber: { contains: String(search), mode: "insensitive" } },
        ];
      }

      const students = await prisma.student.findMany({
        where,
        include: {
          class: true,
          stream: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(students);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }) as RequestHandler
);

// GET SINGLE STUDENT
router.get(
  "/:id",
  (async (req, res) => {
    try {
      const { id } = req.params;
      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          class: true,
          stream: true,
          attendanceRecords: true,
          results: true,
          payments: true,
          invoices: true,
        },
      });

      if (!student) return res.status(404).json({ error: "Student not found" });
      res.json(student);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }) as RequestHandler
);

// UPDATE STUDENT
router.put(
  "/:id",
  (async (req, res) => {
    try {
      const { id } = req.params;
      const student = await prisma.student.update({
        where: { id },
        data: req.body,
        include: { class: true, stream: true },
      });
      res.json(student);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }) as RequestHandler
);

// DELETE STUDENT
router.delete(
  "/:id",
  (async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.student.delete({ where: { id } });
      res.json({ message: "Student deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }) as RequestHandler
);

// PROMOTE STUDENT
router.post(
  "/:id/promote",
  (async (req, res) => {
    try {
      const { id } = req.params;
      const { targetClassId, targetStreamId, academicYear } = req.body;

      const student = await prisma.student.update({
        where: { id },
        data: {
          classId: targetClassId || undefined,
          streamId: targetStreamId || undefined,
          academicYear: academicYear || undefined,
        },
        include: { class: true, stream: true },
      });

      res.json(student);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }) as RequestHandler
);

// Copy from assign_student_route.ts file

// ASSIGN STUDENT TO CLASS
router.post(
  "/:id/assign-class",
  (async (req, res) => {
    try {
      const { id } = req.params;
      const { classId, streamId } = req.body;

      if (!classId) {
        return res.status(400).json({ error: "classId is required" });
      }

      // Verify class exists
      const classExists = await prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classExists) {
        return res.status(404).json({ error: "Class not found" });
      }

      // If streamId provided, verify it exists and belongs to this class
      if (streamId) {
        const streamExists = await prisma.stream.findUnique({
          where: { id: streamId },
        });

        if (!streamExists || streamExists.classId !== classId) {
          return res.status(400).json({ error: "Stream not found or doesn't belong to this class" });
        }
      }

      // Update student
      const student = await prisma.student.update({
        where: { id },
        data: {
          classId,
          streamId: streamId || null,
        },
        include: {
          class: true,
          stream: true,
        },
      });

      res.json({
        message: "Student assigned to class successfully",
        student,
      });
    } catch (err: any) {
      console.error("Assign class error:", err);
      res.status(500).json({ error: err.message });
    }
  }) as RequestHandler
);

export { router as studentsRouter };
