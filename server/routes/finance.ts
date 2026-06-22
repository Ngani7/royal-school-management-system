import { Router, Request, Response, RequestHandler } from "express";
import { prisma } from "../db.js";
import { authenticateJWT, requireRole } from "./auth.js";

export const financeRouter = Router();

// ==========================================
// POST /finance/payments - UPDATED TO SYNC WITH INVOICES
// ==========================================
financeRouter.post("/payments", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { studentId, amount, method, reference, category } = req.body;

    console.log("=== PAYMENT API RECEIVED ===");
    console.log("Body:", req.body);

    if (!studentId || !amount) {
      return res.status(400).json({ error: "Student ID and amount are required" });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ error: "Amount must be greater than zero" });
    }

    // Get active academic term
    const activeTerm = await prisma.academicTerm.findFirst({
      where: { isActive: true },
    });

    if (!activeTerm) {
      return res.status(400).json({ error: "No active academic term configured" });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Auto generate receipt number
    const rand = Math.floor(100000 + Math.random() * 900000);
    const receiptNumber = `RCPT-${new Date().getFullYear()}-${rand}`;
    const today = new Date().toISOString().split("T")[0];

    // 1. Record payment in Payment table (old system)
    const payment = await prisma.payment.create({
      data: {
        studentId,
        amount: Number(amount),
        paymentMethod: method || "CASH",
        receiptNumber,
        date: today,
        feesPaid: Number(amount),
        balance: 0, // Will be calculated
        academicTermId: activeTerm.id,
        verified: true,
      },
      include: {
        student: { include: { class: true } },
        academicTerm: true,
      },
    });

    // 2. UPDATE INVOICES - Apply payment to outstanding invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        studentId,
        termId: activeTerm.id,
        status: { in: ["ISSUED", "PARTIAL"] }, // Only update unpaid/partial invoices
      },
      orderBy: { issueDate: "asc" }, // Pay oldest invoices first
    });

    let remainingPayment = Number(amount);

    for (const invoice of invoices) {
      if (remainingPayment <= 0) break;

      const outstandingAmount = invoice.amountDue - invoice.amountPaid;

      if (outstandingAmount <= 0) continue; // Skip if already paid

      // Calculate how much to apply to this invoice
      const paymentToApply = Math.min(remainingPayment, outstandingAmount);

      // Update invoice
      const newAmountPaid = invoice.amountPaid + paymentToApply;
      let newStatus = invoice.status;

      // Determine new status
      if (newAmountPaid >= invoice.amountDue) {
        newStatus = "PAID";
      } else if (newAmountPaid > 0) {
        newStatus = "PARTIAL";
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus,
        },
      });

      remainingPayment -= paymentToApply;

      console.log(`✓ Applied K${paymentToApply} to invoice ${invoice.invoiceNumber}`);
    }

    // Activity log
    await prisma.activityLog.create({
      data: {
        action: "PAYMENT_RECORDED",
        details: `Payment of ZMW ${amount} recorded for ${student.firstName} ${student.lastName}. Receipt: ${receiptNumber}`,
      },
    });

    console.log("✓ Payment recorded and invoices updated");

    return res.status(201).json({
      ...payment,
      message: "Payment recorded and invoices updated",
    });
  } catch (err: any) {
    console.error("Payment error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// GET /finance/summary
// ==========================================
financeRouter.get("/summary", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
    if (!activeTerm) {
      return res.status(400).json({ error: "No active academic term configured" });
    }

    const paymentsThisTerm = await prisma.payment.findMany({
      where: { academicTermId: activeTerm.id },
      include: { student: { include: { class: true } } },
    });

    const totalCollected = paymentsThisTerm.reduce((sum, p) => sum + p.amount, 0);

    // Calculate totals from invoices
    const invoices = await prisma.invoice.findMany({
      where: { termId: activeTerm.id },
    });

    const totalOutstanding = invoices
      .filter(i => i.status !== "PAID")
      .reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);

    return res.json({
      activeTerm,
      totalCollectedThisTerm: totalCollected,
      totalOutstanding,
      currentTermTarget: invoices.reduce((sum, i) => sum + i.amountDue, 0),
      paymentCount: paymentsThisTerm.length,
      recentPayments: paymentsThisTerm.slice(0, 10),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// GET /finance/fee-structures
// ==========================================
financeRouter.get("/fee-structures", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const structures = await prisma.feeStructure.findMany({
      include: { class: true },
    });
    return res.json(structures);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// POST /finance/fee-structures
// ==========================================
financeRouter.post("/fee-structures", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { classId, termId, amount, description } = req.body;
    if (!classId || !termId || amount === undefined || !description) {
      return res.status(400).json({ error: "Class, Term, Amount, and Description are required" });
    }

    const structure = await prisma.feeStructure.create({
      data: {
        classId,
        termId,
        amount: Number(amount),
        description,
      },
      include: { class: true },
    });

    return res.status(201).json(structure);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// GET /finance/payments
// ==========================================
financeRouter.get("/payments", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: { include: { class: true } },
        academicTerm: true,
      },
      orderBy: { date: "desc" },
    });
    return res.json(payments);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// GET /finance/students/:id/balance
// ==========================================
financeRouter.get("/students/:id/balance", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
    if (!activeTerm) {
      return res.status(400).json({ error: "Active term not ready" });
    }

    // Get invoices for this student
    const invoices = await prisma.invoice.findMany({
      where: { studentId: id, termId: activeTerm.id },
    });

    const feesDue = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const feesPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const outstandingBalance = feesDue - feesPaid;

    return res.json({
      feesDue,
      feesPaid,
      outstandingBalance: Math.max(0, outstandingBalance),
      invoiceCount: invoices.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);
