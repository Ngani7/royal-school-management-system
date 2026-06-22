import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// ==================== STAFF ROUTES ====================

// Get all staff
router.get("/staff", async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      include: {
        user: true,
        employmentRecords: {
          include: { salaryScale: true },
          where: { status: "ACTIVE" },
        },
      },
      orderBy: { firstName: "asc" },
    });
    res.json(staff);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// Create staff
router.post("/staff", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    position,
    department,
    dateJoined,
    idNumber,
    bankAccount,
    bankName,
    salaryScaleId,
  } = req.body;

  try {
    // Create user first (optional)
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    let user = null;

    try {
      user = await prisma.user.create({
        data: {
          username,
          password: "temp123", // Temporary - should be hashed
          role: "TEACHER", // Default role
          name: `${firstName} ${lastName}`,
          status: "ACTIVE",
        },
      });
    } catch {
      // User might already exist
    }

    // Create staff record
    const staff = await prisma.staff.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        position: position || null,
        department: department || null,
        dateJoined,
        idNumber: idNumber || null,
        bankAccount: bankAccount || null,
        bankName: bankName || null,
        userId: user?.id,
      },
    });

    // Create employment record with salary scale
    if (salaryScaleId) {
      await prisma.employment.create({
        data: {
          staffId: staff.id,
          salaryScaleId,
          effectiveDate: dateJoined,
          status: "ACTIVE",
        },
      });
    }

    const createdStaff = await prisma.staff.findUnique({
      where: { id: staff.id },
      include: {
        employmentRecords: { include: { salaryScale: true } },
      },
    });

    res.status(201).json(createdStaff);
  } catch (err) {
    console.error("Error creating staff:", err);
    res.status(500).json({ error: "Failed to create staff" });
  }
});

// Delete staff
router.delete("/staff/:id", async (req, res) => {
  try {
    await prisma.staff.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting staff:", err);
    res.status(500).json({ error: "Failed to delete staff" });
  }
});

// ==================== SALARY SCALES ====================

router.get("/salary-scales", async (req, res) => {
  try {
    const scales = await prisma.salaryScale.findMany({
      orderBy: { baseSalary: "desc" },
    });
    res.json(scales);
  } catch (err) {
    console.error("Error fetching salary scales:", err);
    res.status(500).json({ error: "Failed to fetch salary scales" });
  }
});

// ==================== PAYROLL PROCESSING ====================

router.post("/process", async (req, res) => {
  const { paymentMonth } = req.body; // Format: YYYY-MM

  try {
    // Get all active staff with salary scales
    const staff = await prisma.staff.findMany({
      where: { employmentStatus: "ACTIVE" },
      include: {
        employmentRecords: {
          include: { salaryScale: true },
          where: { status: "ACTIVE" },
          orderBy: { effectiveDate: "desc" },
          take: 1,
        },
      },
    });

    const deductionTypes = await prisma.deductionType.findMany();

    for (const s of staff) {
      const activeEmployment = s.employmentRecords[0];
      if (!activeEmployment) continue;

      const baseSalary = activeEmployment.salaryScale.baseSalary;
      const grossSalary = baseSalary; // Can add allowances here

      // Check if payroll already exists
      const existing = await prisma.payroll.findUnique({
        where: { staffId_paymentMonth: { staffId: s.id, paymentMonth } },
      });

      if (existing) continue;

      // Calculate deductions
      const deductions = [];
      let totalDeductions = 0;

      // NAPSA: 5% of gross
      const napsaType = deductionTypes.find((d) => d.code === "NAPSA");
      if (napsaType) {
        const amount = Math.round(grossSalary * 0.05 * 100) / 100;
        deductions.push({ type: napsaType, amount });
        totalDeductions += amount;
      }

      // NHIMA: 2% of gross
      const nhimaType = deductionTypes.find((d) => d.code === "NHIMA");
      if (nhimaType) {
        const amount = Math.round(grossSalary * 0.02 * 100) / 100;
        deductions.push({ type: nhimaType, amount });
        totalDeductions += amount;
      }

      // PAYE: Progressive tax (simplified)
      const payeType = deductionTypes.find((d) => d.code === "PAYE");
      if (payeType && grossSalary > 3000) {
        const amount = Math.round((grossSalary - 3000) * 0.2 * 100) / 100;
        deductions.push({ type: payeType, amount });
        totalDeductions += amount;
      }

      const netSalary = grossSalary - totalDeductions;

      // Create payroll
      const payroll = await prisma.payroll.create({
        data: {
          staffId: s.id,
          paymentMonth,
          baseSalary,
          grossSalary,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          netSalary: Math.round(netSalary * 100) / 100,
          status: "DRAFT",
          deductions: {
            create: deductions.map((d) => ({
              deductionTypeId: d.type.id,
              amount: d.amount,
            })),
          },
        },
      });

      // Create payslip
      await prisma.payslip.create({
        data: {
          payrollId: payroll.id,
          staffId: s.id,
          paymentMonth,
          baseSalary,
          grossSalary,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          netSalary: Math.round(netSalary * 100) / 100,
        },
      });
    }

    res.json({ success: true, message: "Payroll processed successfully" });
  } catch (err) {
    console.error("Error processing payroll:", err);
    res.status(500).json({ error: "Failed to process payroll" });
  }
});

// Get payrolls by month
router.get("/payrolls", async (req, res) => {
  const { month } = req.query;

  try {
    const payrolls = await prisma.payroll.findMany({
      where: month ? { paymentMonth: month as string } : undefined,
      include: {
        staff: {
          include: {
            employmentRecords: {
              include: { salaryScale: true },
              where: { status: "ACTIVE" },
            },
          },
        },
        deductions: {
          include: { deductionType: true },
        },
      },
      orderBy: { staff: { firstName: "asc" } },
    });
    res.json(payrolls);
  } catch (err) {
    console.error("Error fetching payrolls:", err);
    res.status(500).json({ error: "Failed to fetch payrolls" });
  }
});

// Update payroll status
router.patch("/payrolls/:id", async (req, res) => {
  const { status } = req.body;

  try {
    const payroll = await prisma.payroll.update({
      where: { id: req.params.id },
      data: { status, paymentDate: status === "PROCESSED" ? new Date().toISOString().split("T")[0] : null },
      include: { deductions: { include: { deductionType: true } } },
    });
    res.json(payroll);
  } catch (err) {
    console.error("Error updating payroll:", err);
    res.status(500).json({ error: "Failed to update payroll" });
  }
});

// Delete payroll
router.delete("/payrolls/:id", async (req, res) => {
  try {
    await prisma.payroll.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting payroll:", err);
    res.status(500).json({ error: "Failed to delete payroll" });
  }
});

// ==================== PAYSLIPS ====================

router.get("/payslips", async (req, res) => {
  try {
    const payslips = await prisma.payslip.findMany({
      include: {
        staff: true,
        payroll: { include: { deductions: { include: { deductionType: true } } } },
      },
      orderBy: { generatedDate: "desc" },
    });
    res.json(payslips);
  } catch (err) {
    console.error("Error fetching payslips:", err);
    res.status(500).json({ error: "Failed to fetch payslips" });
  }
});

// Get payslip by ID
router.get("/payslips/:id", async (req, res) => {
  try {
    const payslip = await prisma.payslip.findUnique({
      where: { id: req.params.id },
      include: {
        staff: true,
        payroll: { include: { deductions: { include: { deductionType: true } } } },
      },
    });

    if (!payslip) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    res.json(payslip);
  } catch (err) {
    console.error("Error fetching payslip:", err);
    res.status(500).json({ error: "Failed to fetch payslip" });
  }
});

export const payrollRouter = router;
