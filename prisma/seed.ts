import { PrismaClient } from "@prisma/client";
import * as path from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const excelPath = path.join(__dirname, "../students.xlsx");

  console.log(`📁 Reading: ${excelPath}`);

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(excelPath);
  } catch (error) {
    console.error("❌ Error reading Excel file:", error.message);
    console.error("Make sure students.xlsx exists in project root");
    return;
  }

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    console.error("❌ No worksheet found in Excel file");
    return;
  }

  console.log(`📥 Starting import...`);

  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  worksheet.eachRow(async (row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    try {
      const firstName = row.getCell(1).value?.toString().trim() || "";
      const lastName = row.getCell(2).value?.toString().trim() || "";
      const gender = row.getCell(3).value?.toString().trim() || "M";

      if (!firstName || !lastName) {
        console.warn(`⚠️  Row ${rowNumber}: Missing name (${firstName} ${lastName})`);
        failed++;
        return;
      }

      const count = await prisma.student.count();
      const admNo = `ADM-${Date.now()}-${count + imported + 1}`;

      await prisma.student.create({
        data: {
          firstName,
          lastName,
          admissionNumber: admNo,
          gender: gender.toUpperCase() || "M",
          dateOfBirth: "2010-01-01",
          enrollmentDate: new Date().toISOString().split("T")[0],
          schoolLevel: "PRIMARY",
          academicYear: "2026",
          parentGuardianName: "To be assigned",
          parentGuardianPhone: "N/A",
          parentGuardianEmail: "N/A",
          residentialAddress: "N/A",
          status: "ACTIVE",
        },
      });

      imported++;
      console.log(`✅ Row ${rowNumber}: ${firstName} ${lastName} (${admNo})`);
    } catch (error) {
      console.error(`❌ Row ${rowNumber}: ${error.message}`);
      errors.push(`Row ${rowNumber}: ${error.message}`);
      failed++;
    }
  });

  // Wait for all rows to process
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`\n📊 Import Summary:`);
  console.log(`✅ Imported: ${imported}`);
  console.log(`❌ Failed: ${failed}`);

  if (errors.length > 0) {
    console.log(`\nErrors:`);
    errors.forEach((err) => console.log(`  - ${err}`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
