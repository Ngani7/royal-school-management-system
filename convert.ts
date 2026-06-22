import ExcelJS from "exceljs";
import * as fs from "fs";

async function convertToExcel() {
  // Read CSV from your desktop/wherever you saved it
  const csvPath = "students.csv"; // Put your CSV in project root
  
  if (!fs.existsSync(csvPath)) {
    console.error("❌ students.csv not found! Place it in project root first.");
    return;
  }

  const csvData = fs.readFileSync(csvPath, "utf-8");
  const lines = csvData.trim().split("\n");

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Students");

  // Add header
  worksheet.columns = [
    { header: "First Name", key: "firstName", width: 15 },
    { header: "Last Name", key: "lastName", width: 15 },
    { header: "Gender", key: "gender", width: 10 },
  ];

  // Parse and add rows
  let imported = 0;
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    const firstName = parts[0]?.trim() || "";
    const lastName = parts[1]?.trim() || "";
    const gender = parts[2]?.trim().replace(/["\t]/g, "") || "M";

    if (firstName && lastName) {
      worksheet.addRow({
        firstName,
        lastName,
        gender: gender || "M",
      });
      imported++;
    }
  }

  // Save
  await workbook.xlsx.writeFile("students.xlsx");
  console.log(`✅ Done! Created students.xlsx with ${imported} students`);
}

convertToExcel().catch(console.error);
