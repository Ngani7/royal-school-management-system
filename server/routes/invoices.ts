import { Router, Request, Response, RequestHandler } from "express";
import { prisma } from "../db.js";
import { authenticateJWT, requireRole } from "./auth.js";

export const invoiceRouter = Router();

// ==========================================
// GENERATE AUTO INVOICE NUMBER
// ==========================================
async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}-`,
      },
    },
  });
  const number = String(count + 1).padStart(4, "0");
  return `INV-${year}-${number}`;
}

// ==========================================
// GET /invoices - list all invoices
// ==========================================
invoiceRouter.get("/", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const { status, studentId, termId } = req.query;

    const where: any = {};
    if (status) where.status = String(status);
    if (studentId) where.studentId = String(studentId);
    if (termId) where.termId = String(termId);

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        student: { include: { class: true } },
        academicTerm: true,
      },
      orderBy: { issueDate: "desc" },
    });

    return res.json(invoices);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// GET /invoices/:id - single invoice details
// ==========================================
invoiceRouter.get("/:id", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        student: { include: { class: true } },
        academicTerm: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    return res.json(invoice);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// POST /invoices - create invoice for student
// ==========================================
invoiceRouter.post("/", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { studentId, termId, amountDue, dueDate, description } = req.body;

    if (!studentId || !termId || !amountDue) {
      return res.status(400).json({ error: "studentId, termId, and amountDue are required" });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Verify term exists
    const term = await prisma.academicTerm.findUnique({ where: { id: termId } });
    if (!term) {
      return res.status(404).json({ error: "Academic term not found" });
    }

    // Check if invoice already exists for this student+term
    const existing = await prisma.invoice.findFirst({
      where: { studentId, termId },
    });

    if (existing) {
      return res.status(400).json({ error: "Invoice already exists for this student in this term" });
    }

    const invoiceNumber = await generateInvoiceNumber();
    const today = new Date().toISOString().split("T")[0];
    const dueDateStr = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId,
        termId,
        amountDue: Number(amountDue),
        status: "ISSUED",
        issueDate: today,
        dueDate: dueDateStr,
        description: description || "Term Fees",
      },
      include: {
        student: { include: { class: true } },
        academicTerm: true,
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        action: "INVOICE_CREATED",
        details: `Invoice ${invoiceNumber} created for ${student.firstName} ${student.lastName} - Amount: ZMW ${amountDue}`,
      },
    });

    return res.status(201).json(invoice);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// POST /invoices/bulk - create invoices for entire class
// ==========================================
invoiceRouter.post("/bulk", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { classId, termId, amountDue, dueDate, description } = req.body;

    if (!classId || !termId || !amountDue) {
      return res.status(400).json({ error: "classId, termId, and amountDue are required" });
    }

    // Get all students in this class
    const students = await prisma.student.findMany({
      where: { classId, status: "ACTIVE" },
    });

    if (students.length === 0) {
      return res.status(404).json({ error: "No active students found in this class" });
    }

    const today = new Date().toISOString().split("T")[0];
    const dueDateStr = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const createdInvoices = [];

    for (const student of students) {
      // Check if invoice already exists
      const existing = await prisma.invoice.findFirst({
        where: { studentId: student.id, termId },
      });

      if (existing) continue; // Skip if already invoiced

      const invoiceNumber = await generateInvoiceNumber();

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          studentId: student.id,
          termId,
          amountDue: Number(amountDue),
          status: "ISSUED",
          issueDate: today,
          dueDate: dueDateStr,
          description: description || "Term Fees",
        },
        include: {
          student: { include: { class: true } },
          academicTerm: true,
        },
      });

      createdInvoices.push(invoice);
    }

    // Activity log
    await prisma.activityLog.create({
      data: {
        action: "BULK_INVOICE_CREATED",
        details: `Created ${createdInvoices.length} invoices for class - Amount per student: ZMW ${amountDue}`,
      },
    });

    return res.status(201).json({
      message: `Created ${createdInvoices.length} invoices`,
      invoices: createdInvoices,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// PATCH /invoices/:id - update invoice status
// ==========================================
invoiceRouter.patch("/:id", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, amountPaid, notes } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(amountPaid !== undefined && { amountPaid: Number(amountPaid) }),
        ...(notes && { notes }),
      },
      include: {
        student: { include: { class: true } },
        academicTerm: true,
      },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// DELETE /invoices/:id - delete invoice
// ==========================================
invoiceRouter.delete("/:id", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.invoice.delete({ where: { id } });
    return res.json({ message: "Invoice deleted" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// GET /invoices/student/:studentId - student's invoices
// ==========================================
invoiceRouter.get("/student/:studentId", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const invoices = await prisma.invoice.findMany({
      where: { studentId },
      include: {
        student: { include: { class: true } },
        academicTerm: true,
      },
      orderBy: { issueDate: "desc" },
    });

    return res.json(invoices);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// GET /invoices/summary/all - outstanding invoices summary
// ==========================================
invoiceRouter.get("/summary/all", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } },
      include: {
        student: { include: { class: true } },
        academicTerm: true,
      },
    });

    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.amountDue - inv.amountPaid), 0);
    const issuedCount = invoices.filter(i => i.status === "ISSUED").length;
    const partialCount = invoices.filter(i => i.status === "PARTIAL").length;
    const overdueCount = invoices.filter(i => i.status === "OVERDUE").length;

    return res.json({
      totalOutstanding,
      totalInvoices: invoices.length,
      issuedCount,
      partialCount,
      overdueCount,
      invoices,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// GET /invoices/:id/pdf - download single invoice as PDF (NO TOKEN REQUIRED - public endpoint)
// ==========================================
invoiceRouter.get("/:id/pdf", (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        student: { include: { class: true } },
        academicTerm: true,
      },
    });

    if (!invoice) {
      return res.status(404).send("<h1>Invoice not found</h1>");
    }

    // Create HTML invoice
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
            .container { max-width: 700px; margin: auto; }
            .header { background: #0a1f14; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; color: #c9a84c; }
            .content { border: 1px solid #e5e7eb; padding: 30px; background: white; }
            .row { display: flex; justify-content: space-between; margin: 12px 0; font-size: 14px; }
            .label { font-weight: 600; color: #6b7280; }
            .value { text-align: right; }
            .separator { border-top: 1px solid #e5e7eb; margin: 20px 0; padding-top: 20px; }
            .section-title { font-weight: 600; color: #111827; margin-top: 20px; margin-bottom: 10px; font-size: 14px; }
            .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin: 15px 0; }
            .outstanding { background: #fef3c7; padding: 20px; border-radius: 4px; margin-top: 20px; border-left: 4px solid #f59e0b; }
            .outstanding-label { color: #92400e; font-weight: 600; font-size: 14px; }
            .outstanding-amount { color: #92400e; font-size: 28px; font-weight: bold; margin-top: 10px; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
            .status-issued { background: #fee2e2; color: #991b1b; }
            .status-partial { background: #fef3c7; color: #92400e; }
            .status-paid { background: #dcfce7; color: #166534; }
            .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            @media print { body { margin: 0; padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ROYAL SCHOOL - LUSAKA</h1>
              <p>FEE INVOICE STATEMENT</p>
            </div>
            
            <div class="content">
              <div class="row">
                <span class="label">Invoice Number:</span>
                <span class="value">${invoice.invoiceNumber}</span>
              </div>
              
              <div class="row">
                <span class="label">Invoice Date:</span>
                <span class="value">${invoice.issueDate}</span>
              </div>
              
              <div class="row">
                <span class="label">Due Date:</span>
                <span class="value">${invoice.dueDate}</span>
              </div>
              
              <div class="separator"></div>
              
              <div class="section-title">STUDENT INFORMATION</div>
              <div class="row">
                <span class="label">Student Name:</span>
                <span class="value">${invoice.student.firstName} ${invoice.student.lastName}</span>
              </div>
              
              <div class="row">
                <span class="label">Admission Number:</span>
                <span class="value">${invoice.student.admissionNumber}</span>
              </div>
              
              <div class="row">
                <span class="label">Class/Grade:</span>
                <span class="value">${invoice.student.class.name}</span>
              </div>
              
              <div class="row">
                <span class="label">Academic Term:</span>
                <span class="value">${invoice.academicTerm.name}</span>
              </div>
              
              <div class="separator"></div>
              
              <div class="section-title">INVOICE DETAILS</div>
              <div class="row">
                <span class="label">Description:</span>
                <span class="value">${invoice.description}</span>
              </div>
              
              <div class="separator"></div>
              
              <div class="total-row">
                <span>Amount Due:</span>
                <span>K ${invoice.amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div class="total-row">
                <span>Amount Paid:</span>
                <span style="color: #15803d;">K ${invoice.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div class="outstanding">
                <div class="outstanding-label">OUTSTANDING BALANCE DUE</div>
                <div class="outstanding-amount">K ${(invoice.amountDue - invoice.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
              
              <div style="margin-top: 20px;">
                <span class="status-badge status-${invoice.status.toLowerCase()}">
                  ${invoice.status}
                </span>
              </div>
              
              ${invoice.notes ? `
                <div style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-left: 3px solid #0284c7; border-radius: 4px;">
                  <strong style="color: #0c4a6e;">Notes:</strong>
                  <p style="margin: 8px 0 0 0; color: #0c4a6e; font-size: 13px;">${invoice.notes}</p>
                </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p>💳 Payments can be made directly to: Mt. Makulu Standard Chartered Bank | Account: 59302-ROYAL</p>
              <p>This is an official invoice from Royal School Lusaka. For inquiries, contact the school bursar.</p>
              <p style="margin-top: 10px; color: #d1d5db;">Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename=Invoice_${invoice.invoiceNumber}.html`);
    res.send(html);
  } catch (err: any) {
    console.error("Invoice PDF error:", err);
    return res.status(500).send("<h1>Error generating invoice</h1>");
  }
}) as RequestHandler);
