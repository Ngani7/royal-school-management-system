import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

export const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log("Checking database seed state...");

  // 1. Seed Academic Term
  let activeTerm = await prisma.academicTerm.findFirst({
    where: { isActive: true },
  });

  if (!activeTerm) {
    activeTerm = await prisma.academicTerm.create({
      data: {
        name: "Term 2 - 2026",
        startDate: "2026-05-04",
        endDate: "2026-08-07",
        isActive: true,
      },
    });
    console.log("Created default academic term:", activeTerm.name);
  }

  // 2. Seed Default Classes (Zambian School Structure)
  const defaultClasses = [
    { name: "Baby Class", schoolLevel: "ECE", capacity: 25 },
    { name: "Middle Class", schoolLevel: "ECE", capacity: 25 },
    { name: "Reception", schoolLevel: "ECE", capacity: 30 },
    { name: "Grade 1", schoolLevel: "PRIMARY", capacity: 40 },
    { name: "Grade 2", schoolLevel: "PRIMARY", capacity: 40 },
    { name: "Grade 3", schoolLevel: "PRIMARY", capacity: 40 },
    { name: "Grade 4", schoolLevel: "PRIMARY", capacity: 40 },
    { name: "Grade 5", schoolLevel: "PRIMARY", capacity: 40 },
    { name: "Grade 6", schoolLevel: "PRIMARY", capacity: 40 },
    { name: "Grade 7", schoolLevel: "PRIMARY", capacity: 40 },
    { name: "Form 1A", schoolLevel: "SECONDARY", capacity: 35 },
    { name: "Form 1B", schoolLevel: "SECONDARY", capacity: 35 },
    { name: "Form 2", schoolLevel: "SECONDARY", capacity: 35 },
    { name: "Grade 10", schoolLevel: "SECONDARY", capacity: 45 },
    { name: "Grade 11", schoolLevel: "SECONDARY", capacity: 45 },
    { name: "Grade 12", schoolLevel: "SECONDARY", capacity: 45 },
  ];

  for (const c of defaultClasses) {
    const existing = await prisma.class.findUnique({ where: { name: c.name } });
    if (!existing) {
      const createdClass = await prisma.class.create({
        data: {
          name: c.name,
          schoolLevel: c.schoolLevel,
          capacity: c.capacity,
          academicYear: "2026",
          status: "ACTIVE",
          classTeacher: "TBD",
        },
      });

      // Every class gets at least Stream A by default
      await prisma.stream.create({
        data: {
          name: "Stream A",
          classId: createdClass.id,
          teacher: "TBD",
        },
      });
      
      // Secondary classes might get Stream B
      if (c.name.startsWith("Grade 10") || c.name.startsWith("Form")) {
        await prisma.stream.create({
          data: {
            name: "Stream B",
            classId: createdClass.id,
            teacher: "TBD",
          },
        });
      }
    }
  }
  console.log("Zambian school classes seeded successfully.");

  // 3. Seed Default Subjects (Check by CODE, not name)
  const defaultSubjects = [
    { name: "Mathematics", code: "MATH" },
    { name: "English Language", code: "ENG" },
    { name: "Integrated Science", code: "SCI" },
    { name: "Social Studies", code: "SST" },
    { name: "Chinyanja / Bemba", code: "LANG" },
    { name: "Home Economics", code: "HE" },
    { name: "Religious Education", code: "RE" },
    { name: "Geography", code: "GEO" },
    { name: "Civic Education", code: "CIV" },
  ];

  for (const sub of defaultSubjects) {
    const existing = await prisma.subject.findUnique({
      where: { code: sub.code },
    });
    if (!existing) {
      await prisma.subject.create({
        data: {
          name: sub.name,
          code: sub.code,
        },
      });
    }
  }
  console.log("Default subjects seeded successfully.");

  // 4. Seed Default Users (Admin & Finance)
  const adminUser = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!adminUser) {
    const hashed = await bcryptjs.hash("admin123", 10);
    await prisma.user.create({
      data: {
        username: "admin",
        password: hashed,
        role: "ADMIN",
        name: "Administrator",
        status: "ACTIVE", 
      },
    });
    console.log("✓ Created ADMIN user. Credentials: admin / admin123");
  }

  // Create Finance User (Bursar)
  const financeUser = await prisma.user.findUnique({ where: { username: "finance" } });
  if (!financeUser) {
    const hashed = await bcryptjs.hash("finance123", 10);
    await prisma.user.create({
      data: {
        username: "finance",
        password: hashed,
        role: "FINANCE",
        name: "School Bursar",
        status: "ACTIVE",
      },
    });
    console.log("✓ Created FINANCE user. Credentials: finance / finance123");
  }

  // 5. Seed Deduction Types (Zambian Payroll)
  const deductionTypes = [
    {
      name: "NAPSA",
      code: "NAPSA",
      type: "PERCENTAGE",
      rate: 5,
      description: "National Pension Scheme Authority - 5% employee contribution (employer contributes another 5%)",
    },
    {
      name: "NHIMA",
      code: "NHIMA",
      type: "PERCENTAGE",
      rate: 2,
      description: "National Health Insurance Management Authority - 2% of gross salary",
    },
    {
      name: "PAYE Tax",
      code: "PAYE",
      type: "CALCULATION",
      rate: null,
      description: "Pay As You Earn Income Tax - calculated based on income",
    },
    {
      name: "Loan Deduction",
      code: "LOAN",
      type: "FIXED",
      rate: 0,
      description: "Employee loan repayment (custom amount)",
    },
    {
      name: "Other Deduction",
      code: "OTHER",
      type: "FIXED",
      rate: 0,
      description: "Other voluntary or mandatory deductions",
    },
  ];

  for (const dt of deductionTypes) {
    const existing = await prisma.deductionType.findUnique({
      where: { name: dt.name },
    });
    if (!existing) {
      await prisma.deductionType.create({
        data: {
          name: dt.name,
          code: dt.code,
          type: dt.type,
          rate: dt.rate,
          description: dt.description,
        },
      });
    }
  }
  console.log("Payroll deduction types seeded successfully.");

  // 6. Seed Salary Scales
  const salaryScales = [
    {
      name: "Head Teacher",
      baseSalary: 8500,
      description: "Principal/Head Teacher salary scale",
    },
    {
      name: "Senior Teacher",
      baseSalary: 6500,
      description: "Senior/Lead Teacher salary scale",
    },
    {
      name: "Teacher Grade 1",
      baseSalary: 5000,
      description: "Qualified Teacher Grade 1",
    },
    {
      name: "Teacher Grade 2",
      baseSalary: 4200,
      description: "Qualified Teacher Grade 2",
    },
    {
      name: "Finance Officer",
      baseSalary: 5500,
      description: "School Finance/Bursar Officer",
    },
    {
      name: "Administration Staff",
      baseSalary: 3500,
      description: "Administrative and support staff",
    },
    {
      name: "Casual Laborer",
      baseSalary: 2000,
      description: "Casual labor and support workers",
    },
  ];

  for (const scale of salaryScales) {
    const existing = await prisma.salaryScale.findUnique({
      where: { name: scale.name },
    });
    if (!existing) {
      await prisma.salaryScale.create({
        data: {
          name: scale.name,
          baseSalary: scale.baseSalary,
          description: scale.description,
        },
      });
    }
  }
  console.log("Salary scales seeded successfully.");

  console.log("✓ Database seed run checks finished successfully.");
}
